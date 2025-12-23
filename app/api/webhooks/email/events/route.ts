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

    // イベント解析（元のRequestを使用）
    const events = await provider.parseWebhookEvent(req)

    for (const event of events) {
      // EmailMessageを検索（messageIdまたはemailで）
      const emailMessage = await prisma.emailMessage.findFirst({
        where: {
          OR: [
            { messageId: event.messageId },
            { toEmail: event.email, direction: "OUTBOUND" },
          ],
        },
        include: { campaign: true, lead: true },
      })

      if (!emailMessage) {
        console.warn(`EmailMessage not found for event: ${event.messageId}`)
        continue
      }

      // イベント保存
      await prisma.event.create({
        data: {
          campaignId: emailMessage.campaignId,
          leadId: emailMessage.leadId,
          emailMessageId: emailMessage.id,
          type: event.type.toUpperCase() as any,
          data: event.data,
          createdAt: event.timestamp,
        },
      })

      // ステータス更新
      if (event.type === "bounce") {
        await Promise.all([
          prisma.emailMessage.update({
            where: { id: emailMessage.id },
            data: { status: "BOUNCED" },
          }),
          prisma.lead.update({
            where: { id: emailMessage.leadId },
            data: { status: "BOUNCED" },
          }),
        ])
      } else if (event.type === "delivered") {
        await prisma.emailMessage.update({
          where: { id: emailMessage.id },
          data: { status: "DELIVERED", deliveredAt: event.timestamp },
        })
      } else if (event.type === "unsubscribe") {
        await prisma.unsubscribe.upsert({
          where: { email: event.email },
          update: {},
          create: {
            email: event.email,
            leadId: emailMessage.leadId,
            token: crypto.randomBytes(32).toString("hex"),
          },
        })
        await prisma.lead.update({
          where: { id: emailMessage.leadId },
          data: { status: "UNSUBSCRIBED" },
        })
      } else if (event.type === "reply") {
        await prisma.lead.update({
          where: { id: emailMessage.leadId },
          data: { status: "REPLIED" },
        })
      }
    }

    return NextResponse.json({ received: events.length })
  } catch (error) {
    console.error("Webhook error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

