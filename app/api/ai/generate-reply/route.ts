import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { generateEmail } from "@/lib/ai/openai"

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const { campaignId, leadId, threadKey } = await req.json()

    const [campaign, lead, messages] = await Promise.all([
      prisma.campaign.findUnique({ where: { id: campaignId } }),
      prisma.lead.findUnique({ where: { id: leadId } }),
      prisma.emailMessage.findMany({
        where: { threadKey: threadKey || undefined },
        orderBy: { createdAt: "desc" },
        take: 5,
      }),
    ])

    if (!campaign || !lead) {
      return NextResponse.json({ error: "Not found" }, { status: 404 })
    }

    // スレッドの要約を作成
    const context = messages
      .map((m) => `${m.direction === "OUTBOUND" ? "送信" : "受信"}: ${m.subject}\n${m.textBody || m.htmlBody?.replace(/<[^>]*>/g, "")}`)
      .join("\n\n---\n\n")

    const generated = await generateEmail({
      lead,
      campaign,
      context,
    })

    // 監査ログ
    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: "AI_GENERATE_REPLY",
        entityType: "EmailMessage",
        campaignId,
        payload: {
          leadId,
          threadKey,
          prompt: context,
        },
      },
    })

    return NextResponse.json(generated)
  } catch (error) {
    console.error("Generate reply error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

