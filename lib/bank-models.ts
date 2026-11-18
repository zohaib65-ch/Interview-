import type { Model, Types } from "mongoose";

import BackendQuestion from "@/models/BackendQuestion";
import FrontendQuestion from "@/models/FrontendQuestion";
import type { CategoryBankKey } from "@/types/category";

/** The fields every categorized bank's question documents share. */
export interface BankQuestionDoc {
  question: string;
  answer: string;
  category: Types.ObjectId | null;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Maps a categorized bank to its question model so category code can work on either one.
 * The Frontend and Backend schemas are identical by design, which is what makes the cast safe.
 */
export function getQuestionModel(bank: CategoryBankKey) {
  const model = bank === "frontend" ? FrontendQuestion : BackendQuestion;
  return model as unknown as Model<BankQuestionDoc>;
}
