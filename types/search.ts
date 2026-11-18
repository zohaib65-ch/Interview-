export type QuestionBankKey = "technical" | "scenario" | "ai" | "frontend" | "backend";

export interface SearchResult {
  id: string;
  bank: QuestionBankKey;
  question: string;
  /** Short excerpt of the answer around the match. Only set when the match is not already visible in the question. */
  snippet: string | null;
}

export interface SearchResponse {
  results: SearchResult[];
  /** Total matches per bank, before the per-bank result cap is applied. */
  totals: Partial<Record<QuestionBankKey, number>>;
}
