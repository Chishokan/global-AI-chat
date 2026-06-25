/**
 * /api/chat — チャット応答エンドポイント（サーバー）。
 *
 * クライアントから「会話履歴 + 地域 + 言語 + セッションID」を受け取り、
 * 地域別KBを注入して Claude を呼び、応答を返す。
 * APIキーはサーバー側のみ（クライアントへ出さない）。
 *
 * 応答を返した後（after）に、カテゴリを自動分類して
 * スプレッドシートへ会話ログを1行追記する（ユーザーを待たせない）。
 * ログ機能が未設定なら何もしない。ログ失敗はチャットを壊さない。
 */
import { NextRequest, NextResponse, after } from 'next/server';
import { generateReply, type ChatMessage, type Role } from '@/lib/chat';
import { classifyCategory } from '@/lib/classify';
import { isSheetsLoggingEnabled, logConversation } from '@/lib/sheets';
import type { Region } from '@/lib/kb';
import type { Lang } from '@/lib/i18n';

export const runtime = 'nodejs';

const VALID_REGIONS: Region[] = ['sasebo', 'saikai'];
const VALID_LANGS: Lang[] = ['ja', 'ja-easy', 'en', 'vi', 'ne', 'my', 'id'];

interface ChatRequestBody {
  messages?: unknown;
  region?: unknown;
  lang?: unknown;
  bilingual?: unknown;
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

  const { messages, region: regionRaw, lang: langRaw, bilingual: bilingualRaw, sessionId } = body;

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

  const region: Region = VALID_REGIONS.includes(regionRaw as Region)
    ? (regionRaw as Region)
    : 'sasebo';
  const lang: Lang = VALID_LANGS.includes(langRaw as Lang) ? (langRaw as Lang) : 'ja';
  const bilingual = bilingualRaw === true;

  try {
    const typedMessages = messages as ChatMessage[];
    const { reply } = await generateReply({ messages: typedMessages, region, lang, bilingual });

    // 応答を返したあとに、分類＋スプレッドシートへのログ保存を非同期で行う。
    if (isSheetsLoggingEnabled()) {
      const question = typedMessages[typedMessages.length - 1].content;
      const sid = typeof sessionId === 'string' ? sessionId : '';
      after(async () => {
        const category = await classifyCategory(question);
        try {
          await logConversation({
            sessionId: sid,
            region,
            lang,
            easyJp: lang === 'ja-easy',
            bilingual: bilingual && lang !== 'ja' && lang !== 'ja-easy',
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
