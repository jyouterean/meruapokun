import OpenAI from "openai"
import { Lead, Campaign } from "@prisma/client"

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

export interface GenerateEmailParams {
  lead: Lead
  campaign: Campaign
  context?: string // 返信の場合は前のメッセージ
}

export interface GeneratedEmail {
  subject: string
  html: string
  text: string
  followUpSuggestion?: string
}

const PROHIBITED_WORDS = [
  "必ず",
  "絶対",
  "確実",
  "100%",
  "完全",
  "最強",
  "最高",
  "世界一",
  "史上最高",
]

function filterProhibitedWords(text: string): string {
  let result = text
  for (const word of PROHIBITED_WORDS) {
    const regex = new RegExp(word, "gi")
    result = result.replace(regex, "")
  }
  return result
}

export async function generateEmail(params: GenerateEmailParams): Promise<GeneratedEmail> {
  const { lead, campaign, context } = params

  const systemPrompt = `あなたはプロフェッショナルなビジネスメールの作成者です。
以下のルールを厳守してください：
- 個人情報を捏造しない（leadに無い情報を「ある」と言わない）
- 誇大表現を避ける
- 簡潔で丁寧な文章
- トーン: ${campaign.aiTone || "professional"}
${campaign.aiProhibitedWords.length > 0 ? `- 禁止ワード: ${campaign.aiProhibitedWords.join(", ")}` : ""}`

  const userPrompt = context
    ? `以下のメールスレッドに返信するメールを生成してください。

【前のメッセージ】
${context}

【リード情報】
- 会社名: ${lead.companyName || "不明"}
- 担当者名: ${lead.contactName || ""}
- 業種: ${lead.industry || "不明"}
- 役職: ${lead.position || ""}

【キャンペーンの提案内容】
${campaign.bodyTemplate}

返信メールの件名と本文を生成してください。JSON形式で返してください：
{
  "subject": "件名",
  "html": "HTML形式の本文",
  "text": "テキスト形式の本文",
  "followUpSuggestion": "次のアクション提案"
}`
    : `以下の情報を基に、メールアウトリーチの件名と本文を生成してください。

【リード情報】
- 会社名: ${lead.companyName || "不明"}
- 担当者名: ${lead.contactName || ""}
- 業種: ${lead.industry || "不明"}
- 役職: ${lead.position || ""}
- サイトURL: ${lead.websiteUrl || ""}

【キャンペーンの提案内容】
${campaign.bodyTemplate}

【件名テンプレート（参考）】
${campaign.subjectTemplate}

JSON形式で返してください：
{
  "subject": "件名",
  "html": "HTML形式の本文",
  "text": "テキスト形式の本文",
  "followUpSuggestion": "フォローアップ提案"
}`

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      response_format: { type: "json_object" },
      temperature: 0.7,
      max_tokens: 2000,
    })

    const content = completion.choices[0]?.message?.content
    if (!content) {
      throw new Error("No content from OpenAI")
    }

    const parsed = JSON.parse(content) as GeneratedEmail

    // NGワードフィルタ
    parsed.subject = filterProhibitedWords(parsed.subject)
    parsed.html = filterProhibitedWords(parsed.html)
    parsed.text = filterProhibitedWords(parsed.text)

    // 文字数制限
    if (parsed.subject.length > 100) {
      parsed.subject = parsed.subject.substring(0, 100)
    }

    return parsed
  } catch (error) {
    console.error("OpenAI generation error:", error)
    // フォールバック: テンプレートベース
    return {
      subject: campaign.subjectTemplate.replace(/\{\{companyName\}\}/g, lead.companyName || "御社"),
      html: campaign.bodyTemplate.replace(/\{\{companyName\}\}/g, lead.companyName || "御社"),
      text: campaign.bodyTemplate.replace(/\{\{companyName\}\}/g, lead.companyName || "御社"),
    }
  }
}

