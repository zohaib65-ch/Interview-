import { BookOpen, Layers, Monitor, Server, Sparkles, type LucideIcon } from "lucide-react";

import type { QuestionBankKey } from "@/types/search";

export interface QuestionBank {
  key: QuestionBankKey;
  label: string;
  href: string;
  icon: LucideIcon;
}

/** Display order is also the order search results are grouped in. */
export const QUESTION_BANKS: QuestionBank[] = [
  { key: "technical", label: "Technical", href: "/interview-questions", icon: BookOpen },
  { key: "scenario", label: "Scenario", href: "/scenario-questions", icon: Layers },
  { key: "ai", label: "AI", href: "/ai-questions", icon: Sparkles },
  { key: "frontend", label: "Frontend", href: "/frontend-questions", icon: Monitor },
  { key: "backend", label: "Backend", href: "/backend-questions", icon: Server },
];
