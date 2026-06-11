# Vercel デプロイ手順（丁寧版）

このアプリ（Next.js 15 + Claude API）を Vercel に公開する手順です。初めての方向けに、つまずきやすい所まで書いています。

> ⚠️ **大原則**: `ANTHROPIC_API_KEY` は秘密情報です。
> - GitHub にコミットしない（`.env` は `.gitignore` 済み）。
> - チャットやメール、スクショに貼らない。
> - 入れる場所は **Vercel の Environment Variables だけ**。

---

## 0. 事前に用意するもの

| もの | 説明 |
| --- | --- |
| GitHub アカウント | このリポジトリ（`Chishokan/global-AI-chat`）が push 済みであること |
| Vercel アカウント | https://vercel.com で GitHub 連携してサインアップ（無料のHobbyでOK） |
| Anthropic APIキー | `sk-ant-...` で始まる文字列（取得済み） |

---

## 1.（推奨）まずローカルで動作確認

Vercel に上げる前に手元で1回動かすと安心です。

```bash
npm install
cp .env.example .env
# .env を開いて ANTHROPIC_API_KEY=sk-ant-... を貼り付けて保存
npm run dev
```

ブラウザで http://localhost:3000 を開き、「ゴミの出し方は？」などと質問して日本語/英語で返ってくればOK。
確認できたら `Ctrl+C` で停止します（`.env` はコミットされません）。

---

## 2. コードを main ブランチに入れる（本番ブランチの準備）

Vercel は既定で **`main` ブランチを「本番（Production）」** として公開します。
いまの実装は作業ブランチ `claude/zen-cori-1pmtl7` にあるので、本番にするには `main` に取り込みます。方法は2つ。

### 方法A: Pull Request 経由（おすすめ・レビュー履歴が残る）

1. GitHub でリポジトリを開く。
2. `claude/zen-cori-1pmtl7` → `main` への Pull Request を作成。
3. 内容を確認して **Merge**。

### 方法B: ローカルでマージ

```bash
git checkout main
git merge claude/zen-cori-1pmtl7
git push origin main
```

> 補足: 作業ブランチのままでも Vercel は **Preview（プレビュー）URL** を自動で発行します。
> 「とりあえず動かして見たい」なら main へのマージ前でも、ブランチを push した時点でプレビューが見られます。
> 一般公開する「本番URL」にするには main に入れるのが基本です。

---

## 3. Vercel にプロジェクトをインポート

1. https://vercel.com/new を開く。
2. 「Import Git Repository」で **`Chishokan/global-AI-chat`** を選び **Import**。
   - 初回はGitHub連携の許可（リポジトリへのアクセス）を求められます。許可してください。
3. 設定画面が出ます（次のステップで触ります）。

### プロジェクト設定（基本はそのままでOK）

| 項目 | 設定値 | 補足 |
| --- | --- | --- |
| Framework Preset | **Next.js** | 自動検出されます |
| Root Directory | `./`（変更不要） | リポジトリ直下に `package.json` があるため |
| Build Command | （空＝既定 `next build`） | 触らなくてOK |
| Output Directory | （空＝既定） | 触らなくてOK |
| Install Command | （空＝既定 `npm install`） | 触らなくてOK |

---

## 4. 環境変数を設定（ここが一番大事）

インポート画面の **「Environment Variables」** を開き、以下を追加します。

| Name | Value | 対象環境 |
| --- | --- | --- |
| `ANTHROPIC_API_KEY` | `sk-ant-...`（あなたのキー） | Production, Preview, Development すべてにチェック |
| `ANTHROPIC_CHAT_MODEL` | （任意）`claude-sonnet-4-6` など | 未設定なら既定値を使用 |

- 「Add」で1つずつ追加します。
- **3つの環境すべて**（Production / Preview / Development）にチェックを入れておくと、プレビューでも本番でも動きます。
- すでにプロジェクトを作成済みの場合は、
  **Project → Settings → Environment Variables** から後で追加・編集できます。

> モデルID `claude-sonnet-4-6` は本リポジトリのコード既定値です。
> 最新のモデルIDは Anthropic コンソール（https://console.anthropic.com）で確認できます。
> 変えたいときだけ `ANTHROPIC_CHAT_MODEL` を設定してください。

---

## 5. デプロイ実行

1. 設定を確認して **「Deploy」** をクリック。
2. ビルドログが流れます（`next build`）。1〜2分で完了。
3. 「Congratulations」と表示され、本番URL（例: `https://global-ai-chat.vercel.app`）が発行されます。

URLを開いて、チャットに質問を入力 → 応答が返ればデプロイ成功です。

---

## 6. 以降の更新（自動デプロイ）

一度つなげば、あとは **git push するだけ** で自動デプロイされます。

- `main` に push / マージ → **本番（Production）** が更新。
- それ以外のブランチに push → **プレビュー（Preview）URL** が自動生成。

> ⚠️ **環境変数を後から変更・追加したときは、再デプロイが必要です。**
> Vercel の **Deployments → 対象 → 「…」→ Redeploy**、
> または何か小さな変更を push してください。
> （環境変数はビルド/起動時に読まれるため、変更しただけでは反映されません。）

---

## 7. 動作チェックリスト

- [ ] 本番URLでページが開く
- [ ] 日本語で質問 → 日本語で回答が返る
- [ ] 英語で質問 → 英語で回答が返る
- [ ] 「やさしい日本語」ONで、回答がやさしくなる
- [ ] KBにない質問 → 断定せず「スタッフに確認」へ誘導される
- [ ] 「スタッフに相談する」ボタンで案内が出る

うまくいかないときは **9. トラブルシュート** を参照。

---

## 8.（任意）独自ドメイン

会社のドメインで公開したい場合：

1. **Project → Settings → Domains**。
2. 使いたいドメイン（例 `support.example.com`）を追加。
3. 表示される DNS レコード（CNAME など）を、ドメイン管理画面に設定。
4. 反映後、自動でHTTPS化されます。

---

## 9. トラブルシュート

| 症状 | 原因と対処 |
| --- | --- |
| 「サーバーの設定が未完了です（APIキー未設定）」と出る | `ANTHROPIC_API_KEY` が未設定、または設定後に再デプロイしていない。手順4と6を確認。 |
| 「応答の生成に失敗しました」と出る | APIキーが無効/失効、クレジット残高不足、レート制限など。Anthropic コンソールでキーと残高を確認。 |
| ビルドが失敗する | ローカルで `npm run build` が通るか確認。Vercel のビルドログのエラー箇所を見る。 |
| 本番に反映されない | push 先が `main` か確認。プレビューURLと本番URLを取り違えていないか確認。 |
| 環境変数を変えたのに変わらない | Redeploy が必要（手順6）。 |

---

## 10. セキュリティ・運用メモ

- APIキーが漏れたら、すぐ Anthropic コンソールで **Revoke（無効化）** して新しいキーに差し替え、Vercel の環境変数を更新 → 再デプロイ。
- 公開前に、FAQ（`data/faq.json`）の窓口電話・住所・受付時間など、変わりやすい情報を公式ページで再確認（特に status: 要確認 の項目）。
- Phase 2（会話ログ・日次レポート）を入れる際は、`DATABASE_URL` と `CRON_SECRET` を同じく Vercel の環境変数に追加します。
