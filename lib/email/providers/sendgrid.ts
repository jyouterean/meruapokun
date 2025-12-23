import sgMail from "@sendgrid/mail"
import { EmailProvider, SendEmailParams, SendEmailResult, WebhookEvent } from "./base"
import crypto from "crypto"

export class SendGridProvider implements EmailProvider {
  private apiKey: string
  private webhookSecret?: string

  constructor() {
    this.apiKey = process.env.SENDGRID_API_KEY || ""
    this.webhookSecret = process.env.WEBHOOK_SIGNING_SECRET
    if (!this.apiKey) {
      throw new Error("SENDGRID_API_KEY is not set")
    }
    sgMail.setApiKey(this.apiKey)
  }

  async sendEmail(params: SendEmailParams): Promise<SendEmailResult> {
    const msg = {
      to: params.to.email,
      from: {
        email: params.from.email,
        name: params.from.name,
      },
      subject: params.subject,
      html: params.html,
      text: params.text,
      customArgs: params.customArgs || {},
      headers: params.headers || {},
    }

    const [response] = await sgMail.send(msg as any)
    
    // SendGridのレスポンスからmessageIdを取得
    const messageId = response.headers?.["x-message-id"]?.[0] || 
                     `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    
    return {
      messageId,
      providerId: messageId,
    }
  }

  async verifyWebhook(req: Request): Promise<boolean> {
    if (!this.webhookSecret) {
      return true // 開発環境では検証をスキップ
    }

    // Requestをクローンして読み取り
    const clonedReq = req.clone()
    const body = await clonedReq.text()
    const signature = req.headers.get("x-twilio-email-event-webhook-signature") || 
                     req.headers.get("x-sendgrid-signature")
    const timestamp = req.headers.get("x-twilio-email-event-webhook-timestamp") ||
                     req.headers.get("x-sendgrid-timestamp")

    if (!signature || !timestamp) {
      return false
    }

    const payload = timestamp + body
    const hmac = crypto.createHmac("sha256", this.webhookSecret)
    hmac.update(payload)
    const expectedSignature = hmac.digest("base64")

    return crypto.timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(expectedSignature)
    )
  }

  async parseWebhookEvent(req: Request): Promise<WebhookEvent[]> {
    // Requestをクローンして読み取り
    const clonedReq = req.clone()
    const events = await clonedReq.json()
    
    if (!Array.isArray(events)) {
      return []
    }

    return events.map((event: any) => {
      const typeMap: Record<string, WebhookEvent["type"]> = {
        open: "open",
        click: "click",
        bounce: "bounce",
        spamreport: "spam_report",
        unsubscribe: "unsubscribe",
        delivered: "delivered",
        deferred: "deferred",
        dropped: "dropped",
      }

      return {
        type: typeMap[event.event] || "delivered",
        email: event.email,
        messageId: event.sg_message_id,
        timestamp: new Date(event.timestamp * 1000),
        data: event,
      }
    })
  }

  async parseInboundEmail(req: Request): Promise<{
    from: string
    to: string
    subject: string
    html?: string
    text?: string
    messageId: string
    inReplyTo?: string
    references?: string
  }> {
    const formData = await req.formData()
    
    return {
      from: formData.get("from") as string,
      to: formData.get("to") as string,
      subject: formData.get("subject") as string,
      html: formData.get("html") as string || undefined,
      text: formData.get("text") as string || undefined,
      messageId: formData.get("headers")?.toString().match(/Message-ID: (.+)/)?.[1] || "",
      inReplyTo: formData.get("headers")?.toString().match(/In-Reply-To: (.+)/)?.[1] || undefined,
      references: formData.get("headers")?.toString().match(/References: (.+)/)?.[1] || undefined,
    }
  }
}

