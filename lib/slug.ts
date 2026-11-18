import { UNCATEGORIZED_SLUG } from "@/types/category";

export const MAX_CATEGORY_NAME_LENGTH = 40;

/**
 * Turns a category name into a URL segment: "Next.js" -> "next-js", "HTML & CSS" -> "html-and-css".
 * `+` and `#` are spelled out so "C", "C++" and "C#" don't all collapse into the same slug.
 */
export function slugify(name: string) {
  return name
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/\+/g, " plus ")
    .replace(/#/g, " sharp ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export type ParsedCategoryName = { name: string; slug: string } | { error: string };

/** Validates a user-supplied category name and derives its slug. */
export function parseCategoryName(raw: unknown): ParsedCategoryName {
  if (typeof raw !== "string") return { error: "Category name is required." };

  const name = raw.replace(/\s+/g, " ").trim();
  if (!name) return { error: "Category name is required." };
  if (name.length > MAX_CATEGORY_NAME_LENGTH) {
    return { error: `Category name must be ${MAX_CATEGORY_NAME_LENGTH} characters or fewer.` };
  }

  const slug = slugify(name);
  if (!slug) return { error: "Category name must contain at least one letter or number." };
  if (slug === UNCATEGORIZED_SLUG) return { error: "\"Uncategorized\" is reserved and created automatically." };

  return { name, slug };
}
