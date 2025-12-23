import { getServerSession } from "next-auth"
import { redirect } from "next/navigation"
import { authOptions } from "@/lib/auth"
import Layout from "@/components/Layout"
import { prisma } from "@/lib/prisma"
import Link from "next/link"
import { LeadStatus } from "@prisma/client"

const statusColors: Record<LeadStatus, string> = {
  NEW: "bg-gray-100 text-gray-800",
  CONTACTED: "bg-blue-100 text-blue-800",
  REPLIED: "bg-green-100 text-green-800",
  BOUNCED: "bg-red-100 text-red-800",
  UNSUBSCRIBED: "bg-yellow-100 text-yellow-800",
  DO_NOT_CONTACT: "bg-gray-100 text-gray-800",
}

const statusLabels: Record<LeadStatus, string> = {
  NEW: "新規",
  CONTACTED: "接触済み",
  REPLIED: "返信あり",
  BOUNCED: "バウンス",
  UNSUBSCRIBED: "配信停止",
  DO_NOT_CONTACT: "連絡不可",
}

export default async function LeadsPage() {
  const session = await getServerSession(authOptions)
  
  if (!session) {
    redirect("/login")
  }

  const leads = await prisma.lead.findMany({
    orderBy: { createdAt: "desc" },
    take: 100,
  })

  return (
    <Layout>
      <div className="px-4 sm:px-6 lg:px-8">
        <div className="sm:flex sm:items-center mb-6">
          <div className="sm:flex-auto">
            <h1 className="text-2xl font-bold text-gray-900">リード管理</h1>
            <p className="mt-2 text-sm text-gray-700">
              見込み顧客リストの管理
            </p>
          </div>
          <div className="mt-4 sm:mt-0 sm:ml-16 sm:flex-none">
            <Link
              href="/leads/upload"
              className="block rounded-md bg-indigo-600 px-3 py-2 text-center text-sm font-semibold text-white shadow-sm hover:bg-indigo-500"
            >
              CSVアップロード
            </Link>
          </div>
        </div>

        <div className="bg-white shadow rounded-lg overflow-hidden">
          <table className="min-w-full divide-y divide-gray-300">
            <thead className="bg-gray-50">
              <tr>
                <th className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-6">
                  メールアドレス
                </th>
                <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                  会社名
                </th>
                <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                  担当者名
                </th>
                <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                  ステータス
                </th>
                <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                  タグ
                </th>
                <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                  登録日
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {leads.map((lead) => (
                <tr key={lead.id}>
                  <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-6">
                    {lead.email}
                  </td>
                  <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                    {lead.companyName || "-"}
                  </td>
                  <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                    {lead.contactName || "-"}
                  </td>
                  <td className="whitespace-nowrap px-3 py-4 text-sm">
                    <span className={`inline-flex rounded-full px-2 text-xs font-semibold leading-5 ${statusColors[lead.status]}`}>
                      {statusLabels[lead.status]}
                    </span>
                  </td>
                  <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                    {lead.tags.length > 0 ? (
                      <div className="flex flex-wrap gap-1">
                        {lead.tags.map((tag) => (
                          <span key={tag} className="inline-flex items-center rounded-md bg-gray-50 px-2 py-1 text-xs font-medium text-gray-600">
                            {tag}
                          </span>
                        ))}
                      </div>
                    ) : (
                      "-"
                    )}
                  </td>
                  <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                    {new Date(lead.createdAt).toLocaleDateString("ja-JP")}
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

