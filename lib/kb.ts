/**
 * kb.ts — FAQ知識ベース（KB）の読み込みとKB文字列の組み立て。
 *
 * 正本は /data/faq.json（Google Sheets「FAQ」シートからのエクスポート）。
 * Phase 1 では DB を使わず、このJSONを直接KBのソースとして使う。
 * Phase 2 で Prisma 経由のDBシードへ差し替えても、本モジュールの
 * `buildKnowledgeBase()` のインターフェースは変えない想定。
 */
import faqData from '@/data/faq.json';

export type FaqCategory = '生活' | '手続き' | '学習' | 'その他';
export type FaqStatus = '確認済' | 'ドラフト可' | '要確認';

export interface Faq {
  id: string;
  category: FaqCategory;
  status: FaqStatus;
  question: string;
  answer: string;
}

interface FaqFile {
  _meta?: Record<string, unknown>;
  faqs: Faq[];
}

const data = faqData as FaqFile;

/** 全FAQを返す。 */
export function getFaqs(): Faq[] {
  return data.faqs;
}

/** カテゴリの一覧（分類用途）。 */
export const CATEGORIES: FaqCategory[] = ['生活', '手続き', '学習', 'その他'];

/**
 * システムプロンプトへ差し込むKB文字列を組み立てる。
 * 各FAQを「Q: ... / A: ...」で連結する。status は内部管理用なので出力しない。
 */
export function buildKnowledgeBase(): string {
  return getFaqs()
    .map((f) => `[${f.id} / ${f.category}]\nQ: ${f.question}\nA: ${f.answer}`)
    .join('\n\n');
}
