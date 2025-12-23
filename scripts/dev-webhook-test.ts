/**
 * ローカル開発環境でのWebhookテスト用スクリプト
 * 
 * 使用方法:
 * npx tsx scripts/dev-webhook-test.ts
 */

const WEBHOOK_URL = process.env.WEBHOOK_URL || "http://localhost:3000/api/webhooks/email/events"
const SECRET = process.env.WEBHOOK_SIGNING_SECRET || "local-webhook-secret"

// SendGrid形式のテストイベント
const testEvent = {
  event: "open",
  email: "test@example.com",
  timestamp: Math.floor(Date.now() / 1000),
  sg_message_id: "test-message-id-123",
  sg_event_id: "test-event-id-456",
}

async function testWebhook() {
  console.log("🧪 Webhookテストを実行中...")
  console.log(`URL: ${WEBHOOK_URL}`)
  console.log(`Event: ${JSON.stringify(testEvent, null, 2)}`)

  try {
    const response = await fetch(WEBHOOK_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        // 開発環境では署名検証をスキップするため、ヘッダーは省略可能
      },
      body: JSON.stringify([testEvent]),
    })

    const result = await response.json()
    console.log(`✅ レスポンス: ${JSON.stringify(result, null, 2)}`)
  } catch (error) {
    console.error("❌ エラー:", error)
  }
}

testWebhook()

