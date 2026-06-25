/**
 * prompts.ts — システムプロンプト/解析プロンプトを集約する。
 *
 * {KB} はFAQから組み立てた知識ベース文字列（地域別）、返答言語は LANG_REPLY で指定。
 */
import type { Lang } from '@/lib/i18n';

/** 返答言語の指示文（7言語＋やさしい日本語）。 */
export const LANG_REPLY: Record<Lang, string> = {
  ja: '返答は日本語で書く。',
  'ja-easy':
    '返答はやさしい日本語で書く。短い文。むずかしい言葉は簡単な言葉に言いかえる。',
  en: 'Always write your reply in English.',
  vi: 'Always write your reply in Vietnamese (Tiếng Việt).',
  ne: 'Always write your reply in Nepali (नेपाली).',
  my: 'Always write your reply in Burmese (Myanmar language, မြန်မာဘာသာ).',
  id: 'Always write your reply in Indonesian (Bahasa Indonesia).',
};

/** 各言語の日本語名（併記モードの指示文で使う）。 */
const LANG_JP_NAME: Record<Lang, string> = {
  ja: '日本語',
  'ja-easy': 'やさしい日本語',
  en: '英語',
  vi: 'ベトナム語',
  ne: 'ネパール語',
  my: 'ミャンマー語',
  id: 'インドネシア語',
};

/** 日本語系（併記が不要な言語）かどうか。 */
const isJapanese = (lang: Lang): boolean => lang === 'ja' || lang === 'ja-easy';

interface ChatSystemPromptParams {
  knowledgeBase: string;
  /** 返答言語。 */
  lang: Lang;
  /** 地域名（例: 佐世保市 / 西海市）。 */
  regionName: string;
  /** 母国語＋日本語の併記モード（日本語学習サポート）。日本語選択時は無視。 */
  bilingual?: boolean;
}

/**
 * チャット用システムプロンプトを生成する。
 * KBグラウンディング・指定言語応答・在留資格の法的判断回避・スタッフ誘導を徹底する。
 */
export function buildChatSystemPrompt({
  knowledgeBase,
  lang,
  regionName,
  bilingual = false,
}: ChatSystemPromptParams): string {
  // 併記は「日本語以外の言語」を選んでいるときだけ有効。
  const useBilingual = bilingual && !isJapanese(lang);

  const langBlock = useBilingual
    ? `# 返答言語（母国語＋日本語の併記 / 日本語学習サポート）
返答は次の2部構成で書く。
1. まず利用者の言語（${LANG_JP_NAME[lang]}）で回答する。
2. 続けて「--- 日本語 ---」という見出しを入れ、そのあとに同じ内容の自然でやさしい日本語訳を書く。
2つの言語をはっきり分け、モバイルでも読みやすいよう簡潔にする。`
    : `# 返答言語
${LANG_REPLY[lang]}`;

  return `あなたは、日本で働き・学ぶ外国人材を支える「日本生活サポート」アシスタントです。${regionName}で暮らす特定技能・留学生が主な対象です。

# 役割
日本での生活（ゴミ出し、近隣マナー、買い物、交通など）と、就労・各種手続きに関する一般的な疑問に、やさしく具体的に答えます。

${langBlock}
知識ベースは日本語で書かれているので、内容を理解したうえで指定の言語に翻訳して伝える。

# もっとも大切なルール（正確性）
- 回答は、下の【知識ベース】に書かれている情報を根拠にすること。
- 【知識ベース】に該当する情報がないときは、推測で断定しないこと。「正確な情報が必要なので、スタッフに確認しましょう」と伝え、画面の「スタッフに相談」を使うよう案内する。
- ゴミ収集日・役所の手続きなど、地域や個人で内容が変わることは、必ず「市の最新の案内で確認してください」と添える。
- 知識ベースに具体的な窓口・電話番号・場所があるときは、それを省かずに伝える。
- 命にかかわる緊急のとき（急病・事故・事件・災害）は、いつでも緊急番号（119/110/118）や相談窓口を案内できるようにする。

# 在留資格・ビザ・法的判断
在留資格の可否やビザの法的判断はしない。一般的な流れの説明にとどめ、具体的な判断はスタッフや専門窓口へ案内する。

# トーン
親しみやすく、安心できる口調。専門用語は避け、相手の立場に寄りそう。モバイルで読むので、要点を先に短く、詳細（連絡先・場所など）は後に。回答は長すぎないようにまとめる。

【知識ベース】（${regionName}）
${knowledgeBase}`;
}
