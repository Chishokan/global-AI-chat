/**
 * /api/chat — チャット応答エンドポイント（サーバー）。
 *
 * クライアントから「会話履歴 + やさしい日本語フラグ + セッションID」を受け取り、
 * KBを注入して Claude を呼び、応答を返す。
 * APIキーはサーバー側のみ（クライアントへ出さない）。
 *
 * 応答を返した後（after）に、カテゴリ・言語を自動分類して
 * スプレッドシートへ会話ログを1行追記する（ユーザーを待たせない）。
 * ログ機能が未設定なら何もしない。ログ失敗はチャットを壊さない。
 */
import { NextRequest, NextResponse, after } from 'next/server';
import { generateReply, type ChatMessage, type Role } from '@/lib/chat';
import { classifyMessage } from '@/lib/classify';
import { isSheetsLoggingEnabled, logConversation } from '@/lib/sheets';

export const runtime = 'nodejs';

interface ChatRequestBody {
  messages?: unknown;
  easyJp?: unknown;
  sessionId?: unknown;
}

function isValidMessage(value: unknown): value is ChatMessage {
  if (typeof value !== 'object' || value === null) return false;
  const m = value as Record<string, unknown>;
  const role = m.role as Role;
  return (
    (role === 'user' || role === 'assistant') &&
    typeof m.content === 'string' &&
    m.content.trim().length > 0
  );
}

export async function POST(req: NextRequest) {
  let body: ChatRequestBody;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'リクエストの形式が正しくありません。' }, { status: 400 });
  }

  const { messages, easyJp, sessionId } = body;

  if (!Array.isArray(messages) || messages.length === 0 || !messages.every(isValidMessage)) {
    return NextResponse.json(
      { error: 'messages は user/assistant のメッセージ配列で、空でない必要があります。' },
      { status: 400 }
    );
  }

  if (messages[messages.length - 1].role !== 'user') {
    return NextResponse.json(
      { error: '最後のメッセージは user の発話である必要があります。' },
      { status: 400 }
    );
  }

  try {
    const typedMessages = messages as ChatMessage[];
    const easy = easyJp === true;
    const { reply } = await generateReply({
      messages: typedMessages,
      easyJp: easy,
    });

    // 応答を返したあとに、分類＋スプレッドシートへのログ保存を非同期で行う。
    // ユーザー応答の遅延にならないよう after() を使う。
    if (isSheetsLoggingEnabled()) {
      const question = typedMessages[typedMessages.length - 1].content;
      const sid = typeof sessionId === 'string' ? sessionId : '';
      after(async () => {
        const { category, locale } = await classifyMessage(question);
        try {
          await logConversation({
            sessionId: sid,
            locale,
            easyJp: easy,
            category,
            question,
            answer: reply,
          });
        } catch (logErr) {
          console.error(
            '[/api/chat] sheets log failed:',
            logErr instanceof Error ? logErr.message : logErr
          );
        }
      });
    }

    return NextResponse.json({ reply });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'unknown error';
    // APIキー未設定などサーバー側の構成エラーはログに出すが、
    // クライアントには詳細を返しすぎない。
    console.error('[/api/chat] error:', message);
    const isConfigError = message.includes('ANTHROPIC_API_KEY');
    return NextResponse.json(
      {
        error: isConfigError
          ? 'サーバーの設定が未完了です（APIキー未設定）。管理者にご連絡ください。'
          : '応答の生成に失敗しました。しばらくしてからもう一度お試しください。',
      },
      { status: isConfigError ? 503 : 502 }
    );
  }
}
