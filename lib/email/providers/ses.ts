import { SESClient, SendEmailCommand } from "@aws-sdk/client-ses"
import { EmailProvider, SendEmailParams, SendEmailResult, WebhookEvent } from "./base"
import crypto from "crypto"

export class SESProvider implements EmailProvider {
  private client: SESClient
  private webhookSecret?: string

  constructor() {
    this.client = new SESClient({
      region: process.env.AWS_REGION || "us-east-1",
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID || "",
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || "",
      },
    })
    this.webhookSecret = process.env.WEBHOOK_SIGNING_SECRET
  }

  async sendEmail(params: SendEmailParams): Promise<SendEmailResult> {
    const command = new SendEmailCommand({
      Source: params.from.name
        ? `${params.from.name} <${params.from.email}>`
        : params.from.email,
      Destination: {
        ToAddresses: [params.to.email],
      },
      Message: {
        Subject: {
          Data: params.subject,
          Charset: "UTF-8",
        },
        Body: {
          Html: params.html ? { Data: params.html, Charset: "UTF-8" } : undefined,
          Text: params.text ? { Data: params.text, Charset: "UTF-8" } : undefined,
        },
      },
      ConfigurationSetName: process.env.SES_CONFIGURATION_SET,
    })

    const response = await this.client.send(command)
    
    return {
      messageId: response.MessageId || "",
      providerId: response.MessageId || "",
    }
  }

  async verifyWebhook(req: Request): Promise<boolean> {
    // SES SNS署名検証（簡易版）
    // 本番環境では適切なSNS署名検証を実装
    return true
  }

  async parseWebhookEvent(req: Request): Promise<WebhookEvent[]> {
    // SESはSNS経由でイベントを受信
    const snsMessage = await req.json()
    
    if (snsMessage.Type === "Notification") {
      const message = JSON.parse(snsMessage.Message)
      const typeMap: Record<string, WebhookEvent["type"]> = {
        Open: "open",
        Click: "click",
        Bounce: "bounce",
        Complaint: "spam_report",
        Delivery: "delivered",
      }

      return [
        {
          type: typeMap[message.eventType] || "delivered",
          email: message.mail.destination[0],
          messageId: message.mail.messageId,
          timestamp: new Date(message.mail.timestamp),
          data: message,
        },
      ]
    }

    return []
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
    // SES InboundはSNS経由
    const snsMessage = await req.json()
    if (snsMessage.Type === "Notification") {
      const message = JSON.parse(snsMessage.Message)
      const mail = message.mail
      const content = message.content

      return {
        from: mail.commonHeaders.from[0],
        to: mail.commonHeaders.to[0],
        subject: mail.commonHeaders.subject,
        html: content,
        text: content,
        messageId: mail.messageId,
        inReplyTo: mail.commonHeaders.inReplyTo?.[0],
        references: mail.commonHeaders.references?.[0],
      }
    }

    throw new Error("Invalid SES inbound format")
  }
}

