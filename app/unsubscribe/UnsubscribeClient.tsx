"use client"

import { useEffect, useState } from "react"
import { useSearchParams } from "next/navigation"

export default function UnsubscribeClient() {
  const searchParams = useSearchParams()
  const token = searchParams.get("token")
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading")
  const [message, setMessage] = useState("")

  useEffect(() => {
    if (!token) {
      setStatus("error")
      setMessage("無効なトークンです")
      return
    }

    fetch("/api/unsubscribe", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setStatus("success")
          setMessage("配信を停止しました。")
        } else {
          setStatus("error")
          setMessage(data.error || "エラーが発生しました")
        }
      })
      .catch((error) => {
        console.error("Unsubscribe error:", error)
        setStatus("error")
        setMessage("エラーが発生しました")
      })
  }, [token])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8 p-8 bg-white rounded-lg shadow">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            配信停止
          </h2>
        </div>
        <div className="text-center">
          {status === "loading" && (
            <p className="text-gray-600">処理中...</p>
          )}
          {status === "success" && (
            <div>
              <p className="text-green-600 font-medium">{message}</p>
              <p className="mt-4 text-sm text-gray-500">
                今後、このメールアドレスへの自動配信は行われません。
              </p>
            </div>
          )}
          {status === "error" && (
            <div>
              <p className="text-red-600 font-medium">{message}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

