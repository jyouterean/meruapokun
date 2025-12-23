"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"

export default function ThreadReply({
  campaignId,
  leadId,
  threadKey,
}: {
  campaignId: string
  leadId: string
  threadKey: string
}) {
  const router = useRouter()
  const [isGenerating, setIsGenerating] = useState(false)
  const [isSending, setIsSending] = useState(false)
  const [draft, setDraft] = useState<{
    subject: string
    html: string
    text: string
  } | null>(null)

  const handleGenerate = async () => {
    setIsGenerating(true)
    try {
      const response = await fetch("/api/ai/generate-reply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ campaignId, leadId, threadKey }),
      })

      if (response.ok) {
        const data = await response.json()
        setDraft(data)
      } else {
        alert("生成に失敗しました")
      }
    } catch (error) {
      console.error("Error:", error)
      alert("エラーが発生しました")
    } finally {
      setIsGenerating(false)
    }
  }

  const handleSend = async () => {
    if (!draft) return

    setIsSending(true)
    try {
      const response = await fetch("/api/threads/reply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          campaignId,
          leadId,
          threadKey,
          subject: draft.subject,
          html: draft.html,
          text: draft.text,
        }),
      })

      if (response.ok) {
        router.refresh()
        setDraft(null)
      } else {
        alert("送信に失敗しました")
      }
    } catch (error) {
      console.error("Error:", error)
      alert("エラーが発生しました")
    } finally {
      setIsSending(false)
    }
  }

  return (
    <div className="bg-white shadow rounded-lg p-6">
      <h2 className="text-lg font-medium text-gray-900 mb-4">返信作成</h2>
      
      {!draft ? (
        <button
          onClick={handleGenerate}
          disabled={isGenerating}
          className="inline-flex justify-center rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 disabled:opacity-50"
        >
          {isGenerating ? "生成中..." : "AIで返信下書きを生成"}
        </button>
      ) : (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">件名</label>
            <input
              type="text"
              value={draft.subject}
              onChange={(e) => setDraft({ ...draft, subject: e.target.value })}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">本文</label>
            <textarea
              rows={10}
              value={draft.text}
              onChange={(e) => setDraft({ ...draft, text: e.target.value, html: e.target.value.replace(/\n/g, "<br>") })}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            />
          </div>
          <div className="flex justify-end space-x-3">
            <button
              onClick={() => setDraft(null)}
              className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
            >
              キャンセル
            </button>
            <button
              onClick={handleSend}
              disabled={isSending}
              className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50"
            >
              {isSending ? "送信中..." : "送信"}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

