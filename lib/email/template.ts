import { Lead, Campaign } from "@prisma/client"

export function renderTemplate(template: string, lead: Lead, campaign?: Campaign): string {
  let result = template

  // 変数置換
  result = result.replace(/\{\{companyName\}\}/g, lead.companyName || "御社")
  result = result.replace(/\{\{contactName\}\}/g, lead.contactName || "")
  result = result.replace(/\{\{position\}\}/g, lead.position || "")
  result = result.replace(/\{\{industry\}\}/g, lead.industry || "")
  result = result.replace(/\{\{websiteUrl\}\}/g, lead.websiteUrl || "")

  return result
}

export function buildEmailContent(
  campaign: Campaign,
  lead: Lead,
  unsubscribeToken: string
): { subject: string; html: string; text: string } {
  const subject = renderTemplate(campaign.subjectTemplate, lead, campaign)
  const body = renderTemplate(campaign.bodyTemplate, lead, campaign)

  const signature = campaign.signature || ""
  const unsubscribeUrl = `${process.env.APP_BASE_URL}/unsubscribe?token=${unsubscribeToken}`
  const unsubscribeText = campaign.unsubscribeText || "このメールの配信を停止する場合は、以下のリンクをクリックしてください。"

  const companyName = process.env.APP_COMPANY_NAME || "Your Company"
  const companyAddress = process.env.APP_COMPANY_ADDRESS || ""

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333;">
  <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
    ${body.replace(/\n/g, "<br>")}
    
    ${signature ? `<div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee;">${signature.replace(/\n/g, "<br>")}</div>` : ""}
    
    <div style="margin-top: 40px; padding-top: 20px; border-top: 2px solid #eee; font-size: 12px; color: #666;">
      <p><strong>${companyName}</strong></p>
      ${companyAddress ? `<p>${companyAddress}</p>` : ""}
      <p style="margin-top: 20px;">
        ${unsubscribeText}<br>
        <a href="${unsubscribeUrl}" style="color: #0066cc;">配信停止</a>
      </p>
    </div>
  </div>
</body>
</html>
  `.trim()

  const text = `
${body}

${signature ? `\n${signature}\n` : ""}

---
${companyName}
${companyAddress ? `${companyAddress}\n` : ""}
${unsubscribeText}
${unsubscribeUrl}
  `.trim()

  return { subject, html, text }
}

