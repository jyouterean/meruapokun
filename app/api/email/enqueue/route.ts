import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { z } from "zod"

const enqueueSchema = z.object({
  to: z.string().email(),
  subject: z.string().min(1),
  text: z.string().optional(),
  html: z.string().optional(),
  idempotencyKey: z.string().min(1),
})

export async function POST(req: NextRequest) {
  try {
    const json = await req.json()
    const data = enqueueSchema.parse(json)

    const existing = await prisma.emailQueue.findUnique({
      where: { idempotencyKey: data.idempotencyKey },
    })

    if (existing) {
      return NextResponse.json({ ok: true, queued: false, email: existing })
    }

    const email = await prisma.emailQueue.create({
      data: {
        to: data.to,
        subject: data.subject,
        text: data.text,
        html: data.html,
        idempotencyKey: data.idempotencyKey,
      },
    })

    return NextResponse.json({ ok: true, queued: true, email })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { ok: false, error: "Validation error", details: error.errors },
        { status: 400 },
      )
    }
    return NextResponse.json(
      { ok: false, error: "Internal server error" },
      { status: 500 },
    )
  }
}


