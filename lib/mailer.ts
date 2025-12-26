import nodemailer from "nodemailer"

export interface SendMailParams {
  to: string
  subject: string
  text?: string
  html?: string
}

export interface SendMailResult {
  messageId: string
}

export async function sendMail(params: SendMailParams): Promise<SendMailResult> {
  const host = process.env.SMTP_HOST
  const port = process.env.SMTP_PORT ? Number(process.env.SMTP_PORT) : 587
  const user = process.env.SMTP_USER
  const pass = process.env.SMTP_PASSWORD || process.env.SMTP_PASS
  const from = process.env.SMTP_FROM || process.env.SENDGRID_FROM_EMAIL || "noreply@localhost"

  if (!host || !user || !pass) {
    const missing = []
    if (!host) missing.push("SMTP_HOST")
    if (!user) missing.push("SMTP_USER")
    if (!pass) missing.push("SMTP_PASSWORD")
    throw new Error(`SMTP configuration is missing: ${missing.join(", ")}`)
  }

  const transporter = nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: {
      user,
      pass,
    },
    // 接続タイムアウト設定
    connectionTimeout: 10000, // 10秒
    greetingTimeout: 10000,
    socketTimeout: 10000,
  })

  try {
    // 接続をテスト
    await transporter.verify()
  } catch (verifyError: any) {
    const errorMsg = verifyError?.message || String(verifyError)
    if (errorMsg.includes("Invalid login") || errorMsg.includes("authentication")) {
      throw new Error(`SMTP認証に失敗しました: ${errorMsg}\nSMTP_USERとSMTP_PASSWORDを確認してください。`)
    } else if (errorMsg.includes("ECONNREFUSED") || errorMsg.includes("ENOTFOUND")) {
      throw new Error(`SMTPサーバーに接続できませんでした: ${errorMsg}\nSMTP_HOST (${host}) と SMTP_PORT (${port}) を確認してください。`)
    } else if (errorMsg.includes("timeout")) {
      throw new Error(`SMTP接続がタイムアウトしました: ${errorMsg}\nネットワーク接続とSMTP設定を確認してください。`)
    }
    throw new Error(`SMTP接続エラー: ${errorMsg}`)
  }

  try {
    const info = await transporter.sendMail({
      from,
      to: params.to,
      subject: params.subject,
      text: params.text,
      html: params.html,
    })

    return {
      messageId: info.messageId,
    }
  } catch (sendError: any) {
    const errorMsg = sendError?.message || String(sendError)
    throw new Error(`メール送信に失敗しました: ${errorMsg}`)
  }
}


