/** Banks whose questions can be grouped into categories. */
export const CATEGORY_BANK_KEYS = ["frontend", "backend"] as const;

export type CategoryBankKey = (typeof CATEGORY_BANK_KEYS)[number];

/** URL segment for questions that have no category. Reserved: a real category can never use it. */
export const UNCATEGORIZED_SLUG = "uncategorized";

/**
 * Form value meaning "no category". Radix Select can't use an empty string as an item value,
 * so pickers use this sentinel and translate it to `null` when saving.
 */
export const NO_CATEGORY_VALUE = "none";

export function isCategoryBankKey(value: unknown): value is CategoryBankKey {
  return typeof value === "string" && (CATEGORY_BANK_KEYS as readonly string[]).includes(value);
}

export interface CategoryItem {
  _id: string;
  name: string;
  slug: string;
  /** Number of questions currently in this category. */
  count: number;
}

/** The category a question list is scoped to, as returned alongside a filtered question list. */
export interface CategoryRef {
  _id: string;
  name: string;
  slug: string;
}

export interface CategoriesResponse {
  categories: CategoryItem[];
  uncategorizedCount: number;
}
