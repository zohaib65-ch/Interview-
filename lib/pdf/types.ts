import type { QuestionBankKey } from "@/types/search";

export type ExportScope = {
  bank: QuestionBankKey;
  /** Limit the export to one category of a categorized bank ("uncategorized" included). Omit for the whole bank. */
  categorySlug?: string;
};

export type ExportQuestion = {
  id: string;
  question: string;
  /** Sanitized answer HTML, exactly as the API returns it. */
  answer: string;
};

export type ExportSection = {
  id: string;
  /** Category heading; null when the export is a single flat list (no heading needed). */
  title: string | null;
  questions: ExportQuestion[];
};

export type ExportData = {
  bank: QuestionBankKey;
  bankLabel: string;
  title: string;
  questionCount: number;
  sections: ExportSection[];
  exportedAt: Date;
};
