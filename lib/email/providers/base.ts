export interface SendEmailParams {
  from: { email: string; name?: string }
  to: { email: string; name?: string }
  subject: string
  html?: string
  text?: string
  headers?: Record<string, string>
  customArgs?: Record<string, string>
}

export interface SendEmailResult {
  messageId: string
  providerId?: string
}

export interface WebhookEvent {
  type: "open" | "click" | "bounce" | "spam_report" | "unsubscribe" | "delivered" | "deferred" | "dropped" | "reply"
  email: string
  messageId?: string
  timestamp: Date
  data?: any
}

export interface EmailProvider {
  sendEmail(params: SendEmailParams): Promise<SendEmailResult>
  verifyWebhook(req: Request): Promise<boolean>
  parseWebhookEvent(req: Request): Promise<WebhookEvent[]>
  parseInboundEmail(req: Request): Promise<{
    from: string
    to: string
    subject: string
    html?: string
    text?: string
    messageId: string
    inReplyTo?: string
    references?: string
  }>
}

