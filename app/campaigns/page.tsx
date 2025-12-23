import { getServerSession } from "next-auth"
import { redirect } from "next/navigation"
import { authOptions } from "@/lib/auth"
import Layout from "@/components/Layout"
import { prisma } from "@/lib/prisma"
import Link from "next/link"
import { CampaignStatus } from "@prisma/client"

const statusColors: Record<CampaignStatus, string> = {
  DRAFT: "bg-gray-100 text-gray-800",
  TESTING: "bg-yellow-100 text-yellow-800",
  RUNNING: "bg-green-100 text-green-800",
  PAUSED: "bg-blue-100 text-blue-800",
  COMPLETED: "bg-purple-100 text-purple-800",
  STOPPED: "bg-red-100 text-red-800",
}

const statusLabels: Record<CampaignStatus, string> = {
  DRAFT: "下書き",
  TESTING: "テスト中",
  RUNNING: "実行中",
  PAUSED: "一時停止",
  COMPLETED: "完了",
  STOPPED: "停止",
}

export default async function CampaignsPage() {
  const session = await getServerSession(authOptions)
  
  if (!session) {
    redirect("/login")
  }

  const campaigns = await prisma.campaign.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      _count: {
        select: {
          emailMessages: true,
          sendQueues: true,
        },
      },
    },
  })

  return (
    <Layout>
      <div className="px-4 sm:px-6 lg:px-8">
        <div className="sm:flex sm:items-center mb-6">
          <div className="sm:flex-auto">
            <h1 className="text-2xl font-bold text-gray-900">キャンペーン管理</h1>
            <p className="mt-2 text-sm text-gray-700">
              メールキャンペーンの作成と管理
            </p>
          </div>
          <div className="mt-4 sm:mt-0 sm:ml-16 sm:flex-none">
            <Link
              href="/campaigns/new"
              className="block rounded-md bg-indigo-600 px-3 py-2 text-center text-sm font-semibold text-white shadow-sm hover:bg-indigo-500"
            >
              新規作成
            </Link>
          </div>
        </div>

        <div className="bg-white shadow rounded-lg overflow-hidden">
          <table className="min-w-full divide-y divide-gray-300">
            <thead className="bg-gray-50">
              <tr>
                <th className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-6">
                  キャンペーン名
                </th>
                <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                  ステータス
                </th>
                <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                  送信数
                </th>
                <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                  キュー数
                </th>
                <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                  作成日
                </th>
                <th className="relative py-3.5 pl-3 pr-4 sm:pr-6">
                  <span className="sr-only">操作</span>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {campaigns.map((campaign) => (
                <tr key={campaign.id}>
                  <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-6">
                    <Link href={`/campaigns/${campaign.id}`} className="text-indigo-600 hover:text-indigo-900">
                      {campaign.name}
                    </Link>
                  </td>
                  <td className="whitespace-nowrap px-3 py-4 text-sm">
                    <span className={`inline-flex rounded-full px-2 text-xs font-semibold leading-5 ${statusColors[campaign.status]}`}>
                      {statusLabels[campaign.status]}
                    </span>
                  </td>
                  <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                    {campaign._count.emailMessages}
                  </td>
                  <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                    {campaign._count.sendQueues}
                  </td>
                  <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                    {new Date(campaign.createdAt).toLocaleDateString("ja-JP")}
                  </td>
                  <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
                    <Link
                      href={`/campaigns/${campaign.id}`}
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

