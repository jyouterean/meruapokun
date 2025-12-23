import { getServerSession } from "next-auth"
import { redirect } from "next/navigation"
import { authOptions } from "@/lib/auth"
import Layout from "@/components/Layout"
import { prisma } from "@/lib/prisma"
import ThreadReply from "./reply"

export default async function ThreadDetailPage({
  params,
}: {
  params: { id: string }
}) {
  const session = await getServerSession(authOptions)
  
  if (!session) {
    redirect("/login")
  }

  // スレッドの全メッセージを取得
  const messages = await prisma.emailMessage.findMany({
    where: {
      OR: [
        { threadKey: params.id },
        { id: params.id },
      ],
    },
    include: {
      lead: true,
      campaign: true,
    },
    orderBy: { createdAt: "asc" },
  })

  if (messages.length === 0) {
    return (
      <Layout>
        <div className="px-4 sm:px-6 lg:px-8">
          <p>スレッドが見つかりません</p>
        </div>
      </Layout>
    )
  }

  const lead = messages[0].lead
  const campaign = messages[0].campaign

  return (
    <Layout>
      <div className="px-4 sm:px-6 lg:px-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">
          スレッド詳細 - {lead.email}
        </h1>

        <div className="bg-white shadow rounded-lg p-6 mb-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">メッセージ履歴</h2>
          <div className="space-y-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`border rounded-lg p-4 ${
                  message.direction === "OUTBOUND"
                    ? "bg-blue-50 border-blue-200"
                    : "bg-gray-50 border-gray-200"
                }`}
              >
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <div className="text-sm font-medium text-gray-900">
                      {message.direction === "OUTBOUND" ? "送信" : "受信"}
                    </div>
                    <div className="text-xs text-gray-500">
                      {message.fromName || message.fromEmail} → {message.toEmail}
                    </div>
                  </div>
                  <div className="text-xs text-gray-500">
                    {new Date(message.createdAt).toLocaleString("ja-JP")}
                  </div>
                </div>
                <div className="text-sm font-medium text-gray-900 mb-2">
                  {message.subject}
                </div>
                <div className="text-sm text-gray-700 whitespace-pre-wrap">
                  {message.textBody || message.htmlBody?.replace(/<[^>]*>/g, "") || ""}
                </div>
              </div>
            ))}
          </div>
        </div>

        <ThreadReply
          campaignId={campaign.id}
          leadId={lead.id}
          threadKey={messages[0].threadKey || params.id}
        />
      </div>
    </Layout>
  )
}

