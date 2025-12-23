/**
 * ローカル開発環境でのWebhookテスト用エンドポイント
 * 本番環境では削除または無効化してください
 */

import { NextRequest, NextResponse } from "next/server"

export async function GET(req: NextRequest) {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ error: "Not available in production" }, { status: 403 })
  }

  return NextResponse.json({
    message: "Webhookテストエンドポイント",
    webhookUrls: {
      events: `${process.env.APP_BASE_URL || "http://localhost:3000"}/api/webhooks/email/events`,
      inbound: `${process.env.APP_BASE_URL || "http://localhost:3000"}/api/webhooks/email/inbound`,
    },
    instructions: [
      "1. SendGridの管理画面で上記のURLをWebhookに設定",
      "2. ngrokを使用してローカルサーバーを公開（推奨）",
      "3. または、SendGridのテスト機能を使用",
    ],
  })
}

export async function POST(req: NextRequest) {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ error: "Not available in production" }, { status: 403 })
  }

  try {
    const body = await req.json()
    return NextResponse.json({
      received: true,
      data: body,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 })
  }
}

