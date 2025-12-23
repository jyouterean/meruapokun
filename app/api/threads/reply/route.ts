import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { getEmailProvider } from "@/lib/email"
import crypto from "crypto"

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const { campaignId, leadId, threadKey, subject, html, text } = await req.json()

    const [campaign, lead] = await Promise.all([
      prisma.campaign.findUnique({ where: { id: campaignId } }),
      prisma.lead.findUnique({ where: { id: leadId } }),
    ])

    if (!campaign || !lead) {
      return NextResponse.json({ error: "Not found" }, { status: 404 })
    }

    const provider = getEmailProvider()

    // メール送信
    const result = await provider.sendEmail({
      from: {
        email: campaign.fromEmail,
        name: campaign.fromName,
      },
      to: {
        email: lead.email,
        name: lead.contactName || undefined,
      },
      subject,
      html,
      text,
      customArgs: {
        campaignId,
        leadId,
        threadKey,
      },
    })

    // EmailMessage作成
    await prisma.emailMessage.create({
      data: {
        campaignId,
        leadId,
        messageId: result.messageId,
        threadKey,
        direction: "OUTBOUND",
        subject,
        htmlBody: html,
        textBody: text,
        fromEmail: campaign.fromEmail,
        fromName: campaign.fromName,
        toEmail: lead.email,
        toName: lead.contactName || undefined,
        status: "SENT",
        sentAt: new Date(),
        providerId: result.providerId,
      },
    })

    // 監査ログ
    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: "THREAD_REPLY_SEND",
        entityType: "EmailMessage",
        entityId: threadKey,
        campaignId,
        payload: { subject },
      },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Thread reply error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

