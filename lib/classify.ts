/**
 * classify.ts — 会話ログ用のカテゴリ・言語の自動付与（軽量モデル）。
 *
 * チャット応答とは別の安価なモデルで、ユーザー発話を
 * カテゴリ（生活/手続き/学習/その他）と言語コードに分類する。
 * 失敗してもチャット本体は止めない（呼び出し側で握りつぶす）。
 */
import { getAnthropic, CLASSIFY_MODEL } from '@/lib/claude';
import { CATEGORIES, type FaqCategory } from '@/lib/kb';

export interface Classification {
  /** 生活 / 手続き / 学習 / その他 */
  category: FaqCategory | '';
  /** 発話が書かれている言語の短いコード（ja, en, vi, id, zh ...）。不明なら ''。 */
  locale: string;
}

const SYSTEM = `あなたは分類器です。次のユーザー発話を分析し、JSONのみを返してください（前後に文章やコードフェンス、説明を付けない）。
出力フォーマット:
{"category":"生活|手続き|学習|その他","locale":"言語コード"}
- category は発話内容に最も近いものを1つだけ選ぶ。生活=暮らし全般、手続き=役所/在留/税/保険など、学習=日本語や試験、その他=それ以外や相談。
- locale は発話が書かれている言語のshort code（例: 日本語=ja, 英語=en, ベトナム語=vi, インドネシア語=id, 中国語=zh, ネパール語=ne, ミャンマー語=my）。判別できなければ空文字。`;

/** コードフェンスや前後の文字を除去して最初のJSONオブジェクトを取り出す。 */
function extractJson(text: string): string | null {
  const fenced = text.replace(/```(?:json)?/gi, '').trim();
  const start = fenced.indexOf('{');
  const end = fenced.lastIndexOf('}');
  if (start === -1 || end === -1 || end < start) return null;
  return fenced.slice(start, end + 1);
}

/**
 * ユーザー発話を分類する。失敗時は空の分類を返す（例外は投げない）。
 */
export async function classifyMessage(userText: string): Promise<Classification> {
  try {
    const res = await getAnthropic().messages.create({
      model: CLASSIFY_MODEL,
      max_tokens: 100,
      system: SYSTEM,
      messages: [{ role: 'user', content: userText }],
    });

    const text = res.content
      .map((b) => (b.type === 'text' ? b.text : ''))
      .join('')
      .trim();

    const json = extractJson(text);
    if (!json) return { category: '', locale: '' };

    const parsed = JSON.parse(json) as { category?: unknown; locale?: unknown };
    const category =
      typeof parsed.category === 'string' &&
      (CATEGORIES as string[]).includes(parsed.category)
        ? (parsed.category as FaqCategory)
        : '';
    const locale =
      typeof parsed.locale === 'string' ? parsed.locale.slice(0, 8) : '';

    return { category, locale };
  } catch (err) {
    console.error('[classify] failed:', err instanceof Error ? err.message : err);
    return { category: '', locale: '' };
  }
}
