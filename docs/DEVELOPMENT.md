# 開発環境の構築（Development）

このプロジェクトを手元で開発するための手順です。デプロイ先は Vercel なので、
**Vercel の環境変数をローカルに同期して開発する**流れを中心にまとめています。

関連: 本番デプロイは [`DEPLOY.md`](./DEPLOY.md)、会話ログ設定は [`SHEETS_LOGGING.md`](./SHEETS_LOGGING.md)。

---

## 0. 前提ツール（最初の1回）

| ツール | 推奨 | 補足 |
| --- | --- | --- |
| Node.js | **22.x（LTS）** | Vercel の既定に合わせる。`.nvmrc` / `engines` で固定済み |
| nvm | 任意（推奨） | Node のバージョン切替に便利 |
| Git | 必須 | |
| VS Code | 推奨 | 拡張「ESLint」を入れると保存時に警告が見える |
| Vercel CLI | 推奨 | `npm i -g vercel`。環境変数の同期やプレビューに使う |

### Node バージョンを揃える

```bash
nvm install   # .nvmrc を読んで 22 を入れる（初回のみ）
nvm use       # このプロジェクトで Node 22 に切替
node -v       # v22.x になっていればOK
```

> `.nvmrc` と `package.json` の `engines.node` を `22.x` に固定しています。
> Vercel もこの `engines.node` を見てビルド時の Node バージョンを揃えます。

---

## 1. 取得 & インストール

```bash
git clone <repoURL>
cd global-ai-chat
nvm use
npm install
```

---

## 2. 環境変数（`.env.local`）

Next.js は **`.env.local`** を自動で読み込みます（Git管理外・`.gitignore`済）。秘密はここに置きます。

### 方法A: Vercel から同期（推奨・手入力不要）

Vercel に設定済みの変数をそのままローカルへ取り込めます。

```bash
vercel login          # 初回のみ
vercel link           # このフォルダを Vercel プロジェクト global-ai-chat に紐づけ
vercel env pull .env.local   # Development 環境の変数を .env.local に書き出す
```

### 方法B: 手動

```bash
cp .env.example .env.local
# .env.local を開いて値を設定
```

| 変数 | 必須 | メモ |
| --- | --- | --- |
| `ANTHROPIC_API_KEY` | ✅ | **本番と別の「開発用キー」を推奨**（コスト分離・事故時に本番を止めず失効できる） |
| `ANTHROPIC_CHAT_MODEL` | 任意 | 既定値あり |
| `ANTHROPIC_CLASSIFY_MODEL` | 任意 | ログ分類用の軽量モデル。既定値あり |
| `SHEETS_WEBAPP_URL` / `SHEETS_WEBAPP_TOKEN` | 任意 | dev でログを試すなら **dev専用シート＋別トークン** を使う（本番ログを汚さない）。未設定ならログは自動オフ |

> ⚠️ `.env.local` は絶対にコミットしない（`.gitignore` 済み）。キーをチャットやスクショに貼らない。

---

## 3. 開発サーバー

```bash
npm run dev          # http://localhost:3000（ホットリロードあり）
```

Vercel CLI を使う場合（Vercel のルーティング/環境に近い形で動かす）:

```bash
vercel dev           # vercel link 済みなら環境変数も自動で読まれる
```

---

## 4. 品質ゲート（コミット/PR の前に回す）

```bash
npm run typecheck    # 型チェック（tsc --noEmit）
npm run lint         # ESLint
npm run build        # 本番ビルドが通るか
```

3つすべて緑なら基本OK。`build` まで通すと本番で初めて壊れるのを防げます。

---

## 5. ブランチ & デプロイの流れ

```
main ──┬─< feature/xxx を切る
       │      ├ 実装・コミット
       │      └ push → GitHub
       │             └ PR 作成 → Vercel が「Preview デプロイ」を自動生成（本番に出さず実機確認）
       │
       └── PR を main にマージ → Vercel が「Production デプロイ」を自動実行
```

- **作業は `main` から切ったブランチで行い、PR でマージ**するのが基本。
- ブランチを push するたびに、PR画面に **Preview URL** が付きます（レビューや動作確認に便利）。
- `main` にマージされると**本番が自動更新**されます。
- ⚠️ **環境変数を変更したら再デプロイが必要**（Deployments → Redeploy）。

---

## 6. Vercel の環境（Environment）の考え方

Vercel の変数は3つの環境に分かれています。`vercel env pull` で取れるのは Development です。

| 環境 | いつ使われる | 例 |
| --- | --- | --- |
| **Development** | `vercel dev` / ローカル（`vercel env pull`の対象） | 開発用キー、dev用ログシート |
| **Preview** | PR/ブランチの Preview デプロイ | 本番に近い検証用 |
| **Production** | `main` の本番 | 本番キー、本番ログシート |

> 開発・検証・本番でキーやログ先を分けておくと、事故やデータ混在を防げます。

---

## 7. トラブルシュート

| 症状 | 対処 |
| --- | --- |
| `node -v` が 22 でない | `nvm use`（未インストールなら `nvm install`） |
| `npm run dev` で API が 503 | `.env.local` に `ANTHROPIC_API_KEY` があるか。`vercel env pull` で同期したか |
| 変更が Vercel に出ない | push 先が `main` か（本番）。Preview と本番URLを取り違えていないか |
| `vercel env pull` で変数が空 | `vercel link` でプロジェクトを紐づけたか。Development に変数があるか |

---

## 付録: 任意の改善（今は未対応）

- **`next lint` → ESLint CLI 移行**: `next lint` は Next 16 で廃止予定。
  移行は `npx @next/codemod@canary next-lint-to-eslint-cli .` で行えますが、
  設定が変わるため別途まとめて対応するのが安全です。
- **pre-commit フック**（husky 等）で `typecheck`/`lint` を自動実行。
