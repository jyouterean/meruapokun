import { getServerSession } from "next-auth"
import { redirect } from "next/navigation"
import { authOptions } from "@/lib/auth"
import Layout from "@/components/Layout"
import { prisma } from "@/lib/prisma"

export default async function DashboardPage() {
  const session = await getServerSession(authOptions)
  
  if (!session) {
    redirect("/login")
  }

  // KPI集計
  const [
    totalLeads,
    totalCampaigns,
    totalSent,
    totalReplied,
    recentEvents,
  ] = await Promise.all([
    prisma.lead.count(),
    prisma.campaign.count(),
    prisma.emailMessage.count({
      where: { status: { in: ["SENT", "DELIVERED"] } },
    }),
    prisma.lead.count({ where: { status: "REPLIED" } }),
    prisma.event.findMany({
      take: 10,
      orderBy: { createdAt: "desc" },
      include: {
        lead: true,
        campaign: true,
      },
    }),
  ])

  const stats = [
    { name: "総リード数", value: totalLeads },
    { name: "キャンペーン数", value: totalCampaigns },
    { name: "送信済み", value: totalSent },
    { name: "返信あり", value: totalReplied },
  ]

  return (
    <Layout>
      <div className="px-4 sm:px-6 lg:px-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">ダッシュボード</h1>
        
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4 mb-8">
          {stats.map((stat) => (
            <div key={stat.name} className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="text-2xl font-bold text-gray-900">{stat.value}</div>
                  </div>
                </div>
                <div className="mt-2">
                  <div className="text-sm font-medium text-gray-500">{stat.name}</div>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">直近のイベント</h2>
            <div className="flow-root">
              <ul className="-mb-8">
                {recentEvents.map((event, idx) => (
                  <li key={event.id}>
                    <div className="relative pb-8">
                      {idx !== recentEvents.length - 1 && (
                        <span
                          className="absolute top-4 left-4 -ml-px h-full w-0.5 bg-gray-200"
                          aria-hidden="true"
                        />
                      )}
                      <div className="relative flex space-x-3">
                        <div>
                          <span className="h-8 w-8 rounded-full bg-indigo-500 flex items-center justify-center ring-8 ring-white">
                            <span className="text-white text-xs font-bold">
                              {event.type.charAt(0)}
                            </span>
                          </span>
                        </div>
                        <div className="min-w-0 flex-1 pt-1.5 flex justify-between space-x-4">
                          <div>
                            <p className="text-sm text-gray-500">
                              <span className="font-medium text-gray-900">
                                {event.lead.email}
                              </span>
                              {" - "}
                              <span className="font-medium">{event.type}</span>
                            </p>
                            <p className="text-xs text-gray-400">
                              {event.campaign.name}
                            </p>
                          </div>
                          <div className="text-right text-sm whitespace-nowrap text-gray-500">
                            {new Date(event.createdAt).toLocaleString("ja-JP")}
                          </div>
                        </div>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  )
}

