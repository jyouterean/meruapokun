import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { sendMail } from "@/lib/mailer"
import crypto from "crypto"

const DEFAULT_BATCH_SIZE = 50
const DEFAULT_LOCK_TTL_SECONDS = 540
const DEFAULT_MAX_ATTEMPTS = 5
const DEFAULT_BACKOFF_MINUTES = [5, 15, 60, 360]

function getEnvNumber(name: string, defaultValue: number): number {
  const raw = process.env[name]
  if (!raw) return defaultValue
  const n = Number(raw)
  return Number.isFinite(n) && n > 0 ? n : defaultValue
}

function getBackoffMinutes(): number[] {
  const raw = process.env.WORKER_RETRY_BACKOFF_MINUTES
  if (!raw) return DEFAULT_BACKOFF_MINUTES
  const parts = raw.split(",").map((p) => Number(p.trim())).filter((n) => Number.isFinite(n) && n > 0)
  return parts.length > 0 ? parts : DEFAULT_BACKOFF_MINUTES
}

export async function handler(req: NextRequest) {
  const start = Date.now()
  const requestId = crypto.randomUUID()

  // 認証
  const authHeader = req.headers.get("authorization")
  const cronSecret = process.env.CRON_SECRET
  if (!cronSecret || cronSecret.length < 16) {
    return NextResponse.json(
      { ok: false, error: "CRON_SECRET not configured", code: "CONFIG_ERROR", requestId },
      { status: 500 },
    )
  }
  if (authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json(
      { ok: false, error: "Unauthorized", code: "AUTH_REQUIRED", requestId },
      { status: 401 },
    )
  }

  const batchSize = getEnvNumber("WORKER_BATCH_SIZE", DEFAULT_BATCH_SIZE)
  const lockTtlSeconds = getEnvNumber("WORKER_LOCK_TTL_SECONDS", DEFAULT_LOCK_TTL_SECONDS)
  const maxAttemptsDefault = getEnvNumber("WORKER_MAX_ATTEMPTS", DEFAULT_MAX_ATTEMPTS)
  const backoffMinutes = getBackoffMinutes()

  const now = new Date()
  const lockExpiredBefore = new Date(now.getTime() - lockTtlSeconds * 1000)

  try {
    // 対象レコード取得
    const candidates = await prisma.emailQueue.findMany({
      where: {
        status: { in: ["QUEUED", "FAILED"] },
        nextAttemptAt: { lte: now },
        attempts: { lt: maxAttemptsDefault },
        OR: [{ lockedAt: null }, { lockedAt: { lt: lockExpiredBefore } }],
      },
      orderBy: { createdAt: "asc" },
      take: batchSize,
    })

    const locked: typeof candidates = []

    // ロック取得（楽観的ロック）
    for (const item of candidates) {
      const updated = await prisma.emailQueue.updateMany({
        where: {
          id: item.id,
          status: { in: ["QUEUED", "FAILED"] },
          OR: [{ lockedAt: null }, { lockedAt: { lt: lockExpiredBefore } }],
        },
        data: {
          status: "SENDING",
          lockedAt: now,
          lockOwner: requestId,
        },
      })
      if (updated.count === 1) {
        locked.push(item)
      }
    }

    const results: Array<{ id: string; to: string; status: string; error?: string }> = []
    let sent = 0
    let failed = 0

    for (const item of locked) {
      try {
        const mailResult = await sendMail({
          to: item.to,
          subject: item.subject,
          text: item.text || undefined,
          html: item.html || undefined,
        })

        await prisma.emailQueue.update({
          where: { id: item.id },
          data: {
            status: "SENT",
            sentAt: new Date(),
            providerMessageId: mailResult.messageId,
            lockedAt: null,
            lockOwner: null,
            lastError: null,
          },
        })

        sent++
        results.push({ id: item.id, to: item.to, status: "SENT" })
      } catch (error: any) {
        const attempts = item.attempts + 1
        const maxAttempts = item.maxAttempts || maxAttemptsDefault
        const isFinal = attempts >= maxAttempts

        const backoffIndex = Math.min(attempts - 1, backoffMinutes.length - 1)
        const delayMinutes = backoffMinutes[backoffIndex] || backoffMinutes[backoffMinutes.length - 1]
        const nextAttemptAt = new Date(now.getTime() + delayMinutes * 60 * 1000)

        await prisma.emailQueue.update({
          where: { id: item.id },
          data: {
            status: isFinal ? "FAILED" : "FAILED",
            attempts,
            nextAttemptAt: isFinal ? nextAttemptAt : nextAttemptAt,
            lastError: error instanceof Error ? error.message : String(error),
            lockedAt: null,
            lockOwner: null,
          },
        })

        failed++
        results.push({
          id: item.id,
          to: item.to,
          status: "FAILED",
          error: error instanceof Error ? error.message : String(error),
        })
      }
    }

    const durationMs = Date.now() - start

    return NextResponse.json({
      ok: true,
      requestId,
      processed: locked.length,
      sent,
      failed,
      durationMs,
      items: results,
    })
  } catch (error: any) {
    const durationMs = Date.now() - start
    return NextResponse.json(
      {
        ok: false,
        requestId,
        error: error instanceof Error ? error.message : String(error),
        durationMs,
      },
      { status: 500 },
    )
  }
}

export const GET = handler
export const POST = handler


