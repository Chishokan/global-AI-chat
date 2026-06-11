/**
 * chat.ts — チャネル非依存のチャット応答ロジック。
 *
 * Webでも後のLINE Messaging APIでも同じこの関数を呼べるように、
 * 入出力をチャネルから切り離している（HANDOFF.md「9. チャネル非依存」）。
 */
import { getAnthropic, CHAT_MODEL } from '@/lib/claude';
import { buildChatSystemPrompt } from '@/lib/prompts';
import { buildKnowledgeBase } from '@/lib/kb';

export type Role = 'user' | 'assistant';

export interface ChatMessage {
  role: Role;
  content: string;
}

export interface GenerateReplyParams {
  /** 直近の会話履歴（末尾が最新のユーザー発話）。 */
  messages: ChatMessage[];
  /** やさしい日本語トグル。 */
  easyJp: boolean;
}

export interface GenerateReplyResult {
  reply: string;
}

const MAX_HISTORY = 20; // 直近の往復のみをモデルに渡す（コンテキスト節約）。

/**
 * KBグラウンディングされたチャット応答を生成する。
 * 会話ログの保存（Phase 2）はこの関数の外側で行う想定。
 */
export async function generateReply(
  params: GenerateReplyParams
): Promise<GenerateReplyResult> {
  const { messages, easyJp } = params;

  const system = buildChatSystemPrompt({
    knowledgeBase: buildKnowledgeBase(),
    easyJp,
  });

  const trimmed = messages.slice(-MAX_HISTORY);

  const response = await getAnthropic().messages.create({
    model: CHAT_MODEL,
    max_tokens: 1024,
    system,
    messages: trimmed.map((m) => ({ role: m.role, content: m.content })),
  });

  const reply = response.content
    .map((block) => (block.type === 'text' ? block.text : ''))
    .join('')
    .trim();

  return { reply };
}
