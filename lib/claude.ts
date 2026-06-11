/**
 * claude.ts — Anthropic Claude API クライアント（サーバー専用）。
 *
 * APIキーはサーバー側の環境変数からのみ読む。クライアントには絶対に出さない。
 * モデルIDは環境変数で上書き可能。最新のIDは Anthropic コンソールで確認すること。
 */
import Anthropic from '@anthropic-ai/sdk';

let client: Anthropic | null = null;

/** 遅延初期化したシングルトンの Anthropic クライアントを返す。 */
export function getAnthropic(): Anthropic {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error(
      'ANTHROPIC_API_KEY が設定されていません。.env または Vercel の環境変数に設定してください。'
    );
  }
  if (!client) {
    client = new Anthropic({ apiKey });
  }
  return client;
}

/** チャット応答に使うモデルID（応答性重視）。環境変数で上書き可能。 */
export const CHAT_MODEL = process.env.ANTHROPIC_CHAT_MODEL ?? 'claude-sonnet-4-6';

/** カテゴリ/言語の分類に使うモデルID（軽量・低コスト重視）。環境変数で上書き可能。 */
export const CLASSIFY_MODEL =
  process.env.ANTHROPIC_CLASSIFY_MODEL ?? 'claude-haiku-4-5-20251001';
