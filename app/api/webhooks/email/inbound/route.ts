import { NextRequest, NextResponse } from "next/server"
import { getEmailProvider } from "@/lib/email"
import { prisma } from "@/lib/prisma"
import crypto from "crypto"

export async function POST(req: NextRequest) {
  try {
    const provider = getEmailProvider()

    // Webhook署名検証（Requestをクローンして使用）
    const clonedReq = req.clone()
    const isValid = await provider.verifyWebhook(clonedReq)
    if (!isValid) {
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 })
    }

    // 受信メール解析（元のRequestを使用）
    const inbound = await provider.parseInboundEmail(req)

    // リードを検索
    const lead = await prisma.lead.findUnique({
      where: { email: inbound.to },
    })

    if (!lead) {
      console.warn(`Lead not found for email: ${inbound.to}`)
      return NextResponse.json({ error: "Lead not found" }, { status: 404 })
    }

    // スレッドを特定（In-Reply-ToまたはReferences）
    let threadKey: string | undefined
    let campaignId: string | undefined

    if (inbound.inReplyTo) {
      const parentMessage = await prisma.emailMessage.findFirst({
        where: {
          OR: [
            { messageId: inbound.inReplyTo },
            { providerId: inbound.inReplyTo },
          ],
        },
        include: { campaign: true },
      })

      if (parentMessage) {
        threadKey = parentMessage.threadKey || parentMessage.id
        campaignId = parentMessage.campaignId
      }
    }

    // スレッドキーが無い場合は新規作成
    if (!threadKey) {
      threadKey = crypto.randomBytes(16).toString("hex")
    }

    // EmailMessage作成
    const emailMessage = await prisma.emailMessage.create({
      data: {
        campaignId: campaignId || "", // キャンペーンが特定できない場合は空文字
        leadId: lead.id,
        messageId: inbound.messageId,
        inReplyTo: inbound.inReplyTo,
        references: inbound.references,
        threadKey,
        direction: "INBOUND",
        subject: inbound.subject,
        htmlBody: inbound.html,
        textBody: inbound.text,
        fromEmail: inbound.from,
        toEmail: inbound.to,
        status: "DELIVERED",
        deliveredAt: new Date(),
      },
    })

    // イベント記録
    await prisma.event.create({
      data: {
        campaignId: campaignId || "",
        leadId: lead.id,
        emailMessageId: emailMessage.id,
        type: "REPLY",
        data: { inbound: true },
      },
    })

    // リードステータス更新
    await prisma.lead.update({
      where: { id: lead.id },
      data: { status: "REPLIED" },
    })

    return NextResponse.json({ received: true, messageId: emailMessage.id })
  } catch (error) {
    console.error("Inbound webhook error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

