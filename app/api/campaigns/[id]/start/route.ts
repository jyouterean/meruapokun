import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const campaignId = params.id

  try {
    const campaign = await prisma.campaign.findUnique({
      where: { id: campaignId },
    })

    if (!campaign) {
      return NextResponse.json({ error: "Campaign not found" }, { status: 404 })
    }

    // 配信停止済み・連絡不可のリードを除外
    const eligibleLeads = await prisma.lead.findMany({
      where: {
        status: {
          notIn: ["UNSUBSCRIBED", "DO_NOT_CONTACT"],
        },
      },
    })

    // 既に送信済みのリードを除外（重複送信防止）
    const sentLeads = await prisma.emailMessage.findMany({
      where: {
        campaignId,
        direction: "OUTBOUND",
        status: { in: ["SENT", "DELIVERED"] },
      },
      select: { leadId: true },
    })

    const sentLeadIds = new Set(sentLeads.map((e) => e.leadId))
    const leadsToQueue = eligibleLeads.filter((lead) => !sentLeadIds.has(lead.id))

    // 送信キューに追加
    const queues = await Promise.all(
      leadsToQueue.map((lead, index) => {
        const delay = campaign.randomDelayMin + Math.random() * (campaign.randomDelayMax - campaign.randomDelayMin)
        const scheduledAt = new Date(Date.now() + index * delay * 1000)

        return prisma.sendQueue.create({
          data: {
            campaignId,
            leadId: lead.id,
            scheduledAt,
            status: "PENDING",
          },
        })
      })
    )

    // キャンペーンステータスを更新
    await prisma.campaign.update({
      where: { id: campaignId },
      data: { status: "RUNNING" },
    })

    // 監査ログ
    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: "CAMPAIGN_START",
        entityType: "Campaign",
        entityId: campaignId,
        campaignId,
        payload: { queueCount: queues.length },
      },
    })

    return NextResponse.json({ queued: queues.length })
  } catch (error) {
    console.error("Campaign start error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

