import { Database, Monitor, Server, Sparkles, type LucideIcon } from "lucide-react";

import type { CategoryBankKey } from "@/types/category";
import type { QuestionBankKey } from "@/types/search";

export interface QuestionBank {
  key: QuestionBankKey;
  label: string;
  href: string;
  icon: LucideIcon;
  /** Questions in this bank are grouped into user-managed categories (`/<href>/<category-slug>`). */
  categorized?: boolean;
  /** One-click starting points offered while a categorized bank has no categories yet. */
  categorySuggestions?: string[];
}

/** Display order is also the order search results are grouped in. */
export const QUESTION_BANKS: QuestionBank[] = [
  { key: "ai", label: "AI", href: "/ai-questions", icon: Sparkles },
  {
    key: "frontend",
    label: "Frontend",
    href: "/frontend-questions",
    icon: Monitor,
    categorized: true,
    categorySuggestions: ["React", "Next.js", "Vue", "Angular", "JavaScript", "TypeScript", "HTML & CSS"],
  },
  {
    key: "backend",
    label: "Backend",
    href: "/backend-questions",
    icon: Server,
    categorized: true,
    categorySuggestions: ["Node.js", "Express", "SQL", "NoSQL", "System Design", "Authentication", "Caching"],
  },
  { key: "systemdesign", label: "System Design / Database", href: "/system-design-questions", icon: Database },
];

export function getBank(key: QuestionBankKey) {
  const bank = QUESTION_BANKS.find((item) => item.key === key);
  if (!bank) throw new Error(`Unknown question bank: ${key}`);
  return bank;
}

export function getCategorizedBank(key: CategoryBankKey) {
  return getBank(key);
}
