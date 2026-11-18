import type { QuestionBankKey } from "@/types/search";

export const FONT_SANS = "Inter";
export const FONT_MONO = "JetBrains Mono";

/** Neutral palette, matching the app's zinc scale but tuned for white paper. */
export const COLORS = {
  ink: "#18181b",
  body: "#3f3f46",
  muted: "#71717a",
  faint: "#a1a1aa",
  line: "#e4e4e7",
  surface: "#fafafa",
  code: "#f4f4f5",
} as const;

export type Accent = {
  /** Fills and rules. */
  base: string;
  /** Darker shade that keeps text legible on white and on `tint`. */
  ink: string;
  /** Very light wash for badges, quotes and inline code. */
  tint: string;
};

/** One accent per bank so an export is recognisable at a glance. */
export const ACCENTS: Record<QuestionBankKey, Accent> = {
  ai: { base: "#7c3aed", ink: "#6d28d9", tint: "#f3effe" },
  frontend: { base: "#2563eb", ink: "#1d4ed8", tint: "#e9f0fe" },
  backend: { base: "#059669", ink: "#047857", tint: "#e4f6ee" },
  systemdesign: { base: "#d97706", ink: "#b45309", tint: "#fdf1de" },
};
