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
  EMAIL_PROVIDER: z.enum(["sendgrid", "ses", "gmail"]),
  SENDGRID_API_KEY: z.string().min(1).optional(),
  SENDGRID_FROM_EMAIL: z.string().email(),
  SENDGRID_FROM_NAME: z.string().min(1),
  
  // AWS SES
  AWS_REGION: z.string().optional(),
  AWS_ACCESS_KEY_ID: z.string().optional(),
  AWS_SECRET_ACCESS_KEY: z.string().optional(),
  
  // OpenAI
  OPENAI_API_KEY: z.string().min(1),
  
  // Webhook
  WEBHOOK_SIGNING_SECRET: z.string().min(32),
  
  // App
  APP_BASE_URL: z.string().url(),
  APP_COMPANY_NAME: z.string().min(1),
  APP_COMPANY_ADDRESS: z.string().optional(),
  
  // Cron
  CRON_SECRET: z.string().min(32),
  
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
 */
export function checkEnvOnStartup() {
  if (process.env.NODE_ENV === "production") {
    const result = validateEnv()
    if (!result.success) {
      console.error("❌ 環境変数の検証に失敗しました。アプリケーションを起動できません。")
      process.exit(1)
    }
  }
}

