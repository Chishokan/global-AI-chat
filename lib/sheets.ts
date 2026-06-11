/**
 * sheets.ts — Google スプレッドシートへの会話ログ保存（GAS Web App 経由）。
 *
 * スプレッドシートに紐づけた Apps Script（Web App）の /exec URL に POST する。
 * 認証は共有シークレットトークン（SHEETS_WEBAPP_TOKEN）1つ。
 * URL/トークンが未設定なら何もしない（ログ機能オフ）＝チャットは通常どおり動く。
 *
 * プライバシー: 氏名等の直接識別子は保存しない。利用者はセッションIDで扱う。
 */

export interface ConversationLog {
  /** 匿名セッションID（氏名は含めない）。 */
  sessionId: string;
  /** 検出言語コード（ja, en, vi ...）。不明なら ''。 */
  locale: string;
  /** やさしい日本語トグルの状態。 */
  easyJp: boolean;
  /** 自動分類カテゴリ（生活/手続き/学習/その他）。不明なら ''。 */
  category: string;
  /** 利用者の質問（最新のユーザー発話）。 */
  question: string;
  /** ボットの回答。 */
  answer: string;
}

/** ログ機能が設定済みか（URL とトークンが両方ある）。 */
export function isSheetsLoggingEnabled(): boolean {
  return Boolean(process.env.SHEETS_WEBAPP_URL && process.env.SHEETS_WEBAPP_TOKEN);
}

/**
 * 1往復ぶんの会話ログを1行としてスプレッドシートへ追記する。
 * 設定が無ければ黙ってスキップ。失敗時は例外を投げる（呼び出し側で握りつぶす想定）。
 */
export async function logConversation(log: ConversationLog): Promise<void> {
  const url = process.env.SHEETS_WEBAPP_URL;
  const token = process.env.SHEETS_WEBAPP_TOKEN;
  if (!url || !token) return; // ログ機能オフ

  const payload = {
    token,
    timestamp: new Date().toISOString(),
    sessionId: log.sessionId,
    locale: log.locale,
    easyJp: log.easyJp,
    category: log.category,
    question: log.question,
    answer: log.answer,
  };

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8000);
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      signal: controller.signal,
      // GAS Web App は script.googleusercontent.com へリダイレクトするため追従する。
      redirect: 'follow',
    });
    if (!res.ok) {
      throw new Error(`Sheets Web App returned ${res.status}`);
    }
  } finally {
    clearTimeout(timeout);
  }
}
