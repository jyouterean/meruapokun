# セキュリティ実装サマリー

## 実装完了項目

### ✅ 1. 認証・認可システム
- **統一認証ミドルウェア** (`lib/security/middleware.ts`)
  - `requireAuth()`: 認証チェック
  - `checkResourceOwnership()`: リソース所有権チェック
  - IPアドレス・User-Agent取得

### ✅ 2. 入力検証・サニタイゼーション
- **HTMLサニタイゼーション** (`lib/security/sanitize.ts`)
  - DOMPurifyによるXSS対策
  - テキストサニタイゼーション
  - メールアドレス・URL検証
  - ファイル名サニタイゼーション
- **Zodスキーマ検証** (`lib/security/validation.ts`)
  - CSVデータ検証
  - キャンペーンデータ検証
  - ID形式検証（UUID/CUID）

### ✅ 3. レート制限
- **APIレート制限** (`lib/security/rate-limit.ts`)
  - エンドポイント別レート制限
  - メモリベースストア（本番ではRedis推奨）
  - レスポンスヘッダーに制限情報を付与

### ✅ 4. セキュリティヘッダー
- **セキュリティヘッダー設定** (`lib/security/headers.ts`)
  - CSP (Content Security Policy)
  - XSS Protection
  - Frame Options
  - HSTS (本番環境)
- **Next.js Middleware** (`middleware.ts`)
  - 全リクエストにセキュリティヘッダーを適用

### ✅ 5. ログのセキュア化
- **セキュアロガー** (`lib/security/logger.ts`)
  - 個人情報の自動マスキング
  - 構造化ログ（JSON形式）
  - エラーログの安全な出力

### ✅ 6. 環境変数管理
- **環境変数検証** (`lib/security/env.ts`)
  - Zodスキーマによる検証
  - 起動時チェック
  - 型安全な環境変数アクセス

### ✅ 7. エラーハンドリング
- **統一エラーレスポンス**
  - エラーコード体系
  - 情報漏洩防止
  - セキュアなエラーメッセージ

### ✅ 8. APIルートのセキュリティ強化
- `/api/leads/upload`: レート制限、入力検証、サニタイゼーション
- `/api/campaigns`: 認証、レート制限、所有権チェック
- `/api/ai/generate-reply`: レート制限、リソース所有権チェック
- `/api/jobs/send`: CRON_SECRET検証強化

## セキュリティチェックエンドポイント

開発環境でセキュリティ設定を確認できます：

```
GET /api/security-check
```

## 使用方法

### 1. 認証チェック

```typescript
import { requireAuth } from "@/lib/security/middleware"

export async function POST(req: NextRequest) {
  const { error, session } = await requireAuth(req)
  if (error) return error
  // session.user.id を使用
}
```

### 2. レート制限

```typescript
import { checkRateLimit, API_RATE_LIMITS } from "@/lib/security/rate-limit"

const rateLimit = checkRateLimit(req, API_RATE_LIMITS.general)
if (!rateLimit.allowed) {
  return NextResponse.json({ error: "Rate limit exceeded" }, { status: 429 })
}
```

### 3. サニタイゼーション

```typescript
import { sanitizeText, sanitizeEmail } from "@/lib/security/sanitize"

const cleanText = sanitizeText(userInput)
const cleanEmail = sanitizeEmail(userInput)
```

### 4. セキュアログ

```typescript
import { secureLogger } from "@/lib/security/logger"

secureLogger.info("Action completed", { userId, action: "CREATE" })
secureLogger.error("Error occurred", error, { userId })
```

## 次のステップ（推奨）

1. **Redis統合**: レート制限ストアをRedisに移行
2. **WAF導入**: Cloudflare等のWAF導入
3. **監視・アラート**: セキュリティイベントの監視
4. **ペネトレーションテスト**: 定期的なセキュリティテスト
5. **依存関係更新**: 定期的な`npm audit`

