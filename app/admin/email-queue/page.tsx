import { getServerSession } from "next-auth"
import { redirect } from "next/navigation"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import Layout from "@/components/Layout"

type SearchParams = {
  searchParams?: {
    status?: string
  }
}

export default async function EmailQueueAdminPage({ searchParams }: SearchParams) {
  const session = await getServerSession(authOptions)
  if (!session) {
    redirect("/login")
  }

  const statusFilter = searchParams?.status

  const where =
    statusFilter && ["QUEUED", "SENDING", "SENT", "FAILED"].includes(statusFilter)
      ? { status: statusFilter as any }
      : {}

  const items = await prisma.emailQueue.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: 100,
  })

  const stats = await prisma.emailQueue.groupBy({
    by: ["status"],
    _count: { _all: true },
  })

  async function runWorker() {
    "use server"
    const appUrl = process.env.APP_URL || process.env.APP_BASE_URL || "http://localhost:3000"
    const cronSecret = process.env.CRON_SECRET
    if (!cronSecret) return

    await fetch(`${appUrl}/api/worker/send-pending`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${cronSecret}`,
      },
    })
  }

  return (
    <Layout>
      <div className="px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">メール送信キュー</h1>
            <p className="mt-2 text-sm text-gray-700">
              送信待ちメールの状態を確認し、ワーカーを手動実行できます。
            </p>
          </div>
          <form action={runWorker}>
            <button
              type="submit"
              className="inline-flex items-center rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500"
            >
              今すぐワーカー実行
            </button>
          </form>
        </div>

        <div className="mb-4 flex flex-wrap items-center gap-3">
          <span className="text-sm text-gray-700">ステータスフィルタ:</span>
          {["ALL", "QUEUED", "SENDING", "SENT", "FAILED"].map((s) => {
            const isAll = s === "ALL"
            const active = isAll ? !statusFilter : statusFilter === s
            return (
              <a
                key={s}
                href={isAll ? "/admin/email-queue" : `/admin/email-queue?status=${s}`}
                className={`rounded-full px-3 py-1 text-xs font-medium border ${
                  active
                    ? "bg-indigo-600 text-white border-indigo-600"
                    : "bg-white text-gray-700 border-gray-300"
                }`}
              >
                {s}
              </a>
            )
          })}
        </div>

        <div className="mb-6 flex flex-wrap gap-4">
          {stats.map((s) => (
            <div
              key={s.status}
              className="bg-white shadow rounded-lg px-4 py-3 text-sm text-gray-700"
            >
              <span className="font-semibold mr-2">{s.status}</span>
              <span>{s._count._all}</span>
            </div>
          ))}
        </div>

        <div className="bg-white shadow rounded-lg overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-3 py-3.5 text-left text-xs font-medium text-gray-500">
                  ステータス
                </th>
                <th className="px-3 py-3.5 text-left text-xs font-medium text-gray-500">宛先</th>
                <th className="px-3 py-3.5 text-left text-xs font-medium text-gray-500">件名</th>
                <th className="px-3 py-3.5 text-left text-xs font-medium text-gray-500">
                  attempts
                </th>
                <th className="px-3 py-3.5 text-left text-xs font-medium text-gray-500">
                  nextAttemptAt
                </th>
                <th className="px-3 py-3.5 text-left text-xs font-medium text-gray-500">
                  lastError
                </th>
                <th className="px-3 py-3.5 text-left text-xs font-medium text-gray-500">
                  createdAt
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {items.map((item) => (
                <tr key={item.id}>
                  <td className="px-3 py-3 text-xs text-gray-700">{item.status}</td>
                  <td className="px-3 py-3 text-xs text-gray-700">{item.to}</td>
                  <td className="px-3 py-3 text-xs text-gray-700 truncate max-w-xs">
                    {item.subject}
                  </td>
                  <td className="px-3 py-3 text-xs text-gray-700">
                    {item.attempts}/{item.maxAttempts}
                  </td>
                  <td className="px-3 py-3 text-xs text-gray-700">
                    {item.nextAttemptAt
                      ? new Date(item.nextAttemptAt).toLocaleString("ja-JP")
                      : "-"}
                  </td>
                  <td className="px-3 py-3 text-xs text-red-600 max-w-xs truncate">
                    {item.lastError || "-"}
                  </td>
                  <td className="px-3 py-3 text-xs text-gray-700">
                    {new Date(item.createdAt).toLocaleString("ja-JP")}
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


