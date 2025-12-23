import { NextRequest, NextResponse } from "next/server"
import { requireAuth, getClientIP, getUserAgent } from "@/lib/security/middleware"
import { checkRateLimit, API_RATE_LIMITS } from "@/lib/security/rate-limit"
import { sanitizeText, sanitizeEmail } from "@/lib/security/sanitize"
import { campaignSchema } from "@/lib/security/validation"
import { secureLogger } from "@/lib/security/logger"
import { prisma } from "@/lib/prisma"
import { z } from "zod"

export async function POST(req: NextRequest) {
  // 認証チェック
  const { error: authError, session } = await requireAuth(req)
  if (authError) return authError

  // レート制限チェック
  const rateLimit = checkRateLimit(req, {
    ...API_RATE_LIMITS.general,
    keyGenerator: (r) => `campaign:${session!.user.id}`,
  })

  if (!rateLimit.allowed) {
    return NextResponse.json(
      { error: "Rate limit exceeded", code: "RATE_LIMIT_EXCEEDED" },
      {
        status: 429,
        headers: {
          "X-RateLimit-Limit": String(API_RATE_LIMITS.general.maxRequests),
          "X-RateLimit-Remaining": String(rateLimit.remaining),
        },
      }
    )
  }

  try {
    const body = await req.json()
    
    // サニタイゼーション
    const sanitizedBody = {
      ...body,
      name: sanitizeText(body.name),
      subjectTemplate: sanitizeText(body.subjectTemplate),
      bodyTemplate: sanitizeText(body.bodyTemplate),
      fromName: sanitizeText(body.fromName),
      fromEmail: sanitizeEmail(body.fromEmail) || body.fromEmail,
      signature: body.signature ? sanitizeText(body.signature) : undefined,
      unsubscribeText: body.unsubscribeText ? sanitizeText(body.unsubscribeText) : undefined,
    }
    
    const validated = campaignSchema.parse(sanitizedBody)

    const campaign = await prisma.campaign.create({
      data: {
        ...validated,
        createdBy: session.user.id,
        status: "DRAFT",
      },
    })

    // 監査ログ
    await prisma.auditLog.create({
      data: {
        userId: session!.user.id,
        action: "CAMPAIGN_CREATE",
        entityType: "Campaign",
        entityId: campaign.id,
        campaignId: campaign.id,
        payload: { name: campaign.name },
        ipAddress: getClientIP(req),
        userAgent: getUserAgent(req),
      },
    })

    secureLogger.info("Campaign created", {
      userId: session!.user.id,
      campaignId: campaign.id,
      ip: getClientIP(req),
    })

    return NextResponse.json(campaign)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Validation error", code: "VALIDATION_ERROR", details: error.errors }, { status: 400 })
    }
    secureLogger.error("Campaign creation error", error, {
      userId: session!.user.id,
      ip: getClientIP(req),
    })
    return NextResponse.json({ error: "Internal server error", code: "INTERNAL_ERROR" }, { status: 500 })
  }
}

export async function GET(req: NextRequest) {
  // 認証チェック
  const { error: authError, session } = await requireAuth(req)
  if (authError) return authError

  // レート制限チェック
  const rateLimit = checkRateLimit(req, API_RATE_LIMITS.general)
  if (!rateLimit.allowed) {
    return NextResponse.json(
      { error: "Rate limit exceeded", code: "RATE_LIMIT_EXCEEDED" },
      { status: 429 }
    )
  }

  try {
    const campaigns = await prisma.campaign.findMany({
      where: {
        createdBy: session!.user.id, // 自分のキャンペーンのみ
      },
      orderBy: { createdAt: "desc" },
    })

    return NextResponse.json(campaigns)
  } catch (error) {
    secureLogger.error("Campaign list error", error, {
      userId: session!.user.id,
      ip: getClientIP(req),
    })
    return NextResponse.json({ error: "Internal server error", code: "INTERNAL_ERROR" }, { status: 500 })
  }
}

