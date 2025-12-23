import { getServerSession } from "next-auth"
import { redirect } from "next/navigation"
import { authOptions } from "@/lib/auth"
import Layout from "@/components/Layout"
import { prisma } from "@/lib/prisma"
import Link from "next/link"

export default async function CampaignThreadsPage({
  params,
}: {
  params: { id: string }
}) {
  const session = await getServerSession(authOptions)
  
  if (!session) {
    redirect("/login")
  }

  // 返信があるスレッドを取得
  const threads = await prisma.emailMessage.findMany({
    where: {
      campaignId: params.id,
      direction: "INBOUND",
    },
    include: {
      lead: true,
    },
    orderBy: { createdAt: "desc" },
  })

  return (
    <Layout>
      <div className="px-4 sm:px-6 lg:px-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">返信一覧</h1>

        <div className="bg-white shadow rounded-lg overflow-hidden">
          <table className="min-w-full divide-y divide-gray-300">
            <thead className="bg-gray-50">
              <tr>
                <th className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-6">
                  リード
                </th>
                <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                  件名
                </th>
                <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                  受信日時
                </th>
                <th className="relative py-3.5 pl-3 pr-4 sm:pr-6">
                  <span className="sr-only">操作</span>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {threads.map((thread) => (
                <tr key={thread.id}>
                  <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-6">
                    {thread.lead.email}
                    {thread.lead.contactName && (
                      <div className="text-xs text-gray-500">{thread.lead.contactName}</div>
                    )}
                  </td>
                  <td className="px-3 py-4 text-sm text-gray-500">
                    {thread.subject}
                  </td>
                  <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                    {new Date(thread.createdAt).toLocaleString("ja-JP")}
                  </td>
                  <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
                    <Link
                      href={`/threads/${thread.threadKey || thread.id}`}
                      className="text-indigo-600 hover:text-indigo-900"
                    >
                      詳細
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </Layout>
  )
}

