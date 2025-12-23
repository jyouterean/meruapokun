/**
 * ローカル開発環境用のCronスクリプト
 * 送信ジョブを定期的に実行します
 * 
 * 使用方法:
 * npx tsx scripts/dev-cron.ts
 */

import cron from "node-cron"

const APP_BASE_URL = process.env.APP_BASE_URL || "http://localhost:3000"
const CRON_SECRET = process.env.CRON_SECRET || "local-cron-secret"

async function runSendJob() {
  try {
    console.log(`[${new Date().toISOString()}] 送信ジョブを実行中...`)
    
    const response = await fetch(`${APP_BASE_URL}/api/jobs/send`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${CRON_SECRET}`,
      },
    })

    const result = await response.json()
    console.log(`[${new Date().toISOString()}] 結果:`, result)
  } catch (error) {
    console.error(`[${new Date().toISOString()}] エラー:`, error)
  }
}

// 5分ごとに実行
console.log("🕐 ローカル開発用Cronを起動しました")
console.log(`📡 送信ジョブURL: ${APP_BASE_URL}/api/jobs/send`)
console.log("⏰ 実行間隔: 5分ごと")
console.log("停止するには Ctrl+C を押してください\n")

// 初回実行
runSendJob()

// 5分ごとに実行
cron.schedule("*/5 * * * *", runSendJob)

