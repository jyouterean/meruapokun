# ローカル開発環境でのWebhook設定（ngrok使用）

ローカル開発環境でWebhookを受信するには、ngrokを使用してローカルサーバーを公開する必要があります。

## 1. ngrokのインストール

```bash
# Homebrew (macOS)
brew install ngrok

# または公式サイトからダウンロード
# https://ngrok.com/download
```

## 2. ngrokの起動

```bash
# Next.js開発サーバーを起動
npm run dev

# 別のターミナルでngrokを起動
ngrok http 3000
```

ngrokが起動すると、以下のようなURLが表示されます：
```
Forwarding  https://xxxx-xx-xx-xx-xx.ngrok-free.app -> http://localhost:3000
```

## 3. 環境変数の更新

`.env.local`ファイルを更新：

```env
APP_BASE_URL="https://xxxx-xx-xx-xx-xx.ngrok-free.app"
NEXTAUTH_URL="https://xxxx-xx-xx-xx-xx.ngrok-free.app"
```

## 4. SendGrid Webhook設定

SendGridの管理画面で以下のWebhook URLを設定：

- **Event Webhook**: `https://xxxx-xx-xx-xx-xx.ngrok-free.app/api/webhooks/email/events`
- **Inbound Parse**: `https://xxxx-xx-xx-xx-xx.ngrok-free.app/api/webhooks/email/inbound`

## 5. Webhook署名検証

`.env.local`に`WEBHOOK_SIGNING_SECRET`を設定（SendGridの管理画面から取得）

## 注意事項

- ngrokの無料プランでは、URLが毎回変わります
- 本番環境では、固定ドメインを使用してください
- ngrokのURLは公開されているため、セキュリティに注意してください

