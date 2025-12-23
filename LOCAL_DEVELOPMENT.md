# ローカル開発環境ガイド

このドキュメントでは、ローカル開発環境でのセットアップと使用方法を説明します。

## クイックスタート

```bash
# 1. 依存関係のインストール
npm install

# 2. 環境変数の設定
cp .env.example .env.local
# .env.localを編集して必要なAPIキーを設定

# 3. データベースのセットアップ
npm run db:generate
npm run db:push

# 4. 開発サーバーの起動
npm run dev
```

ブラウザで http://localhost:3000 にアクセスしてください。

## ローカルURL一覧

| 用途 | URL |
|------|-----|
| メインアプリ | http://localhost:3000 |
| ログイン | http://localhost:3000/login |
| ダッシュボード | http://localhost:3000/dashboard |
| リード管理 | http://localhost:3000/leads |
| キャンペーン管理 | http://localhost:3000/campaigns |
| 設定 | http://localhost:3000/settings |
| Webhookテスト | http://localhost:3000/api/test/webhook |
| Prisma Studio | `npm run db:studio` で起動 |

## Webhookのローカルテスト

### 方法1: ngrokを使用（推奨）

1. **ngrokのインストール**
   ```bash
   brew install ngrok
   ```

2. **ngrokの起動**
   ```bash
   ngrok http 3000
   ```

3. **表示されたURLをコピー**
   ```
   Forwarding  https://xxxx-xx-xx-xx-xx.ngrok-free.app -> http://localhost:3000
   ```

4. **環境変数を更新**
   `.env.local`に以下を追加：
   ```env
   APP_BASE_URL="https://xxxx-xx-xx-xx-xx.ngrok-free.app"
   NEXTAUTH_URL="https://xxxx-xx-xx-xx-xx.ngrok-free.app"
   ```

5. **SendGridにWebhook URLを設定**
   - Event Webhook: `https://xxxx-xx-xx-xx-xx.ngrok-free.app/api/webhooks/email/events`
   - Inbound Parse: `https://xxxx-xx-xx-xx-xx.ngrok-free.app/api/webhooks/email/inbound`

### 方法2: テストスクリプトを使用

```bash
# Webhookテストスクリプトを実行
npm run test:webhook
```

### 方法3: 手動でテスト

```bash
# テストイベントを送信
curl -X POST http://localhost:3000/api/test/webhook \
  -H "Content-Type: application/json" \
  -d '[{"event":"open","email":"test@example.com","timestamp":1234567890}]'
```

## 送信ジョブのローカル実行

開発環境では、Vercel Cronの代わりに手動で送信ジョブを実行できます：

```bash
# 送信ジョブを手動実行
curl -X POST http://localhost:3000/api/jobs/send \
  -H "Authorization: Bearer local-cron-secret"
```

または、`node-cron`を使用して自動実行：

```bash
# 開発用Cronスクリプトを作成（scripts/dev-cron.ts）
npx tsx scripts/dev-cron.ts
```

## データベース管理

### Prisma Studioでデータを確認

```bash
npm run db:studio
```

ブラウザで http://localhost:5555 が開き、データベースの内容を確認できます。

### マイグレーション

```bash
# マイグレーションファイルを作成
npm run db:migrate

# スキーマを直接プッシュ（開発環境のみ）
npm run db:push
```

## トラブルシューティング

### ポート3000が既に使用されている場合

```bash
# 別のポートで起動
PORT=3001 npm run dev
```

### データベース接続エラー

`.env.local`の`DATABASE_URL`を確認してください。ローカルPostgreSQLを使用する場合：

```env
DATABASE_URL="postgresql://postgres:password@localhost:5432/mailkun?schema=public"
```

Neonなどのクラウドデータベースを使用する場合、接続文字列をそのまま使用できます。

### Webhookが受信できない

1. ngrokが正しく起動しているか確認
2. `.env.local`の`APP_BASE_URL`がngrokのURLと一致しているか確認
3. SendGridのWebhook設定を確認
4. ブラウザのコンソールとサーバーログを確認

### 認証エラー

`.env.local`の`NEXTAUTH_SECRET`を設定してください：

```bash
# ランダムなシークレットを生成
openssl rand -base64 32
```

生成された文字列を`NEXTAUTH_SECRET`に設定します。

## 開発時のベストプラクティス

1. **テストデータの使用**: 本番データを使用せず、テスト用のメールアドレスを使用
2. **レート制限の設定**: 開発環境では1日10通程度に制限
3. **ログの確認**: サーバーログとブラウザコンソールを常に確認
4. **データベースのバックアップ**: 重要なテストデータは定期的にバックアップ
5. **環境変数の管理**: `.env.local`は`.gitignore`に含まれているため、安全に管理

## 次のステップ

- [メインREADME](./README.md) を参照して本番環境のセットアップ
- [ngrokセットアップガイド](./scripts/ngrok-setup.md) でWebhookの詳細設定
- 各機能の詳細はコード内のコメントを参照

