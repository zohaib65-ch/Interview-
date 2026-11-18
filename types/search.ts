export type QuestionBankKey = "technical" | "scenario" | "ai" | "frontend" | "backend" | "systemdesign";

export interface SearchResult {
  id: string;
  bank: QuestionBankKey;
  question: string;
  /** Short excerpt of the answer around the match. Only set when the match is not already visible in the question. */
  snippet: string | null;
  /** Only present for categorized banks (Frontend, Backend). `null` means the question is Uncategorized. */
  category?: { name: string; slug: string } | null;
}

export interface SearchResponse {
  results: SearchResult[];
  /** Total matches per bank, before the per-bank result cap is applied. */
  totals: Partial<Record<QuestionBankKey, number>>;
}
