import { EmailProvider } from "./providers/base"
import { SendGridProvider } from "./providers/sendgrid"
import { SESProvider } from "./providers/ses"

let providerInstance: EmailProvider | null = null

export function getEmailProvider(): EmailProvider {
  if (providerInstance) {
    return providerInstance
  }

  const providerType = process.env.EMAIL_PROVIDER || "sendgrid"

  switch (providerType) {
    case "sendgrid":
      providerInstance = new SendGridProvider()
      break
    case "ses":
      providerInstance = new SESProvider()
      break
    default:
      throw new Error(`Unsupported email provider: ${providerType}`)
  }

  return providerInstance
}

