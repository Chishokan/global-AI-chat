# 日本生活サポート チャット（global-AI-chat）

特定技能・留学生として日本（佐世保エリア）で働く外国人材を支える統合サポートアプリの **機能②「24時間・多言語Q&Aチャット」**。AIが版管理されたFAQ知識ベースに基づき、利用者の言語で生活・手続きの質問に答えます。

これは **Phase 1（チャットMVP）** の実装です。全体仕様は [`CLAUDE.md`](./CLAUDE.md) と [`docs/HANDOFF.md`](./docs/HANDOFF.md) を参照してください。

## 特徴

- **KBグラウンディング**: 回答は `data/faq.json`（30項目）に基づく。KBに無いことは断定せずスタッフ誘導。
- **同言語応答**: 入力した言語（日本語/英語/ベトナム語など）で返答。
- **やさしい日本語トグル**: 日本語回答を平易化。
- **スタッフに相談**: 人につなぐ座席（記録＋窓口提示）。
- **モバイル前提**: スマホで読みやすいUI。
- **安全**: APIキーはサーバー側のみ。緊急番号（119/110/118）を常に案内。

## 技術スタック

Next.js 15 (App Router) / React 19 / TypeScript / Anthropic Claude API / Vercel

## セットアップ

```bash
nvm use                     # Node 22（.nvmrc）に揃える
npm install
cp .env.example .env.local  # ANTHROPIC_API_KEY を設定（Vercel同期なら vercel env pull）
npm run dev                 # http://localhost:3000
```

開発環境の詳しい構築手順（Vercel同期・ブランチ運用など）は **[`docs/DEVELOPMENT.md`](./docs/DEVELOPMENT.md)** を参照。

### 環境変数

| 変数 | 説明 |
| --- | --- |
| `ANTHROPIC_API_KEY` | Claude APIキー（サーバー専用・必須） |
| `ANTHROPIC_CHAT_MODEL` | （任意）チャット用モデルID。未設定時は既定値 |

`.env` は **コミットしない**（`.gitignore` 済み）。本番は Vercel の環境変数に設定します。

## スクリプト

| コマンド | 内容 |
| --- | --- |
| `npm run dev` | 開発サーバー |
| `npm run build` | 本番ビルド |
| `npm run start` | 本番起動 |
| `npm run lint` | ESLint |
| `npm run typecheck` | 型チェック |

## デプロイ

`git push` で Vercel が自動デプロイ。Vercel に環境変数を設定してください。
初めての方向けの丁寧な手順は **[`docs/DEPLOY.md`](./docs/DEPLOY.md)** を参照。

## ディレクトリ

```
app/page.tsx          チャットUI（クライアント）
app/api/chat/route.ts チャット応答API（サーバー）
lib/chat.ts           チャネル非依存の応答ロジック
lib/claude.ts         Anthropic クライアント
lib/kb.ts             KBの読み込み・組み立て
lib/prompts.ts        システムプロンプト
data/faq.json         FAQ知識ベース（正本・30項目）
```

## 会話ログ（任意）

Google スプレッドシートへ1往復ずつ会話ログを保存できます（カテゴリ・言語を自動付与）。
GAS Web App 経由で、環境変数 `SHEETS_WEBAPP_URL` / `SHEETS_WEBAPP_TOKEN` を設定すると有効化。
設定手順は **[`docs/SHEETS_LOGGING.md`](./docs/SHEETS_LOGGING.md)** を参照。

## ロードマップ

- **Phase 2**: 会話ログ保存（スプレッドシート版・実装済み）→ カテゴリ分類・日次AIレポート（Prisma + PostgreSQL + Vercel Cron）
- **Phase 3**: LINEチャネル対応・職員通知
