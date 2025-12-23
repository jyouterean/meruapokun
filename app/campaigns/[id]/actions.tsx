"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { CampaignStatus } from "@prisma/client"

export default function CampaignActions({
  campaignId,
  status,
}: {
  campaignId: string
  status: CampaignStatus
}) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)

  const handleStart = async () => {
    if (!confirm("キャンペーンを開始しますか？")) return

    setIsLoading(true)
    try {
      const response = await fetch(`/api/campaigns/${campaignId}/start`, {
        method: "POST",
      })

      if (response.ok) {
        router.refresh()
      } else {
        alert("開始に失敗しました")
      }
    } catch (error) {
      console.error("Error:", error)
      alert("エラーが発生しました")
    } finally {
      setIsLoading(false)
    }
  }

  const handleStop = async () => {
    if (!confirm("キャンペーンを停止しますか？")) return

    setIsLoading(true)
    try {
      const response = await fetch(`/api/campaigns/${campaignId}/stop`, {
        method: "POST",
      })

      if (response.ok) {
        router.refresh()
      } else {
        alert("停止に失敗しました")
      }
    } catch (error) {
      console.error("Error:", error)
      alert("エラーが発生しました")
    } finally {
      setIsLoading(false)
    }
  }

  if (status === "RUNNING") {
    return (
      <button
        onClick={handleStop}
        disabled={isLoading}
        className="inline-block rounded-md bg-red-600 px-3 py-2 text-center text-sm font-semibold text-white shadow-sm hover:bg-red-500 disabled:opacity-50"
      >
        {isLoading ? "停止中..." : "停止"}
      </button>
    )
  }

  if (status === "DRAFT" || status === "PAUSED") {
    return (
      <button
        onClick={handleStart}
        disabled={isLoading}
        className="inline-block rounded-md bg-green-600 px-3 py-2 text-center text-sm font-semibold text-white shadow-sm hover:bg-green-500 disabled:opacity-50"
      >
        {isLoading ? "開始中..." : "開始"}
      </button>
    )
  }

  return null
}

