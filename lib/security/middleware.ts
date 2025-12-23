import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

/**
 * 認証チェックミドルウェア
 */
export async function requireAuth(req: NextRequest) {
  const session = await getServerSession(authOptions)
  
  if (!session?.user?.id) {
    return {
      error: NextResponse.json(
        { error: "Unauthorized", code: "AUTH_REQUIRED" },
        { status: 401 }
      ),
      session: null,
    }
  }

  return { error: null, session }
}

/**
 * リソース所有権チェック
 */
export async function checkResourceOwnership(
  userId: string,
  resourceType: "campaign" | "lead" | "emailMessage",
  resourceId: string
): Promise<boolean> {
  try {
    switch (resourceType) {
      case "campaign":
        const campaign = await prisma.campaign.findUnique({
          where: { id: resourceId },
          select: { createdBy: true },
        })
        return campaign?.createdBy === userId

      case "lead":
        // リードは全ユーザーが閲覧可能（将来的に権限管理を追加可能）
        return true

      case "emailMessage":
        const emailMessage = await prisma.emailMessage.findUnique({
          where: { id: resourceId },
          include: { campaign: { select: { createdBy: true } } },
        })
        return emailMessage?.campaign.createdBy === userId

      default:
        return false
    }
  } catch (error) {
    console.error("Resource ownership check error:", error)
    return false
  }
}

/**
 * IPアドレス取得（プロキシ対応）
 */
export function getClientIP(req: NextRequest): string {
  const forwarded = req.headers.get("x-forwarded-for")
  const realIP = req.headers.get("x-real-ip")
  
  if (forwarded) {
    return forwarded.split(",")[0].trim()
  }
  
  return realIP || req.ip || "unknown"
}

/**
 * User-Agent取得
 */
export function getUserAgent(req: NextRequest): string {
  return req.headers.get("user-agent") || "unknown"
}

