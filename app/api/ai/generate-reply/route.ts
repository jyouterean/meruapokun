import { NextRequest, NextResponse } from "next/server"
import { requireAuth, getClientIP, getUserAgent, checkResourceOwnership } from "@/lib/security/middleware"
import { checkRateLimit, API_RATE_LIMITS } from "@/lib/security/rate-limit"
import { validateID } from "@/lib/security/validation"
import { secureLogger } from "@/lib/security/logger"
import { prisma } from "@/lib/prisma"
import { generateEmail } from "@/lib/ai/openai"

export async function POST(req: NextRequest) {
  // 認証チェック
  const { error: authError, session } = await requireAuth(req)
  if (authError) return authError

  // レート制限チェック（AI生成は制限を厳しく）
  const rateLimit = checkRateLimit(req, {
    ...API_RATE_LIMITS.ai,
    keyGenerator: (r) => `ai:${session!.user.id}`,
  })

  if (!rateLimit.allowed) {
    secureLogger.warn("AI generation rate limit exceeded", {
      userId: session!.user.id,
      ip: getClientIP(req),
    })
    return NextResponse.json(
      { error: "Rate limit exceeded", code: "RATE_LIMIT_EXCEEDED" },
      {
        status: 429,
        headers: {
          "X-RateLimit-Limit": String(API_RATE_LIMITS.ai.maxRequests),
          "X-RateLimit-Remaining": String(rateLimit.remaining),
        },
      }
    )
  }

  try {
    const { campaignId, leadId, threadKey } = await req.json()

    // ID検証
    if (!validateID(campaignId) || !validateID(leadId)) {
      return NextResponse.json({ error: "Invalid ID format", code: "INVALID_ID" }, { status: 400 })
    }

    // リソース所有権チェック
    const hasAccess = await checkResourceOwnership(session!.user.id, "campaign", campaignId)
    if (!hasAccess) {
      secureLogger.warn("Unauthorized campaign access attempt", {
        userId: session!.user.id,
        campaignId,
        ip: getClientIP(req),
      })
      return NextResponse.json({ error: "Forbidden", code: "FORBIDDEN" }, { status: 403 })
    }

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
      .map((m: { direction: string; subject: string; textBody: string | null; htmlBody: string | null }) => {
        const direction = m.direction === "OUTBOUND" ? "送信" : "受信"
        const body = m.textBody || m.htmlBody?.replace(/<[^>]*>/g, "") || ""
        return `${direction}: ${m.subject}\n${body}`
      })
      .join("\n\n---\n\n")

    const generated = await generateEmail({
      lead,
      campaign,
      context,
    })

    // 監査ログ
    await prisma.auditLog.create({
      data: {
        userId: session!.user.id,
        action: "AI_GENERATE_REPLY",
        entityType: "EmailMessage",
        campaignId,
        payload: {
          leadId,
          threadKey,
          // プロンプトはマスキングせずに保存（監査用）
        },
        ipAddress: getClientIP(req),
        userAgent: getUserAgent(req),
      },
    })

    secureLogger.info("AI reply generated", {
      userId: session!.user.id,
      campaignId,
      leadId,
      ip: getClientIP(req),
    })

    return NextResponse.json(generated)
  } catch (error) {
    secureLogger.error("AI generation error", error, {
      userId: session!.user.id,
      ip: getClientIP(req),
    })
    return NextResponse.json({ error: "Internal server error", code: "INTERNAL_ERROR" }, { status: 500 })
  }
}

