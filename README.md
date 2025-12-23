# メールくん - メルアポ用AIエージェント

メルアポ用AIエージェント管理システム。見込み顧客リストを投入すると、テンプレート/AIで文面生成して自動送信し、返信のやり取り（スレッド管理）と配信結果（送信/開封/クリック/返信/バウンス/エラー）を管理画面で全て閲覧できます。

## 主な機能

- **リード管理**: CSVアップロード、テキスト貼り付けで一括登録
- **キャンペーン管理**: テンプレート/AI生成によるメール送信
- **自動送信**: レート制限、ランダムディレイ対応
- **返信管理**: スレッド表示、AI返信下書き生成
- **トラッキング**: 開封、クリック、バウンス、返信の追跡
- **配信停止**: ワンタイムトークンによる安全な配信停止
- **監査ログ**: 全ての操作を記録

## 技術スタック

- **フロントエンド**: Next.js 14 (App Router) + TypeScript + Tailwind CSS
- **バックエンド**: Next.js Route Handlers + Prisma
- **データベース**: PostgreSQL (Neon想定)
- **認証**: NextAuth.js
- **送信**: SendGrid / AWS SES（抽象化レイヤーで切り替え可能）
- **AI**: OpenAI API (GPT-4o-mini)
- **ジョブ実行**: Vercel Cron / node-cron

## セットアップ

### 1. 依存関係のインストール

```bash
npm install
```

または、自動セットアップスクリプトを使用：

```bash
npm run setup:local
```

### 2. 環境変数の設定

`.env.local`ファイルを作成し、以下の変数を設定：

```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/mailkun?schema=public"

# NextAuth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="local-development-secret-key-change-in-production"

# Email Provider
EMAIL_PROVIDER="sendgrid"
SENDGRID_API_KEY="your-sendgrid-api-key"
SENDGRID_FROM_EMAIL="noreply@localhost"
SENDGRID_FROM_NAME="メールくん（開発環境）"

# OpenAI
OPENAI_API_KEY="your-openai-api-key"

# Webhook
WEBHOOK_SIGNING_SECRET="your-webhook-secret"

# App
APP_BASE_URL="http://localhost:3000"
APP_COMPANY_NAME="Your Company"
APP_COMPANY_ADDRESS="Your Address"

# Cron (optional)
CRON_SECRET="your-cron-secret"
```

### 3. データベースのセットアップ

```bash
# Prismaクライアント生成
npm run db:generate

# データベースにスキーマを適用
npm run db:push

# または、マイグレーションを使用
npm run db:migrate
```

### 4. 開発サーバーの起動

```bash
npm run dev
```

### 5. 送信ジョブの設定

#### Vercel Cronを使用する場合

`vercel.json`を作成：

```json
{
  "crons": [
    {
      "path": "/api/jobs/send",
      "schedule": "*/5 * * * *"
    }
  ]
}
```

#### node-cronを使用する場合（開発環境）

`scripts/cron.ts`を作成して実行：

```typescript
import cron from "node-cron"

cron.schedule("*/5 * * * *", async () => {
  await fetch(`${process.env.APP_BASE_URL}/api/jobs/send`, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${process.env.CRON_SECRET}`,
    },
  })
})
```

## 使用方法

### 1. リードの登録

- `/leads`ページでCSVアップロードまたはテキスト貼り付け
- 必須項目: email
- 推奨項目: companyName, contactName, position, industry, websiteUrl

### 2. キャンペーンの作成

- `/campaigns/new`でキャンペーンを作成
- 件名・本文テンプレートを設定（変数: `{{companyName}}`, `{{contactName}}`など）
- AI生成を有効にすると、OpenAIで文面を自動生成

### 3. キャンペーンの開始

- キャンペーン詳細ページで「開始」ボタンをクリック
- 送信キューが生成され、自動送信が開始

### 4. 返信の確認と返信

- `/campaigns/[id]/threads`で返信一覧を確認
- スレッド詳細でAI返信下書きを生成・送信

## セキュリティ・法令順守

- **スパム対策**: レート制限、ランダムディレイ、重複送信防止
- **配信停止**: ワンタイムトークンによる安全な配信停止
- **監査ログ**: 全ての操作を記録（プロンプト含む）
- **送信フッター**: 会社情報、送信理由、配信停止リンクを自動付与
- **NGワードフィルタ**: 誇大表現を自動フィルタ

## ローカル開発環境

### ローカルURL

開発サーバー起動後、以下のURLでアクセスできます：

- **メインアプリ**: http://localhost:3000
- **Webhookテスト**: http://localhost:3000/api/test/webhook
- **Prisma Studio**: `npm run db:studio` で起動（通常は http://localhost:5555）

### Webhookのテスト（ngrok使用）

ローカル環境でWebhookを受信するには、ngrokを使用してローカルサーバーを公開します：

1. **ngrokのインストール**
   ```bash
   brew install ngrok  # macOS
   ```

2. **ngrokの起動**
   ```bash
   # ターミナル1: Next.js開発サーバー
   npm run dev
   
   # ターミナル2: ngrok
   ngrok http 3000
   ```

3. **環境変数の更新**
   ngrokが表示するURL（例: `https://xxxx-xx-xx-xx-xx.ngrok-free.app`）を`.env.local`に設定：
   ```env
   APP_BASE_URL="https://xxxx-xx-xx-xx-xx.ngrok-free.app"
   NEXTAUTH_URL="https://xxxx-xx-xx-xx-xx.ngrok-free.app"
   ```

4. **SendGrid Webhook設定**
   SendGridの管理画面で以下のURLを設定：
   - Event Webhook: `https://xxxx-xx-xx-xx-xx.ngrok-free.app/api/webhooks/email/events`
   - Inbound Parse: `https://xxxx-xx-xx-xx-xx.ngrok-free.app/api/webhooks/email/inbound`

詳細は `scripts/ngrok-setup.md` を参照してください。

### Webhookテストスクリプト

```bash
npm run test:webhook
```

## 注意事項

- 初回送信時は1日上限を小さく設定（デフォルト: 50通/日）
- 送信元ドメインのSPF/DKIM/DMARC設定を推奨
- 大量送信前にテスト送信を実施
- 各メールプロバイダの利用規約を遵守
- ローカル開発環境では`.env.local`を使用（`.gitignore`に含まれています）

## ライセンス

MIT

