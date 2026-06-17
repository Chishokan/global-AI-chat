/**
 * kb.ts — FAQ知識ベース（KB）の読み込みとKB文字列の組み立て。
 *
 * 正本は /data/faq.json（Google Sheets「FAQ」シートからのエクスポート）。
 * Phase 1/2 では DB を使わず、このJSONを直接KBのソースとして使う。
 *
 * 回答は地域別（佐世保/西海）を持つ項目と、地域共通（文字列）の項目がある。
 * 質問には多言語ラベル（questionLoc）を持つ（FAQタブ表示用）。
 */
import faqData from '@/data/faq.json';

export type FaqCategory = '生活' | '手続き' | '学習' | 'その他';
export type FaqStatus = '確認済' | 'ドラフト可' | '要確認';
export type Region = 'sasebo' | 'saikai';

/** 地域別回答（地域共通の場合は string）。 */
export type FaqAnswer = string | Record<Region, string>;

export interface Faq {
  id: string;
  category: FaqCategory;
  status: FaqStatus;
  question: string;
  /** 多言語の質問ラベル（en/vi/id/ne/my）。ja は question を使う。 */
  questionLoc?: Partial<Record<string, string>>;
  answer: FaqAnswer;
}

interface FaqFile {
  _meta?: Record<string, unknown>;
  faqs: Faq[];
}

const data = faqData as unknown as FaqFile;

/** 全FAQを返す。 */
export function getFaqs(): Faq[] {
  return data.faqs;
}

/** カテゴリの一覧（分類・表示順）。 */
export const CATEGORIES: FaqCategory[] = ['生活', '手続き', '学習', 'その他'];

/** 地域に応じた回答テキストを返す。 */
export function answerFor(faq: Faq, region: Region): string {
  return typeof faq.answer === 'string' ? faq.answer : faq.answer[region];
}

/**
 * システムプロンプトへ差し込むKB文字列を、指定地域で組み立てる。
 * 各FAQを「[id / category] Q: ... / A: ...」で連結する。status は出力しない。
 */
export function buildKnowledgeBase(region: Region): string {
  return getFaqs()
    .map((f) => `[${f.id} / ${f.category}]\nQ: ${f.question}\nA: ${answerFor(f, region)}`)
    .join('\n\n');
}
