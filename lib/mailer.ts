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
    throw new Error("SMTP configuration is missing (SMTP_HOST/SMTP_USER/SMTP_PASSWORD)")
  }

  const transporter = nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: {
      user,
      pass,
    },
  })

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
}


