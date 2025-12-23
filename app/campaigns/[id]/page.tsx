import { getServerSession } from "next-auth"
import { redirect } from "next/navigation"
import { authOptions } from "@/lib/auth"
import Layout from "@/components/Layout"
import { prisma } from "@/lib/prisma"
import Link from "next/link"
import { CampaignStatus } from "@prisma/client"
import CampaignActions from "./actions"

export default async function CampaignDetailPage({
  params,
}: {
  params: { id: string }
}) {
  const session = await getServerSession(authOptions)
  
  if (!session) {
    redirect("/login")
  }

  const campaign = await prisma.campaign.findUnique({
    where: { id: params.id },
    include: {
      _count: {
        select: {
          emailMessages: true,
          sendQueues: true,
          events: true,
        },
      },
    },
  })

  if (!campaign) {
    return (
      <Layout>
        <div className="px-4 sm:px-6 lg:px-8">
          <p>キャンペーンが見つかりません</p>
        </div>
      </Layout>
    )
  }

  // 統計情報
  const stats = await Promise.all([
    prisma.emailMessage.count({
      where: { campaignId: campaign.id, status: "SENT" },
    }),
    prisma.emailMessage.count({
      where: { campaignId: campaign.id, status: "DELIVERED" },
    }),
    prisma.event.count({
      where: { campaignId: campaign.id, type: "OPEN" },
    }),
    prisma.event.count({
      where: { campaignId: campaign.id, type: "CLICK" },
    }),
    prisma.event.count({
      where: { campaignId: campaign.id, type: "REPLY" },
    }),
    prisma.event.count({
      where: { campaignId: campaign.id, type: "BOUNCE" },
    }),
  ])

  const [sent, delivered, opened, clicked, replied, bounced] = stats

  return (
    <Layout>
      <div className="px-4 sm:px-6 lg:px-8">
        <div className="sm:flex sm:items-center mb-6">
          <div className="sm:flex-auto">
            <h1 className="text-2xl font-bold text-gray-900">{campaign.name}</h1>
            <p className="mt-2 text-sm text-gray-700">
              ステータス: {campaign.status}
            </p>
          </div>
          <div className="mt-4 sm:mt-0 sm:ml-16 sm:flex-none space-x-3">
            <CampaignActions campaignId={campaign.id} status={campaign.status} />
            <Link
              href={`/campaigns/${campaign.id}/threads`}
              className="inline-block rounded-md bg-indigo-600 px-3 py-2 text-center text-sm font-semibold text-white shadow-sm hover:bg-indigo-500"
            >
              返信一覧
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4 mb-8">
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="text-2xl font-bold text-gray-900">{sent}</div>
              <div className="text-sm font-medium text-gray-500">送信数</div>
            </div>
          </div>
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="text-2xl font-bold text-gray-900">{delivered}</div>
              <div className="text-sm font-medium text-gray-500">到達数</div>
            </div>
          </div>
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="text-2xl font-bold text-gray-900">
                {delivered > 0 ? ((opened / delivered) * 100).toFixed(1) : 0}%
              </div>
              <div className="text-sm font-medium text-gray-500">開封率</div>
            </div>
          </div>
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="text-2xl font-bold text-gray-900">
                {delivered > 0 ? ((replied / delivered) * 100).toFixed(1) : 0}%
              </div>
              <div className="text-sm font-medium text-gray-500">返信率</div>
            </div>
          </div>
        </div>

        <div className="bg-white shadow rounded-lg p-6 mb-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">キャンペーン設定</h2>
          <dl className="grid grid-cols-1 gap-x-4 gap-y-6 sm:grid-cols-2">
            <div>
              <dt className="text-sm font-medium text-gray-500">件名テンプレート</dt>
              <dd className="mt-1 text-sm text-gray-900">{campaign.subjectTemplate}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">送信元</dt>
              <dd className="mt-1 text-sm text-gray-900">
                {campaign.fromName} &lt;{campaign.fromEmail}&gt;
              </dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">レート制限（分/日）</dt>
              <dd className="mt-1 text-sm text-gray-900">
                {campaign.rateLimitPerMin}通 / {campaign.rateLimitPerDay}通
              </dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">AI生成</dt>
              <dd className="mt-1 text-sm text-gray-900">
                {campaign.useAI ? "有効" : "無効"}
              </dd>
            </div>
          </dl>
        </div>

        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">本文プレビュー</h2>
          <div className="border rounded-lg p-4 bg-gray-50">
            <div className="text-sm text-gray-600 mb-2">件名: {campaign.subjectTemplate}</div>
            <div className="text-sm text-gray-900 whitespace-pre-wrap">
              {campaign.bodyTemplate}
            </div>
            {campaign.signature && (
              <div className="mt-4 pt-4 border-t text-sm text-gray-600 whitespace-pre-wrap">
                {campaign.signature}
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  )
}

