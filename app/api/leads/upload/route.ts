import { NextRequest, NextResponse } from "next/server"
import { requireAuth, getClientIP, getUserAgent } from "@/lib/security/middleware"
import { checkRateLimit, API_RATE_LIMITS } from "@/lib/security/rate-limit"
import { sanitizeEmail, sanitizeURL, sanitizeText } from "@/lib/security/sanitize"
import { csvRowSchema, validateID } from "@/lib/security/validation"
import { secureLogger } from "@/lib/security/logger"
import { prisma } from "@/lib/prisma"
import { z } from "zod"

export async function POST(req: NextRequest) {
  // 認証チェック
  const { error: authError, session } = await requireAuth(req)
  if (authError) return authError

  // レート制限チェック
  const rateLimit = checkRateLimit(req, {
    ...API_RATE_LIMITS.upload,
    keyGenerator: (r) => `upload:${session!.user.id}`,
  })

  if (!rateLimit.allowed) {
    secureLogger.warn("Rate limit exceeded", {
      userId: session!.user.id,
      ip: getClientIP(req),
      action: "LEAD_UPLOAD",
    })
    return NextResponse.json(
      { error: "Rate limit exceeded", code: "RATE_LIMIT_EXCEEDED" },
      {
        status: 429,
        headers: {
          "X-RateLimit-Limit": String(API_RATE_LIMITS.upload.maxRequests),
          "X-RateLimit-Remaining": String(rateLimit.remaining),
          "X-RateLimit-Reset": String(rateLimit.resetAt),
        },
      }
    )
  }

  try {
    const { data } = await req.json()
    
    if (!Array.isArray(data)) {
      return NextResponse.json({ error: "Invalid data format", code: "INVALID_FORMAT" }, { status: 400 })
    }

    // データ量制限（一度に1000件まで）
    if (data.length > 1000) {
      return NextResponse.json(
        { error: "Too many records. Maximum 1000 records per request.", code: "TOO_MANY_RECORDS" },
        { status: 400 }
      )
    }

    const results = {
      created: 0,
      skipped: 0,
      errors: [] as string[],
    }

    for (const item of data) {
      try {
        // サニタイゼーション
        const email = sanitizeEmail(item.email || item.Email || item.EMAIL || "")
        if (!email) {
          results.errors.push(`Invalid email: ${item.email || "unknown"}`)
          results.skipped++
          continue
        }

        const websiteUrl = item.websiteUrl || item.website_url || item["サイトURL"]
        const sanitizedUrl = websiteUrl ? sanitizeURL(websiteUrl) : undefined

        const validated = csvRowSchema.parse({
          email,
          companyName: item.companyName || item.company_name || item["会社名"]
            ? sanitizeText(item.companyName || item.company_name || item["会社名"])
            : undefined,
          contactName: item.contactName || item.contact_name || item["担当者名"]
            ? sanitizeText(item.contactName || item.contact_name || item["担当者名"])
            : undefined,
          position: item.position || item["役職"]
            ? sanitizeText(item.position || item["役職"])
            : undefined,
          industry: item.industry || item["業種"]
            ? sanitizeText(item.industry || item["業種"])
            : undefined,
          websiteUrl: sanitizedUrl || undefined,
          memo: item.memo || item["メモ"]
            ? sanitizeText(item.memo || item["メモ"])
            : undefined,
          tags: item.tags ? item.tags.split(",").map((t: string) => sanitizeText(t.trim())).filter(Boolean) : [],
        })

        await prisma.lead.upsert({
          where: { email: validated.email },
          update: {
            companyName: validated.companyName,
            contactName: validated.contactName,
            position: validated.position,
            industry: validated.industry,
            websiteUrl: validated.websiteUrl || undefined,
            memo: validated.memo,
            tags: validated.tags || [],
          },
          create: {
            email: validated.email,
            companyName: validated.companyName,
            contactName: validated.contactName,
            position: validated.position,
            industry: validated.industry,
            websiteUrl: validated.websiteUrl || undefined,
            memo: validated.memo,
            tags: validated.tags || [],
            status: "NEW",
          },
        })

        results.created++
      } catch (error) {
        const rawEmail = item.email || item.Email || item.EMAIL || "unknown"

        if (error instanceof z.ZodError) {
          results.errors.push(`Validation error for email: ${rawEmail}`)
        } else {
          secureLogger.error("Lead upload processing error", error, {
            userId: session!.user.id,
            ip: getClientIP(req),
          })
          results.errors.push(`Processing error for email: ${rawEmail}`)
        }
        results.skipped++
      }
    }

    secureLogger.info("Lead upload completed", {
      userId: session!.user.id,
      ip: getClientIP(req),
      created: results.created,
      skipped: results.skipped,
    })

    return NextResponse.json(results)
  } catch (error) {
    secureLogger.error("Lead upload error", error, {
      userId: session!.user.id,
      ip: getClientIP(req),
      userAgent: getUserAgent(req),
    })
    return NextResponse.json({ error: "Internal server error", code: "INTERNAL_ERROR" }, { status: 500 })
  }
}

