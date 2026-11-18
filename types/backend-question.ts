export interface BackendQuestionItem {
  _id: string;
  question: string;
  answer: string;
  /** Category id, or null when the question is Uncategorized. */
  category: string | null;
  createdAt: string;
  updatedAt: string;
}
