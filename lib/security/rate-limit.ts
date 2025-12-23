import { NextRequest } from "next/server"

interface RateLimitStore {
  [key: string]: {
    count: number
    resetAt: number
  }
}

// メモリベースのレート制限ストア（本番環境ではRedis等を使用推奨）
const store: RateLimitStore = {}

interface RateLimitOptions {
  windowMs: number // 時間窓（ミリ秒）
  maxRequests: number // 最大リクエスト数
  keyGenerator?: (req: NextRequest) => string // キー生成関数
}

/**
 * レート制限チェック
 */
export function checkRateLimit(
  req: NextRequest,
  options: RateLimitOptions
): { allowed: boolean; remaining: number; resetAt: number } {
  const key = options.keyGenerator
    ? options.keyGenerator(req)
    : getDefaultKey(req)

  const now = Date.now()
  const windowStart = now - options.windowMs

  // 古いエントリをクリーンアップ
  if (store[key] && store[key].resetAt < now) {
    delete store[key]
  }

  // 新しいエントリまたはリセット後のエントリ
  if (!store[key] || store[key].resetAt < now) {
    store[key] = {
      count: 1,
      resetAt: now + options.windowMs,
    }
    return {
      allowed: true,
      remaining: options.maxRequests - 1,
      resetAt: store[key].resetAt,
    }
  }

  // 既存エントリのカウント増加
  store[key].count++

  const allowed = store[key].count <= options.maxRequests

  return {
    allowed,
    remaining: Math.max(0, options.maxRequests - store[key].count),
    resetAt: store[key].resetAt,
  }
}

/**
 * デフォルトキー生成（IP + パス）
 */
function getDefaultKey(req: NextRequest): string {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0] || req.ip || "unknown"
  const path = req.nextUrl.pathname
  return `${ip}:${path}`
}

/**
 * ユーザーIDベースのキー生成
 */
export function getUserKey(req: NextRequest, userId: string): string {
  return `user:${userId}:${req.nextUrl.pathname}`
}

/**
 * APIエンドポイント用のレート制限設定
 */
export const API_RATE_LIMITS = {
  // 認証エンドポイント: 5分間に10回
  auth: { windowMs: 5 * 60 * 1000, maxRequests: 10 },
  
  // 一般API: 1分間に60回
  general: { windowMs: 60 * 1000, maxRequests: 60 },
  
  // ファイルアップロード: 1分間に5回
  upload: { windowMs: 60 * 1000, maxRequests: 5 },
  
  // AI生成: 1分間に10回
  ai: { windowMs: 60 * 1000, maxRequests: 10 },
  
  // Webhook: 1分間に100回（外部サービスからの呼び出し）
  webhook: { windowMs: 60 * 1000, maxRequests: 100 },
}

