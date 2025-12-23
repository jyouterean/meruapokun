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
    // キャンペーンステータスを停止に更新
    await prisma.campaign.update({
      where: { id: campaignId },
      data: { status: "STOPPED" },
    })

    // 未送信のキューをキャンセル
    await prisma.sendQueue.updateMany({
      where: {
        campaignId,
        status: "PENDING",
      },
      data: {
        status: "CANCELLED",
      },
    })

    // 監査ログ
    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: "CAMPAIGN_STOP",
        entityType: "Campaign",
        entityId: campaignId,
        campaignId,
        payload: {},
      },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Campaign stop error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

