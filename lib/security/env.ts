import { z } from "zod"

/**
 * 環境変数検証スキーマ
 */
const envSchema = z.object({
  // Database
  DATABASE_URL: z.string().url(),
  
  // NextAuth
  NEXTAUTH_URL: z.string().url(),
  NEXTAUTH_SECRET: z.string().min(32),
  
  // Email Provider
  EMAIL_PROVIDER: z.enum(["sendgrid", "ses", "gmail"]).optional(),
  SENDGRID_API_KEY: z.string().min(1).optional(),
  SENDGRID_FROM_EMAIL: z.string().email().optional(),
  SENDGRID_FROM_NAME: z.string().min(1).optional(),
  
  // AWS SES
  AWS_REGION: z.string().optional(),
  AWS_ACCESS_KEY_ID: z.string().optional(),
  AWS_SECRET_ACCESS_KEY: z.string().optional(),
  
  // OpenAI
  OPENAI_API_KEY: z.string().min(1).optional(),
  
  // Webhook
  WEBHOOK_SIGNING_SECRET: z.string().min(32).optional(),
  
  // App
  APP_BASE_URL: z.string().url().optional(),
  APP_COMPANY_NAME: z.string().min(1).optional(),
  APP_COMPANY_ADDRESS: z.string().optional(),
  
  // Cron
  CRON_SECRET: z.string().min(32).optional(),
  
  // Node Environment
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
})

/**
 * 環境変数の検証
 */
export function validateEnv(): { success: boolean; errors?: z.ZodError } {
  try {
    envSchema.parse(process.env)
    return { success: true }
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error("環境変数の検証に失敗しました:", error.errors)
      return { success: false, errors: error }
    }
    return { success: false }
  }
}

/**
 * 起動時の環境変数チェック
 * ビルド時はスキップ（環境変数が完全に設定されていない可能性があるため）
 */
export function checkEnvOnStartup() {
  // ビルド時はスキップ（NEXT_PHASE または VERCEL のビルド環境を検出）
  if (
    process.env.NEXT_PHASE === 'phase-production-build' ||
    process.env.VERCEL_ENV === undefined // Vercelのビルド時は VERCEL_ENV が未設定の可能性
  ) {
    return
  }

  // 本番環境のランタイム時のみ検証（Vercelの本番環境では VERCEL_ENV=production）
  if (process.env.NODE_ENV === "production" && typeof window === "undefined") {
    const result = validateEnv()
    if (!result.success) {
      console.error("❌ 環境変数の検証に失敗しました。アプリケーションを起動できません。")
      process.exit(1)
    }
  }
}

