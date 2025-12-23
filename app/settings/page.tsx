import { getServerSession } from "next-auth"
import { redirect } from "next/navigation"
import { authOptions } from "@/lib/auth"
import Layout from "@/components/Layout"

export default async function SettingsPage() {
  const session = await getServerSession(authOptions)
  
  if (!session) {
    redirect("/login")
  }

  const provider = process.env.EMAIL_PROVIDER || "sendgrid"

  return (
    <Layout>
      <div className="px-4 sm:px-6 lg:px-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">設定</h1>

        <div className="space-y-6">
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">送信プロバイダ設定</h2>
            <dl className="grid grid-cols-1 gap-x-4 gap-y-6 sm:grid-cols-2">
              <div>
                <dt className="text-sm font-medium text-gray-500">現在のプロバイダ</dt>
                <dd className="mt-1 text-sm text-gray-900">{provider}</dd>
              </div>
            </dl>
          </div>

          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Webhook設定</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  イベントWebhook URL
                </label>
                <code className="block p-3 bg-gray-50 rounded text-sm">
                  {process.env.APP_BASE_URL || "http://localhost:3000"}/api/webhooks/email/events
                </code>
                <p className="mt-2 text-xs text-gray-500">
                  SendGridの場合は、Event Webhook設定でこのURLを登録してください。
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  受信Webhook URL
                </label>
                <code className="block p-3 bg-gray-50 rounded text-sm">
                  {process.env.APP_BASE_URL || "http://localhost:3000"}/api/webhooks/email/inbound
                </code>
                <p className="mt-2 text-xs text-gray-500">
                  SendGridのInbound Parse設定でこのURLを登録してください。
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">SPF/DKIM/DMARC設定ガイド</h2>
            <div className="prose prose-sm max-w-none">
              <p className="text-sm text-gray-700">
                メール送信の信頼性を向上させるため、以下のDNSレコードを設定してください：
              </p>
              <ul className="list-disc pl-5 text-sm text-gray-700 space-y-2 mt-4">
                <li>
                  <strong>SPF:</strong> 送信ドメインのSPFレコードに、使用する送信プロバイダ（SendGrid/SES）を追加
                </li>
                <li>
                  <strong>DKIM:</strong> 送信プロバイダから提供されるDKIM公開鍵をDNSに設定
                </li>
                <li>
                  <strong>DMARC:</strong> DMARCポリシーを設定して、メール認証の結果を監視
                </li>
              </ul>
              <p className="text-xs text-gray-500 mt-4">
                詳細は各プロバイダのドキュメントを参照してください。
              </p>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  )
}

