import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { z } from "zod"

const leadSchema = z.object({
  email: z.string().email(),
  companyName: z.string().optional(),
  contactName: z.string().optional(),
  position: z.string().optional(),
  industry: z.string().optional(),
  websiteUrl: z.string().url().optional().or(z.literal("")),
  memo: z.string().optional(),
  tags: z.string().optional(),
})

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const { data } = await req.json()
    
    if (!Array.isArray(data)) {
      return NextResponse.json({ error: "Invalid data format" }, { status: 400 })
    }

    const results = {
      created: 0,
      skipped: 0,
      errors: [] as string[],
    }

    for (const item of data) {
      try {
        const validated = leadSchema.parse({
          email: item.email || item.Email || item.EMAIL,
          companyName: item.companyName || item.company_name || item["会社名"],
          contactName: item.contactName || item.contact_name || item["担当者名"],
          position: item.position || item["役職"],
          industry: item.industry || item["業種"],
          websiteUrl: item.websiteUrl || item.website_url || item["サイトURL"],
          memo: item.memo || item["メモ"],
          tags: item.tags ? item.tags.split(",").map((t: string) => t.trim()) : [],
        })

        await prisma.lead.upsert({
          where: { email: validated.email },
          update: {
            companyName: validated.companyName,
            contactName: validated.contactName,
            position: validated.position,
            industry: validated.industry,
            websiteUrl: validated.websiteUrl || undefined,
            memo: validated.memo,
            tags: validated.tags || [],
          },
          create: {
            email: validated.email,
            companyName: validated.companyName,
            contactName: validated.contactName,
            position: validated.position,
            industry: validated.industry,
            websiteUrl: validated.websiteUrl || undefined,
            memo: validated.memo,
            tags: validated.tags || [],
            status: "NEW",
          },
        })

        results.created++
      } catch (error) {
        if (error instanceof z.ZodError) {
          results.errors.push(`Invalid data: ${JSON.stringify(item)}`)
        } else {
          results.errors.push(`Error processing: ${JSON.stringify(item)}`)
        }
        results.skipped++
      }
    }

    return NextResponse.json(results)
  } catch (error) {
    console.error("Upload error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

