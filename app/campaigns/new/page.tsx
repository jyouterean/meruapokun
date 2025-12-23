"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Layout from "@/components/Layout"

export default function NewCampaignPage() {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formData, setFormData] = useState({
    name: "",
    subjectTemplate: "",
    bodyTemplate: "",
    fromName: "",
    fromEmail: "",
    signature: "",
    unsubscribeText: "",
    rateLimitPerMin: 10,
    rateLimitPerDay: 50,
    randomDelayMin: 20,
    randomDelayMax: 90,
    useAI: false,
    aiTone: "professional",
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      const response = await fetch("/api/campaigns", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      })

      if (response.ok) {
        const data = await response.json()
        router.push(`/campaigns/${data.id}`)
      } else {
        alert("作成に失敗しました")
      }
    } catch (error) {
      console.error("Error:", error)
      alert("エラーが発生しました")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Layout>
      <div className="px-4 sm:px-6 lg:px-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">新規キャンペーン作成</h1>

        <form onSubmit={handleSubmit} className="bg-white shadow rounded-lg p-6 space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              キャンペーン名 *
            </label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              件名テンプレート *
            </label>
            <input
              type="text"
              required
              value={formData.subjectTemplate}
              onChange={(e) => setFormData({ ...formData, subjectTemplate: e.target.value })}
              placeholder="例: {{companyName}}様へのご提案"
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            />
            <p className="mt-1 text-xs text-gray-500">
              変数: {"{{companyName}}"}, {"{{contactName}}"}, {"{{industry}}"}
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              本文テンプレート *
            </label>
            <textarea
              required
              rows={10}
              value={formData.bodyTemplate}
              onChange={(e) => setFormData({ ...formData, bodyTemplate: e.target.value })}
              placeholder="例: {{contactName}}様&#10;&#10;いつもお世話になっております。"
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                送信元名 *
              </label>
              <input
                type="text"
                required
                value={formData.fromName}
                onChange={(e) => setFormData({ ...formData, fromName: e.target.value })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                送信元メール *
              </label>
              <input
                type="email"
                required
                value={formData.fromEmail}
                onChange={(e) => setFormData({ ...formData, fromEmail: e.target.value })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              署名
            </label>
            <textarea
              rows={3}
              value={formData.signature}
              onChange={(e) => setFormData({ ...formData, signature: e.target.value })}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              配信停止文言
            </label>
            <textarea
              rows={2}
              value={formData.unsubscribeText}
              onChange={(e) => setFormData({ ...formData, unsubscribeText: e.target.value })}
              placeholder="例: このメールの配信を停止する場合は、以下のリンクをクリックしてください。"
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                1分あたりの送信上限
              </label>
              <input
                type="number"
                min="1"
                value={formData.rateLimitPerMin}
                onChange={(e) => setFormData({ ...formData, rateLimitPerMin: parseInt(e.target.value) || 10 })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                1日あたりの送信上限
              </label>
              <input
                type="number"
                min="1"
                value={formData.rateLimitPerDay}
                onChange={(e) => setFormData({ ...formData, rateLimitPerDay: parseInt(e.target.value) || 50 })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                ランダムディレイ最小（秒）
              </label>
              <input
                type="number"
                min="0"
                value={formData.randomDelayMin}
                onChange={(e) => setFormData({ ...formData, randomDelayMin: parseInt(e.target.value) || 20 })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                ランダムディレイ最大（秒）
              </label>
              <input
                type="number"
                min="0"
                value={formData.randomDelayMax}
                onChange={(e) => setFormData({ ...formData, randomDelayMax: parseInt(e.target.value) || 90 })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              />
            </div>
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              id="useAI"
              checked={formData.useAI}
              onChange={(e) => setFormData({ ...formData, useAI: e.target.checked })}
              className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
            />
            <label htmlFor="useAI" className="ml-2 block text-sm text-gray-900">
              AIで文面生成を使用する
            </label>
          </div>

          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={() => router.back()}
              className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
            >
              キャンセル
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50"
            >
              {isSubmitting ? "作成中..." : "作成"}
            </button>
          </div>
        </form>
      </div>
    </Layout>
  )
}

