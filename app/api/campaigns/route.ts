import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { z } from "zod"

const campaignSchema = z.object({
  name: z.string().min(1),
  subjectTemplate: z.string().min(1),
  bodyTemplate: z.string().min(1),
  fromName: z.string().min(1),
  fromEmail: z.string().email(),
  signature: z.string().optional(),
  unsubscribeText: z.string().optional(),
  rateLimitPerMin: z.number().int().positive().default(10),
  rateLimitPerDay: z.number().int().positive().default(50),
  randomDelayMin: z.number().int().nonnegative().default(20),
  randomDelayMax: z.number().int().nonnegative().default(90),
  useAI: z.boolean().default(false),
  aiTone: z.string().default("professional"),
})

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const body = await req.json()
    const validated = campaignSchema.parse(body)

    const campaign = await prisma.campaign.create({
      data: {
        ...validated,
        createdBy: session.user.id,
        status: "DRAFT",
      },
    })

    // 監査ログ
    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: "CAMPAIGN_CREATE",
        entityType: "Campaign",
        entityId: campaign.id,
        campaignId: campaign.id,
        payload: { name: campaign.name },
      },
    })

    return NextResponse.json(campaign)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 })
    }
    console.error("Campaign creation error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const campaigns = await prisma.campaign.findMany({
    orderBy: { createdAt: "desc" },
  })

  return NextResponse.json(campaigns)
}

