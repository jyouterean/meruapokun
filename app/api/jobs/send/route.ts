import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getEmailProvider } from "@/lib/email"
import { buildEmailContent } from "@/lib/email/template"
import { generateEmail } from "@/lib/ai/openai"
import crypto from "crypto"

// レート制限チェック
async function checkRateLimit(campaignId: string): Promise<boolean> {
  const campaign = await prisma.campaign.findUnique({
    where: { id: campaignId },
  })

  if (!campaign) return false

  const now = new Date()
  const oneMinuteAgo = new Date(now.getTime() - 60 * 1000)
  const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000)

  // 1分あたりの制限
  const sentLastMinute = await prisma.emailMessage.count({
    where: {
      campaignId,
      sentAt: { gte: oneMinuteAgo },
      status: { in: ["SENT", "DELIVERED"] },
    },
  })

  if (sentLastMinute >= campaign.rateLimitPerMin) {
    return false
  }

  // 1日あたりの制限
  const sentLastDay = await prisma.emailMessage.count({
    where: {
      campaignId,
      sentAt: { gte: oneDayAgo },
      status: { in: ["SENT", "DELIVERED"] },
    },
  })

  if (sentLastDay >= campaign.rateLimitPerDay) {
    return false
  }

  return true
}

export async function POST(req: NextRequest) {
  // 認証: APIキーまたは内部呼び出しのみ
  const authHeader = req.headers.get("authorization")
  if (authHeader !== `Bearer ${process.env.CRON_SECRET || "secret"}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const provider = getEmailProvider()
    const batchSize = 10 // 一度に処理する件数

    // 送信待ちのキューを取得
    const queues = await prisma.sendQueue.findMany({
      where: {
        status: "PENDING",
        scheduledAt: { lte: new Date() },
      },
      include: {
        campaign: true,
        lead: true,
      },
      take: batchSize,
      orderBy: { scheduledAt: "asc" },
    })

    const results = []

    for (const queue of queues) {
      try {
        // レート制限チェック
        if (!(await checkRateLimit(queue.campaignId))) {
          // 次のバッチで再試行
          continue
        }

        // 配信停止チェック
        const unsubscribed = await prisma.unsubscribe.findUnique({
          where: { email: queue.lead.email },
        })

        if (unsubscribed) {
          await prisma.sendQueue.update({
            where: { id: queue.id },
            data: { status: "CANCELLED" },
          })
          continue
        }

        // キューを処理中に更新
        await prisma.sendQueue.update({
          where: { id: queue.id },
          data: { status: "PROCESSING" },
        })

        // 配信停止トークン生成
        const unsubscribeToken = crypto.randomBytes(32).toString("hex")
        await prisma.unsubscribe.upsert({
          where: { email: queue.lead.email },
          update: {},
          create: {
            email: queue.lead.email,
            leadId: queue.leadId,
            token: unsubscribeToken,
          },
        })

        // メール内容生成
        let subject: string
        let html: string
        let text: string

        if (queue.campaign.useAI) {
          const generated = await generateEmail({
            lead: queue.lead,
            campaign: queue.campaign,
          })
          subject = generated.subject
          html = generated.html
          text = generated.text
        } else {
          const content = buildEmailContent(queue.campaign, queue.lead, unsubscribeToken)
          subject = content.subject
          html = content.html
          text = content.text
        }

        // メール送信
        const result = await provider.sendEmail({
          from: {
            email: queue.campaign.fromEmail,
            name: queue.campaign.fromName,
          },
          to: {
            email: queue.lead.email,
            name: queue.lead.contactName || undefined,
          },
          subject,
          html,
          text,
          customArgs: {
            campaignId: queue.campaignId,
            leadId: queue.leadId,
          },
        })

        // EmailMessage作成
        const emailMessage = await prisma.emailMessage.create({
          data: {
            campaignId: queue.campaignId,
            leadId: queue.leadId,
            messageId: result.messageId,
            direction: "OUTBOUND",
            subject,
            htmlBody: html,
            textBody: text,
            fromEmail: queue.campaign.fromEmail,
            fromName: queue.campaign.fromName,
            toEmail: queue.lead.email,
            toName: queue.lead.contactName || undefined,
            status: "SENT",
            sentAt: new Date(),
            providerId: result.providerId,
          },
        })

        // キューを完了に更新
        await prisma.sendQueue.update({
          where: { id: queue.id },
          data: {
            status: "SENT",
            emailMessageId: emailMessage.id,
          },
        })

        // リードステータス更新
        await prisma.lead.update({
          where: { id: queue.leadId },
          data: { status: "CONTACTED" },
        })

        results.push({ queueId: queue.id, status: "sent" })
      } catch (error) {
        console.error(`Error processing queue ${queue.id}:`, error)

        // リトライ処理
        const retryCount = queue.retryCount + 1
        if (retryCount < queue.maxRetries) {
          const backoffDelay = Math.pow(2, retryCount) * 60 * 1000 // 指数バックオフ
          await prisma.sendQueue.update({
            where: { id: queue.id },
            data: {
              status: "PENDING",
              retryCount,
              nextRetryAt: new Date(Date.now() + backoffDelay),
            },
          })
        } else {
          await prisma.sendQueue.update({
            where: { id: queue.id },
            data: {
              status: "FAILED",
              errorMessage: error instanceof Error ? error.message : "Unknown error",
            },
          })

          // EmailMessageを失敗として記録
          await prisma.emailMessage.create({
            data: {
              campaignId: queue.campaignId,
              leadId: queue.leadId,
              direction: "OUTBOUND",
              subject: queue.campaign.subjectTemplate,
              fromEmail: queue.campaign.fromEmail,
              fromName: queue.campaign.fromName,
              toEmail: queue.lead.email,
              status: "FAILED",
              errorMessage: error instanceof Error ? error.message : "Unknown error",
            },
          })
        }

        results.push({ queueId: queue.id, status: "failed", error: String(error) })
      }
    }

    return NextResponse.json({ processed: results.length, results })
  } catch (error) {
    console.error("Send job error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

