import { NextRequest, NextResponse } from "next/server"
import { sendMail } from "@/lib/mailer"
import crypto from "crypto"
import { prisma } from "@/lib/prisma"

/**
 * ログインリンク送信API
 * SMTP設定を検証し、ログインリンクをメールで送信
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}))
    const email = String(body.email ?? "").trim()

    if (!email) {
      return NextResponse.json(
        { error: "email is required", detail: "メールアドレスが必要です" },
        { status: 400 }
      )
    }

    // メールアドレスの形式チェック
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: "invalid email format", detail: "メールアドレスの形式が正しくありません" },
        { status: 400 }
      )
    }

    // SMTP設定の検証
    const missing = ["SMTP_HOST", "SMTP_USER", "SMTP_PASSWORD", "SMTP_FROM"].filter(
      (k) => !process.env[k]
    )

    if (missing.length > 0) {
      return NextResponse.json(
        {
          error: "SMTP settings are missing",
          detail: `以下の環境変数が設定されていません: ${missing.join(", ")}`,
          missing,
        },
        { status: 500 }
      )
    }

    // NextAuthのトークン生成（簡易版）
    const baseUrl = process.env.NEXTAUTH_URL || process.env.APP_BASE_URL || "http://localhost:3000"
    const token = crypto.randomBytes(32).toString("hex")
    const expires = new Date(Date.now() + 24 * 60 * 60 * 1000) // 24時間

    // データベースにトークンを保存（NextAuthのVerificationTokenテーブルを使用）
    try {
      // 既存のトークンを削除（同じidentifierの古いトークン）
      await prisma.verificationToken.deleteMany({
        where: { identifier: email },
      })

      // 新しいトークンを作成
      await prisma.verificationToken.create({
        data: {
          identifier: email,
          token,
          expires,
        },
      })
    } catch (dbError: any) {
      // データベースエラーでもメール送信は試みる
      console.warn("Failed to save verification token:", dbError)
    }

    // ログインリンクURL（NextAuthの標準フォーマット）
    const callbackUrl = `${baseUrl}/api/auth/callback/email?email=${encodeURIComponent(email)}&token=${token}&callbackUrl=${encodeURIComponent(`${baseUrl}/dashboard`)}`

    // メール送信
    try {
      await sendMail({
        to: email,
        subject: "メールくん - ログインリンク",
        text: `以下のリンクをクリックしてログインしてください:\n\n${callbackUrl}\n\nこのリンクは24時間有効です。`,
        html: `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
            <h2>メールくん - ログインリンク</h2>
            <p>以下のリンクをクリックしてログインしてください:</p>
            <p><a href="${callbackUrl}" style="display: inline-block; padding: 10px 20px; background-color: #6366f1; color: white; text-decoration: none; border-radius: 5px;">ログイン</a></p>
            <p style="color: #666; font-size: 12px;">このリンクは24時間有効です。</p>
            <p style="color: #666; font-size: 12px;">このメールに心当たりがない場合は、無視してください。</p>
          </div>
        `,
      })

      return NextResponse.json(
        {
          message: "ログインリンクを送信しました。メールをご確認ください。",
          success: true,
        },
        { status: 200 }
      )
    } catch (smtpError: any) {
      // SMTP送信エラー
      console.error("SMTP send error:", smtpError)
      return NextResponse.json(
        {
          error: "Failed to send email",
          detail: smtpError?.message || "メール送信に失敗しました。SMTP設定を確認してください。",
        },
        { status: 500 }
      )
    }
  } catch (e: any) {
    console.error("Magic link API error:", e)
    return NextResponse.json(
      {
        error: "Internal Server Error",
        detail: e?.message || String(e) || "予期しないエラーが発生しました",
      },
      { status: 500 }
    )
  }
}

