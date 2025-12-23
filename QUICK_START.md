# クイックスタートガイド

ローカル開発環境を最短でセットアップする手順です。

## 1. 環境変数の設定

`.env.local`ファイルを作成（`.env.example`をコピー）：

```bash
cp .env.example .env.local
```

`.env.local`を編集して、最低限以下の設定を行います：

```env
# データベース（Neonなど）
DATABASE_URL="postgresql://user:password@host:5432/dbname?schema=public"

# NextAuth（ランダムな文字列を生成）
NEXTAUTH_SECRET="your-random-secret-here"

# ローカルURL
APP_BASE_URL="http://localhost:3000"
NEXTAUTH_URL="http://localhost:3000"
```

## 2. 依存関係のインストール

```bash
npm install
```

## 3. データベースのセットアップ

```bash
# Prismaクライアントを生成
npm run db:generate

# データベースにスキーマを適用
npm run db:push
```

## 4. 開発サーバーの起動

```bash
npm run dev
```

ブラウザで **http://localhost:3000** にアクセス！

## 5. 初回ログイン

1. http://localhost:3000/login にアクセス
2. メールアドレスを入力（NextAuth Email認証を使用）
3. メールで送信されたリンクをクリックしてログイン

> **注意**: メール認証が設定されていない場合は、NextAuthの設定を変更するか、簡易認証を使用してください。

## ローカルURL一覧

| ページ | URL |
|--------|-----|
| ホーム | http://localhost:3000 |
| ログイン | http://localhost:3000/login |
| ダッシュボード | http://localhost:3000/dashboard |
| リード管理 | http://localhost:3000/leads |
| キャンペーン | http://localhost:3000/campaigns |
| 設定 | http://localhost:3000/settings |
| Webhookテスト | http://localhost:3000/api/test/webhook |
| Prisma Studio | `npm run db:studio` で起動 |

## 次のステップ

1. **リードを登録**: `/leads/upload` でCSVアップロード
2. **キャンペーンを作成**: `/campaigns/new` で新規作成
3. **Webhook設定**: ngrokを使用してローカルサーバーを公開（`scripts/ngrok-setup.md`参照）

詳細は [LOCAL_DEVELOPMENT.md](./LOCAL_DEVELOPMENT.md) を参照してください。

