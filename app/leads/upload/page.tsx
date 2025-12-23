"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Layout from "@/components/Layout"
import Papa from "papaparse"

export default function UploadLeadsPage() {
  const router = useRouter()
  const [isUploading, setIsUploading] = useState(false)
  const [textInput, setTextInput] = useState("")

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setIsUploading(true)
    try {
      const text = await file.text()
      const result = Papa.parse(text, {
        header: true,
        skipEmptyLines: true,
      })

      const response = await fetch("/api/leads/upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ data: result.data }),
      })

      if (response.ok) {
        router.push("/leads")
      } else {
        alert("アップロードに失敗しました")
      }
    } catch (error) {
      console.error("Upload error:", error)
      alert("エラーが発生しました")
    } finally {
      setIsUploading(false)
    }
  }

  const handleTextSubmit = async () => {
    if (!textInput.trim()) return

    setIsUploading(true)
    try {
      const lines = textInput.split("\n").filter((line) => line.trim())
      const data = lines.map((line) => {
        const parts = line.split(",").map((p) => p.trim())
        return { email: parts[0] || "", companyName: parts[1] || "", contactName: parts[2] || "" }
      })

      const response = await fetch("/api/leads/upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ data }),
      })

      if (response.ok) {
        router.push("/leads")
      } else {
        alert("アップロードに失敗しました")
      }
    } catch (error) {
      console.error("Upload error:", error)
      alert("エラーが発生しました")
    } finally {
      setIsUploading(false)
    }
  }

  return (
    <Layout>
      <div className="px-4 sm:px-6 lg:px-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">リード一括登録</h1>

        <div className="bg-white shadow rounded-lg p-6 mb-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">CSVファイルアップロード</h2>
          <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md">
            <div className="space-y-1 text-center">
              <input
                type="file"
                accept=".csv"
                onChange={handleFileUpload}
                disabled={isUploading}
                className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
              />
              <p className="text-xs text-gray-500">
                CSV形式（1行目: email,companyName,contactName,position,industry,websiteUrl）
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">テキスト貼り付け</h2>
          <textarea
            value={textInput}
            onChange={(e) => setTextInput(e.target.value)}
            placeholder="メールアドレス,会社名,担当者名&#10;example@company.com,株式会社例,山田太郎"
            rows={10}
            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
          />
          <button
            onClick={handleTextSubmit}
            disabled={isUploading || !textInput.trim()}
            className="mt-4 inline-flex justify-center rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 disabled:opacity-50"
          >
            {isUploading ? "登録中..." : "登録"}
          </button>
        </div>
      </div>
    </Layout>
  )
}

