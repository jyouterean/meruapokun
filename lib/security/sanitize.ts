import DOMPurify from "isomorphic-dompurify"

/**
 * HTMLサニタイゼーション
 */
export function sanitizeHTML(html: string): string {
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS: ["p", "br", "strong", "em", "u", "a", "ul", "ol", "li"],
    ALLOWED_ATTR: ["href"],
    ALLOW_DATA_ATTR: false,
  })
}

/**
 * テキストのサニタイゼーション（XSS対策）
 */
export function sanitizeText(text: string): string {
  return text
    .replace(/[<>]/g, "") // HTMLタグ文字を削除
    .replace(/javascript:/gi, "") // javascript:プロトコルを削除
    .replace(/on\w+=/gi, "") // イベントハンドラを削除
    .trim()
}

/**
 * メールアドレスの検証とサニタイゼーション
 */
export function sanitizeEmail(email: string): string | null {
  const cleaned = email.trim().toLowerCase()
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  
  if (!emailRegex.test(cleaned)) {
    return null
  }
  
  // 追加のセキュリティチェック
  if (cleaned.length > 254) {
    return null // RFC 5321の最大長
  }
  
  return cleaned
}

/**
 * URLの検証とサニタイゼーション
 */
export function sanitizeURL(url: string): string | null {
  try {
    const cleaned = url.trim()
    
    // プロトコルチェック
    if (!cleaned.match(/^https?:\/\//i)) {
      return null
    }
    
    const urlObj = new URL(cleaned)
    
    // 許可されたプロトコルのみ
    if (!["http:", "https:"].includes(urlObj.protocol)) {
      return null
    }
  
    // 長さ制限
    if (cleaned.length > 2048) {
      return null
    }
    
    return cleaned
  } catch {
    return null
  }
}

/**
 * ファイル名のサニタイゼーション
 */
export function sanitizeFilename(filename: string): string {
  return filename
    .replace(/[^a-zA-Z0-9._-]/g, "_") // 許可されていない文字を置換
    .replace(/\.\./g, "") // ディレクトリトラバーサル対策
    .substring(0, 255) // 長さ制限
}

/**
 * SQLインジェクション対策（Prisma使用時は不要だが、追加の防御層）
 */
export function sanitizeSQLInput(input: string): string {
  return input
    .replace(/['";\\]/g, "") // 危険な文字を削除
    .trim()
}

/**
 * 個人情報のマスキング（ログ用）
 */
export function maskEmail(email: string): string {
  if (!email || email.length < 5) return "***"
  const [local, domain] = email.split("@")
  if (!domain) return "***"
  
  const maskedLocal = local.length > 2 
    ? `${local.substring(0, 2)}***`
    : "***"
  
  return `${maskedLocal}@${domain}`
}

export function maskPhone(phone: string): string {
  if (!phone || phone.length < 4) return "***"
  return `${phone.substring(0, 2)}***${phone.substring(phone.length - 2)}`
}

/**
 * 機密情報のマスキング（APIキー、トークン等）
 */
export function maskSecret(secret: string, visibleChars: number = 4): string {
  if (!secret || secret.length <= visibleChars) return "***"
  return `${secret.substring(0, visibleChars)}${"*".repeat(secret.length - visibleChars)}`
}

