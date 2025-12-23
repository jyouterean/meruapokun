/**
 * セキュリティ設定の確認用エンドポイント（開発環境のみ）
 */
import { NextRequest, NextResponse } from "next/server"
import { requireAuth } from "@/lib/security/middleware"
import { validateEnv } from "@/lib/security/env"

export async function GET(req: NextRequest) {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ error: "Not available in production" }, { status: 403 })
  }

  // 認証チェック
  const { error: authError } = await requireAuth(req)
  if (authError) return authError

  const envCheck = validateEnv()

  return NextResponse.json({
    security: {
      environment: process.env.NODE_ENV,
      envValidation: envCheck.success,
      headers: {
        csp: "enabled",
        // このエンドポイントは本番環境では 403 を返すため、ここでは常に "disabled"
        hsts: "disabled",
        xssProtection: "enabled",
      },
    },
    recommendations: envCheck.success
      ? []
      : [
          "環境変数の検証に失敗しました。.env.localファイルを確認してください。",
        ],
  })
}

