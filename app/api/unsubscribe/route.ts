import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function POST(req: NextRequest) {
  try {
    const { token } = await req.json()

    if (!token) {
      return NextResponse.json({ error: "Token is required" }, { status: 400 })
    }

    const unsubscribe = await prisma.unsubscribe.findUnique({
      where: { token },
      include: { lead: true },
    })

    if (!unsubscribe) {
      return NextResponse.json({ error: "Invalid token" }, { status: 404 })
    }

    // リードステータス更新
    if (unsubscribe.leadId) {
      await prisma.lead.update({
        where: { id: unsubscribe.leadId },
        data: { status: "UNSUBSCRIBED" },
      })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Unsubscribe error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

