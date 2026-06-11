# CLAUDE.md — 特定技能サポートアプリ（機能②：多言語Q&Aチャット）

このファイルは Claude Code が毎セッション最初に読む永続ガイドです。プロジェクトの全体背景・仕様の詳細は **docs/HANDOFF.md** を必ず参照してください。

## これは何か

特定技能・留学生として日本（佐世保エリア）で働く外国人材を支える統合サポートアプリの一機能。**機能②「24時間・多言語Q&Aチャット」** を最初に作る。AIが、版管理されたFAQ知識ベースに基づいて、利用者の言語で生活・手続きの質問に答える。会話ログを定期的にAIが解析し、職員へ状況レポートを出す。

## いま作る範囲

- **Phase 1（実装済み）**: 多言語Q&Aチャット（KBグラウンディング／同言語応答／やさしい日本語トグル／スタッフ誘導の座席）。DBは使わず /data/faq.json を直接KBソースとして利用。
- **Phase 2（後）**: 会話ログ保存／カテゴリ自動分類／日次AIレポート（運営サマリー＋要フォロー抽出）／職員向け一覧。
- **後フェーズ**: 機能①AI学習（既存eラーニングとの棲み分け方針が未確定）／メンタル深刻検知のリアルタイム自動介入／LINEチャネル配信。

## 技術スタック

既存資産（学生管理アプリの Next.js 15 / React 19 / Prisma / PostgreSQL 移行）と揃える前提：

- **Next.js (App Router) + TypeScript / React**
- **Vercel デプロイ（git push 連携）＋ Vercel Cron（日次レポートは Phase 2）**
- LLM: **Anthropic Claude API**（サーバー側のみ。キーはクライアントに出さない）
- Phase 2 で **Prisma + PostgreSQL** を追加。

> 注: 当初 GitHub Pages 公開の案があったが、静的サイトではAPIキーを秘匿できず、DB/Cronも使えないため、HANDOFF.md「未決事項#1」に従い **Next.js + Vercel** で進めることをユーザーと合意済み。GAS版プロトタイプ（参考）は使わない。

## リポジトリ構成

```
/app                  Next.js ルート
/app/page.tsx         チャットUI（クライアント）
/app/api/chat         チャット応答（Claude呼び出し・KB注入）。Phase 2でログ保存を追加
/app/api/cron/report  日次レポート生成（Phase 2・未実装）
/lib                  prompts.ts / claude.ts / chat.ts / kb.ts
/data/faq.json        FAQ知識ベース（リポジトリ内の正本。30項目）
/docs/HANDOFF.md      引き継ぎ・全仕様
```

## コマンド

- 開発: `npm run dev`
- ビルド: `npm run build`
- Lint/型: `npm run lint` / `npm run typecheck`
- デプロイ: `git push`（Vercel が自動デプロイ）

## 環境変数（.env・Vercel に設定。リポジトリにコミットしない）

- `ANTHROPIC_API_KEY` — Claude APIキー（サーバー専用）
- `ANTHROPIC_CHAT_MODEL` — （任意）チャット用モデルID。未設定時はコードの既定値。
- `ANTHROPIC_CLASSIFY_MODEL` — （任意）ログ分類用の軽量モデルID。未設定時はコードの既定値。
- `SHEETS_WEBAPP_URL` / `SHEETS_WEBAPP_TOKEN` — （任意）スプレッドシート会話ログ（GAS Web App）。両方設定でログON。手順は docs/SHEETS_LOGGING.md。
- （Phase 2のDB/レポート）`DATABASE_URL` / `CRON_SECRET` / 任意の `LINEWORKS_*`

## 守るべき原則（非交渉）

1. **KBグラウンディング**: 回答はFAQ知識ベースに基づく。KBに無い内容は断定せず「スタッフに確認を」へ誘導。地域・個人で変わる情報は「市の最新案内で確認」を添える。
2. **在留資格・ビザの法的判断はしない**: 一般的な流れ説明に留め、判断は専門窓口/スタッフへ。
3. **秘密情報をクライアントに出さない**: APIキー等は必ずサーバー側。
4. **プライバシー**: レポートは氏名でなくセッションIDで扱う（ログに氏名を保存しない）。閲覧権限を絞る。
5. **安全**: レポートは職員の気づきを助ける「補助」で診断ではない。ボットは常に緊急番号・相談窓口を案内する。
6. **多言語**: 利用者の入力言語で返す。KBの正本は日本語、出力時にLLMが言語変換。「やさしい日本語」モードあり。
7. **モバイル前提**: 主な利用者はスマホ。回答は要点を先に短く。

## FAQ知識ベース

- 正本は /data/faq.json（Google Sheets「FAQ」シートからのエクスポート）。30項目。
- フィールド: id, category(生活/手続き/学習/その他), status(確認済/ドラフト可/要確認), question, answer。
- status は内部管理用（KB文字列には出さない）。status: 要確認 の項目（ハラル/JOTの特定技能扱い/家族呼び寄せ）は内容が変わりやすい。

## プロンプト

/lib/prompts.ts に集約する。原文は docs/HANDOFF.md の「7. プロンプト」に記載。
