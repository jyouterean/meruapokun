import { NextResponse } from "next/server"

/**
 * セキュリティヘッダーを設定
 */
export function setSecurityHeaders(response: NextResponse): NextResponse {
  // XSS対策
  response.headers.set("X-Content-Type-Options", "nosniff")
  response.headers.set("X-Frame-Options", "DENY")
  response.headers.set("X-XSS-Protection", "1; mode=block")
  
  // Referrer Policy
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin")
  
  // Permissions Policy
  response.headers.set(
    "Permissions-Policy",
    "geolocation=(), microphone=(), camera=()"
  )
  
  // Content Security Policy
  const csp = [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval'", // Next.js用（本番では厳格化）
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: https:",
    "font-src 'self' data:",
    "connect-src 'self'",
    "frame-ancestors 'none'",
  ].join("; ")
  
  response.headers.set("Content-Security-Policy", csp)
  
  // HSTS（本番環境のみ）
  if (process.env.NODE_ENV === "production") {
    response.headers.set(
      "Strict-Transport-Security",
      "max-age=31536000; includeSubDomains; preload"
    )
  }
  
  return response
}

/**
 * CORS設定（必要に応じて）
 */
export function setCORSHeaders(response: NextResponse): NextResponse {
  const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(",") || []
  const origin = process.env.APP_BASE_URL || "http://localhost:3000"
  
  response.headers.set("Access-Control-Allow-Origin", origin)
  response.headers.set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
  response.headers.set("Access-Control-Allow-Headers", "Content-Type, Authorization")
  response.headers.set("Access-Control-Max-Age", "86400")
  
  return response
}

