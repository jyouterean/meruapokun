import { z } from "zod"

/**
 * ファイルアップロード検証スキーマ
 */
export const fileUploadSchema = z.object({
  name: z.string().min(1).max(255),
  type: z.string().regex(/^text\/csv|application\/vnd\.ms-excel$/),
  size: z.number().max(10 * 1024 * 1024), // 10MB制限
})

/**
 * CSVデータ検証スキーマ
 */
export const csvRowSchema = z.object({
  email: z.string().email().max(254),
  companyName: z.string().max(255).optional(),
  contactName: z.string().max(255).optional(),
  position: z.string().max(100).optional(),
  industry: z.string().max(100).optional(),
  websiteUrl: z.string().url().max(2048).optional().or(z.literal("")),
  memo: z.string().max(5000).optional(),
  tags: z.string().max(500).optional(),
})

/**
 * キャンペーンスキーマ（強化版）
 */
export const campaignSchema = z.object({
  name: z.string().min(1).max(255),
  subjectTemplate: z.string().min(1).max(200),
  bodyTemplate: z.string().min(1).max(50000), // 50KB制限
  fromName: z.string().min(1).max(100),
  fromEmail: z.string().email().max(254),
  signature: z.string().max(2000).optional(),
  unsubscribeText: z.string().max(500).optional(),
  rateLimitPerMin: z.number().int().positive().max(1000),
  rateLimitPerDay: z.number().int().positive().max(100000),
  randomDelayMin: z.number().int().nonnegative().max(300),
  randomDelayMax: z.number().int().nonnegative().max(600),
  useAI: z.boolean(),
  aiTone: z.enum(["professional", "casual", "friendly", "formal"]).default("professional"),
  aiProhibitedWords: z.array(z.string().max(50)).max(100).default([]),
})

/**
 * UUID検証
 */
export function isValidUUID(id: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
  return uuidRegex.test(id)
}

/**
 * CUID検証（PrismaのデフォルトID形式）
 */
export function isValidCUID(id: string): boolean {
  return /^c[a-z0-9]{24}$/.test(id)
}

/**
 * ID検証（UUIDまたはCUID）
 */
export function validateID(id: string): boolean {
  return isValidUUID(id) || isValidCUID(id)
}

