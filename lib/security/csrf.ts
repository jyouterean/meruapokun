import { NextRequest } from "next/server"
import crypto from "crypto"

/**
 * CSRFトークンの生成
 */
export function generateCSRFToken(): string {
  return crypto.randomBytes(32).toString("hex")
}

/**
 * CSRFトークンの検証
 */
export function verifyCSRFToken(req: NextRequest, token: string): boolean {
  const headerToken = req.headers.get("x-csrf-token")
  if (!headerToken) return false
  
  // タイミング攻撃対策
  return crypto.timingSafeEqual(
    Buffer.from(headerToken),
    Buffer.from(token)
  )
}

/**
 * SameSite Cookie設定（NextAuthで自動設定されるが、追加の防御層）
 */
export function getCSRFHeaders(): Record<string, string> {
  return {
    "X-Content-Type-Options": "nosniff",
    "X-Frame-Options": "DENY",
  }
}

