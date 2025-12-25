# Vercel環境変数設定ガイド

このドキュメントでは、Vercelに設定すべき環境変数の一覧と設定方法を説明します。

## 📋 設定手順

1. Vercelダッシュボードにアクセス
2. プロジェクト（`meruapokun`）を選択
3. **Settings** → **Environment Variables**
4. 以下の環境変数を追加（各変数で **Production**, **Preview**, **Development** すべてにチェック）
5. **Save** をクリック
6. **Deployments** タブから **Redeploy** を実行

---

## 🔴 必須環境変数

### データベース

| 変数名 | 値の例 | 説明 |
|--------|--------|------|
| `DATABASE_URL` | `postgresql://neondb_owner:npg_xHBrT1VFgo9G@ep-steep-salad-a1z98a2f-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require` | Neon PostgreSQL接続文字列 |

### NextAuth認証

| 変数名 | 値の例 | 説明 |
|--------|--------|------|
| `NEXTAUTH_URL` | `https://your-domain.vercel.app` | 本番URL（Vercelの自動URLでも可） |
| `NEXTAUTH_SECRET` | `your-32-characters-or-longer-random-string` | 32文字以上のランダム文字列（`openssl rand -base64 32`で生成） |

### メール送信（SMTP / SendGrid）

**SMTPを使用する場合（ワーカー用）:**

| 変数名 | 値の例 | 説明 |
|--------|--------|------|
| `SMTP_HOST` | `smtp.sendgrid.net` | SMTPサーバーホスト |
| `SMTP_PORT` | `587` | SMTPポート（587 or 465） |
| `SMTP_USER` | `apikey` | SMTPユーザー名（SendGridの場合は`apikey`） |
| `SMTP_PASSWORD` | `SG.xxxxx` | SMTPパスワード（SendGridの場合はAPIキー） |
| `SMTP_FROM` | `noreply@yourdomain.com` | 送信元メールアドレス |

**または SendGrid APIを使用する場合:**

| 変数名 | 値の例 | 説明 |
|--------|--------|------|
| `EMAIL_PROVIDER` | `sendgrid` | `sendgrid` / `ses` / `gmail` |
| `SENDGRID_API_KEY` | `SG.xxxxx` | SendGrid APIキー |
| `SENDGRID_FROM_EMAIL` | `noreply@yourdomain.com` | 送信元メールアドレス |
| `SENDGRID_FROM_NAME` | `メールくん` | 送信元名 |

### OpenAI

| 変数名 | 値の例 | 説明 |
|--------|--------|------|
| `OPENAI_API_KEY` | `sk-xxxxx` | OpenAI APIキー |

### Webhook

| 変数名 | 値の例 | 説明 |
|--------|--------|------|
| `WEBHOOK_SIGNING_SECRET` | `your-32-characters-or-longer-random-string` | Webhook署名検証用シークレット（32文字以上） |

### アプリ設定

| 変数名 | 値の例 | 説明 |
|--------|--------|------|
| `APP_BASE_URL` | `https://your-domain.vercel.app` | アプリのベースURL（`NEXTAUTH_URL`と同じでOK） |
| `APP_COMPANY_NAME` | `Your Company` | 会社名（メールフッターに表示） |
| `APP_COMPANY_ADDRESS` | `東京都...` | 会社住所（メールフッターに表示、任意） |

### ワーカー（GitHub Actions用）

| 変数名 | 値の例 | 説明 |
|--------|--------|------|
| `CRON_SECRET` | `your-32-characters-or-longer-random-string` | ワーカーAPI保護用シークレット（32文字以上） |
| `APP_URL` | `https://your-domain.vercel.app` | 本番URL（GitHub Actionsから叩くURL） |

---

## 🟡 オプション環境変数

### AWS SES（EMAIL_PROVIDER=sesの場合）

| 変数名 | 値の例 | 説明 |
|--------|--------|------|
| `AWS_REGION` | `us-east-1` | AWSリージョン |
| `AWS_ACCESS_KEY_ID` | `AKIAxxxxx` | AWSアクセスキーID |
| `AWS_SECRET_ACCESS_KEY` | `xxxxx` | AWSシークレットアクセスキー |

### ワーカー設定（デフォルト値で動作するが、カスタマイズ可能）

| 変数名 | デフォルト値 | 説明 |
|--------|------------|------|
| `WORKER_BATCH_SIZE` | `50` | 一度に処理するメール数 |
| `WORKER_LOCK_TTL_SECONDS` | `540` | ロックの有効期限（秒） |
| `WORKER_MAX_ATTEMPTS` | `5` | 最大リトライ回数 |
| `WORKER_RETRY_BACKOFF_MINUTES` | `5,15,60,360` | リトライ間隔（分）のカンマ区切り |

---

## 📝 設定例（最小構成）

最低限、以下の環境変数があれば動作します：

```env
# データベース
DATABASE_URL=postgresql://neondb_owner:npg_xHBrT1VFgo9G@ep-steep-salad-a1z98a2f-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require

# NextAuth
NEXTAUTH_URL=https://your-domain.vercel.app
NEXTAUTH_SECRET=your-32-characters-or-longer-random-string

# SMTP（ワーカー用）
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USER=apikey
SMTP_PASSWORD=SG.your-sendgrid-api-key
SMTP_FROM=noreply@yourdomain.com

# OpenAI
OPENAI_API_KEY=sk-your-openai-api-key

# Webhook
WEBHOOK_SIGNING_SECRET=your-32-characters-or-longer-random-string

# アプリ
APP_BASE_URL=https://your-domain.vercel.app
APP_COMPANY_NAME=Your Company

# ワーカー
CRON_SECRET=your-32-characters-or-longer-random-string
APP_URL=https://your-domain.vercel.app
```

---

## 🔐 シークレット生成コマンド

ランダムなシークレットを生成する場合：

```bash
# macOS / Linux
openssl rand -base64 32

# または
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

---

## ✅ 設定後の確認

1. すべての環境変数を設定
2. **Redeploy** を実行
3. ビルドログでエラーが出ないことを確認
4. アプリが正常に起動することを確認

---

## ⚠️ 注意事項

- **Production**, **Preview**, **Development** すべてにチェックを入れることを推奨
- シークレットは32文字以上を推奨
- `DATABASE_URL` はビルド時にも必要（Prismaクライアントの初期化のため）
- `APP_URL` と `APP_BASE_URL` は同じ値でOK（本番URL）

