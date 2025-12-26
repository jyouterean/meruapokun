# SMTP設定ガイド

## 🔴 現在のエラー: SMTP認証に失敗

エラーメッセージ: `Invalid login: 535 Authentication failed: Bad username / password`

これは、SMTP_USER または SMTP_PASSWORD が正しく設定されていないことを示しています。

---

## 📧 SendGridを使用する場合

### 設定値

```
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USER=apikey
SMTP_PASSWORD=SG.xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
SMTP_FROM=info@keimatch.com
```

### 重要なポイント

1. **SMTP_USERは必ず `apikey`（固定）**
   - 他の値は使用できません
   - 大文字小文字は区別されます

2. **SMTP_PASSWORDはSendGridのAPIキー**
   - `SG.` で始まる文字列
   - SendGridダッシュボードで生成・確認

### SendGrid APIキーの取得方法

1. [SendGridダッシュボード](https://app.sendgrid.com/)にログイン
2. **Settings** → **API Keys** をクリック
3. **Create API Key** をクリック
4. 名前を入力（例: "メールくん"）
5. **Full Access** または **Mail Send** の権限を選択
6. **Create & View** をクリック
7. 表示されたAPIキーをコピー（**この画面でしか表示されません**）
8. Vercelの環境変数 `SMTP_PASSWORD` に貼り付け

### よくある間違い

❌ **間違い**: `SMTP_USER` にAPIキーを設定
✅ **正しい**: `SMTP_USER=apikey`, `SMTP_PASSWORD=SG.xxxxx`

❌ **間違い**: APIキーの先頭の `SG.` を削除
✅ **正しい**: `SG.` を含めて完全にコピー

❌ **間違い**: スペースや改行が含まれている
✅ **正しい**: 余分な文字を含めず、そのまま貼り付け

---

## 📧 Gmailを使用する場合

### 設定値

```
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=yourname@gmail.com
SMTP_PASSWORD=xxxx xxxx xxxx xxxx
SMTP_FROM=yourname@gmail.com
```

### アプリパスワードの取得方法

1. Googleアカウントにログイン
2. **セキュリティ** → **2段階認証プロセス** を有効化
3. **アプリパスワード** をクリック
4. アプリを選択（「メール」）
5. デバイスを選択（「その他（カスタム名）」→「メールくん」）
6. **生成** をクリック
7. 表示された16文字のパスワードをコピー
8. Vercelの環境変数 `SMTP_PASSWORD` に貼り付け（スペースは削除）

---

## 🔧 Vercelでの環境変数設定方法

1. **Vercelダッシュボード** → プロジェクト選択
2. **Settings** → **Environment Variables**
3. 以下の変数を追加（**Production**, **Preview**, **Development** すべてにチェック）:

   ```
   SMTP_HOST=smtp.sendgrid.net
   SMTP_PORT=587
   SMTP_USER=apikey
   SMTP_PASSWORD=SG.xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
   SMTP_FROM=info@keimatch.com
   ```

4. **Save** をクリック
5. **Deployments** タブ → **Redeploy** を実行

---

## ✅ 設定確認チェックリスト

- [ ] `SMTP_HOST` が正しく設定されている
- [ ] `SMTP_PORT` が正しく設定されている（SendGrid: 587, Gmail: 587）
- [ ] `SMTP_USER` が正しく設定されている（SendGrid: `apikey`, Gmail: メールアドレス）
- [ ] `SMTP_PASSWORD` が正しく設定されている（SendGrid: APIキー, Gmail: アプリパスワード）
- [ ] `SMTP_FROM` が正しく設定されている（送信元メールアドレス）
- [ ] 環境変数に余分なスペースや改行が含まれていない
- [ ] Vercelで再デプロイを実行した

---

## 🐛 トラブルシューティング

### エラー: "Invalid login: 535 Authentication failed"

**原因**: SMTP_USER または SMTP_PASSWORD が間違っている

**対処法**:
1. SendGridの場合: `SMTP_USER=apikey` を確認（必ず小文字）
2. APIキーを再生成して設定し直す
3. 環境変数に余分なスペースが含まれていないか確認

### エラー: "ECONNREFUSED"

**原因**: SMTP_HOST または SMTP_PORT が間違っている

**対処法**:
1. SendGrid: `SMTP_HOST=smtp.sendgrid.net`, `SMTP_PORT=587`
2. Gmail: `SMTP_HOST=smtp.gmail.com`, `SMTP_PORT=587`
3. ファイアウォールでポートがブロックされていないか確認

### エラー: "timeout"

**原因**: ネットワーク接続の問題

**対処法**:
1. インターネット接続を確認
2. SMTP_HOST が正しいか確認
3. ポート番号が正しいか確認

---

## 📝 設定例（SendGrid）

```env
# Vercel環境変数
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USER=apikey
SMTP_PASSWORD=SG.xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
SMTP_FROM=info@keimatch.com
```

**注意**: `SMTP_PASSWORD` の `SG.` 以降の `x` 部分を実際のAPIキーに置き換えてください。

---

## 📝 設定例（Gmail）

```env
# Vercel環境変数
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=yourname@gmail.com
SMTP_PASSWORD=xxxxxxxxxxxxxxxx
SMTP_FROM=yourname@gmail.com
```

**注意**: Gmailのアプリパスワードは16文字で、スペースは含めません。

---

## 🔐 セキュリティ注意事項

- APIキーやパスワードは**絶対に**Gitにコミットしないでください
- Vercelの環境変数は暗号化されて保存されます
- APIキーを漏洩した場合は、すぐに再生成してください

