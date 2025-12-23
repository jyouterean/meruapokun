import { maskEmail, maskSecret } from "./sanitize"

type LogLevel = "info" | "warn" | "error" | "debug"

interface LogContext {
  userId?: string
  ip?: string
  userAgent?: string
  action?: string
  [key: string]: any
}

/**
 * セキュアなロガー（個人情報をマスキング）
 */
class SecureLogger {
  private shouldMask: boolean

  constructor() {
    this.shouldMask = process.env.NODE_ENV === "production"
  }

  private maskSensitiveData(data: any): any {
    if (!this.shouldMask) return data

    if (typeof data === "string") {
      // メールアドレスのマスキング
      if (data.includes("@")) {
        return maskEmail(data)
      }
      // トークンのマスキング
      if (data.length > 20 && /^[a-zA-Z0-9_-]+$/.test(data)) {
        return maskSecret(data)
      }
    }

    if (typeof data === "object" && data !== null) {
      const masked: any = Array.isArray(data) ? [] : {}
      
      for (const [key, value] of Object.entries(data)) {
        // 機密情報を含む可能性のあるキー
        if (["email", "token", "password", "apiKey", "secret", "key"].some(k => 
          key.toLowerCase().includes(k)
        )) {
          if (typeof value === "string") {
            masked[key] = key.toLowerCase().includes("email") 
              ? maskEmail(value)
              : maskSecret(value)
          } else {
            masked[key] = value
          }
        } else {
          masked[key] = this.maskSensitiveData(value)
        }
      }
      
      return masked
    }

    return data
  }

  private formatMessage(level: LogLevel, message: string, context?: LogContext): string {
    const timestamp = new Date().toISOString()
    const maskedContext = context ? this.maskSensitiveData(context) : {}
    
    return JSON.stringify({
      timestamp,
      level,
      message,
      ...maskedContext,
    })
  }

  info(message: string, context?: LogContext) {
    console.log(this.formatMessage("info", message, context))
  }

  warn(message: string, context?: LogContext) {
    console.warn(this.formatMessage("warn", message, context))
  }

  error(message: string, error?: Error | unknown, context?: LogContext) {
    const errorInfo = error instanceof Error
      ? { error: error.message, stack: error.stack }
      : { error: String(error) }
    
    console.error(this.formatMessage("error", message, { ...errorInfo, ...context }))
  }

  debug(message: string, context?: LogContext) {
    if (process.env.NODE_ENV === "development") {
      console.debug(this.formatMessage("debug", message, context))
    }
  }
}

export const secureLogger = new SecureLogger()

