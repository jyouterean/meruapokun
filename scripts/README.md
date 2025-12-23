# スクリプト一覧

このディレクトリには、開発・運用に役立つスクリプトが含まれています。

## セットアップスクリプト

### `setup-local.sh`

ローカル開発環境の初期セットアップを自動化します。

```bash
npm run setup:local
# または
bash scripts/setup-local.sh
```

実行内容:
- `.env.local`ファイルの作成（存在しない場合）
- 依存関係のインストール
- Prismaクライアントの生成

## 開発用スクリプト

### `dev-cron.ts`

ローカル開発環境で送信ジョブを定期的に実行します。

```bash
npm run dev:cron
# または
npx tsx scripts/dev-cron.ts
```

- 5分ごとに送信ジョブを実行
- 開発環境での自動送信テストに使用

### `dev-webhook-test.ts`

Webhookエンドポイントのテストを行います。

```bash
npm run test:webhook
# または
npx tsx scripts/dev-webhook-test.ts
```

環境変数:
- `WEBHOOK_URL`: テスト対象のWebhook URL（デフォルト: http://localhost:3000/api/webhooks/email/events）
- `WEBHOOK_SIGNING_SECRET`: Webhook署名検証用のシークレット

## ドキュメント

### `ngrok-setup.md`

ngrokを使用したローカル開発環境でのWebhook設定方法を説明します。

## 注意事項

- これらのスクリプトは開発環境専用です
- 本番環境では使用しないでください
- スクリプトを実行する前に、必要な環境変数が設定されているか確認してください

