#!/bin/bash

# ローカル開発環境のセットアップスクリプト

echo "🚀 メールくん - ローカル開発環境セットアップ"
echo ""

# .env.localが存在しない場合は作成
if [ ! -f .env.local ]; then
    echo "📝 .env.localファイルを作成しています..."
    cp .env.example .env.local 2>/dev/null || echo ".env.exampleが見つかりません。手動で.env.localを作成してください。"
    echo "✅ .env.localを作成しました。必要な環境変数を設定してください。"
    echo ""
fi

# 依存関係のインストール
echo "📦 依存関係をインストールしています..."
npm install

# Prismaクライアントの生成
echo "🔧 Prismaクライアントを生成しています..."
npm run db:generate

echo ""
echo "✅ セットアップが完了しました！"
echo ""
echo "次のステップ:"
echo "1. .env.localファイルを編集して、必要なAPIキーを設定してください"
echo "2. データベースをセットアップ: npm run db:push"
echo "3. 開発サーバーを起動: npm run dev"
echo ""
echo "ローカルURL: http://localhost:3000"
echo ""

