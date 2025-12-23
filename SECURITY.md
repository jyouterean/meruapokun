# セキュリティ対策ドキュメント

このドキュメントでは、メールくんのセキュリティ対策について説明します。

## 実装済みセキュリティ対策

### 1. 認証・認可

- **NextAuth.js**: セキュアな認証システム
- **リソース所有権チェック**: ユーザーは自分のリソースのみアクセス可能
- **セッション管理**: JWTベースのセッション管理

### 2. 入力検証・サニタイゼーション

- **Zodスキーマ**: 全ての入力データを検証
- **HTMLサニタイゼーション**: DOMPurifyを使用
- **XSS対策**: テキスト入力のサニタイゼーション
- **SQLインジェクション対策**: Prismaのパラメータ化クエリ + 追加のサニタイゼーション

### 3. レート制限

- **APIエンドポイント**: エンドポイントごとに適切なレート制限
  - 認証: 5分間に10回
  - 一般API: 1分間に60回
  - ファイルアップロード: 1分間に5回
  - AI生成: 1分間に10回
  - Webhook: 1分間に100回

### 4. セキュリティヘッダー

- **X-Content-Type-Options**: nosniff
- **X-Frame-Options**: DENY
- **X-XSS-Protection**: 1; mode=block
- **Content-Security-Policy**: 適切なCSP設定
- **Strict-Transport-Security**: 本番環境でHSTS有効化
- **Referrer-Policy**: strict-origin-when-cross-origin

### 5. ログのセキュア化

- **個人情報マスキング**: メールアドレス、トークン等を自動マスキング
- **構造化ログ**: JSON形式で出力
- **監査ログ**: 全ての重要な操作を記録

### 6. 環境変数管理

- **起動時検証**: アプリ起動時に環境変数を検証
- **型安全**: Zodスキーマによる型安全な検証

### 7. ファイルアップロード

- **ファイルサイズ制限**: 10MBまで
- **ファイルタイプ検証**: CSVのみ許可
- **ファイル名サニタイゼーション**: ディレクトリトラバーサル対策

### 8. エラーハンドリング

- **情報漏洩防止**: エラーメッセージから機密情報を除外
- **エラーコード**: 統一されたエラーコード体系

### 9. Webhookセキュリティ

- **署名検証**: SendGrid/SESのWebhook署名を検証
- **リクエスト検証**: 不正なリクエストを拒否

### 10. データベースセキュリティ

- **Prisma**: パラメータ化クエリによるSQLインジェクション対策
- **接続文字列**: 環境変数で管理
- **最小権限の原則**: 必要な権限のみ付与

## セキュリティチェックリスト

### 開発環境

- [x] 環境変数の検証
- [x] 入力検証
- [x] レート制限
- [x] セキュリティヘッダー
- [x] ログのマスキング

### 本番環境

- [ ] HTTPSの強制
- [ ] HSTSの有効化
- [ ] CSPの厳格化
- [ ] セキュリティ監査
- [ ] 定期的な依存関係の更新
- [ ] セキュリティスキャン

## 推奨事項

### 1. 定期的なセキュリティ更新

```bash
npm audit
npm audit fix
```

### 2. 依存関係の更新

定期的に依存関係を更新し、セキュリティパッチを適用してください。

### 3. ログ監視

本番環境では、ログ監視システム（例: Sentry, Datadog）の導入を推奨します。

### 4. セキュリティスキャン

定期的にセキュリティスキャンを実行してください：
- OWASP ZAP
- Snyk
- npm audit

### 5. ペネトレーションテスト

定期的にペネトレーションテストを実施してください。

## 報告

セキュリティ脆弱性を発見した場合は、以下の方法で報告してください：

1. 直接連絡（セキュリティメールアドレス）
2. GitHub Security Advisory（公開リポジトリの場合）

## 参考資料

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Next.js Security Best Practices](https://nextjs.org/docs/app/building-your-application/configuring/security-headers)
- [Prisma Security](https://www.prisma.io/docs/guides/performance-and-optimization/connection-management#security)

