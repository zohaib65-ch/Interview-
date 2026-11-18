import mongoose from "mongoose";

import Category from "@/models/Category";
import { UNCATEGORIZED_SLUG, type CategoryBankKey } from "@/types/category";

let indexesReady: Promise<unknown> | null = null;

/**
 * Creates the unique (bank, slug) index once per server process.
 * Mongoose normally does this itself, but the shared connection disables command buffering, so
 * the automatic attempt (which runs at import time, before we're connected) silently never happens.
 */
export function ensureCategoryIndexes() {
  if (!indexesReady) {
    indexesReady = Category.createIndexes().catch((error) => {
      indexesReady = null; // try again on the next request
      console.error("Failed to create category indexes", error);
    });
  }
  return indexesReady;
}

type CategoryRef = { _id: mongoose.Types.ObjectId; name: string; slug: string };

/**
 * Resolves a question list's `?category=` filter.
 * - no value            -> no filtering
 * - "uncategorized"     -> questions with no category (null also matches documents missing the field)
 * - any other slug      -> that category, or `notFound` when it doesn't exist in this bank
 */
export async function resolveCategoryFilter(bank: CategoryBankKey, slug: string | null) {
  if (!slug) {
    return { ok: true as const, filter: {}, category: null };
  }

  if (slug === UNCATEGORIZED_SLUG) {
    return { ok: true as const, filter: { category: null }, category: null };
  }

  const category = await Category.findOne({ bank, slug }).select("name slug").lean<CategoryRef>().exec();
  if (!category) {
    return { ok: false as const };
  }

  return { ok: true as const, filter: { category: category._id }, category };
}

/**
 * Validates the `category` a client sent when saving a question.
 * `undefined` means "not provided" (leave unchanged on update), `null` means Uncategorized,
 * and an id must refer to a category that exists in the same bank.
 */
export async function resolveCategoryInput(bank: CategoryBankKey, value: unknown) {
  if (value === undefined) return { ok: true as const, value: undefined };
  if (value === null || value === "") return { ok: true as const, value: null };

  if (typeof value !== "string" || !mongoose.Types.ObjectId.isValid(value)) {
    return { ok: false as const, error: "Invalid category." };
  }

  const exists = await Category.exists({ _id: value, bank });
  if (!exists) return { ok: false as const, error: "Category not found." };

  return { ok: true as const, value: new mongoose.Types.ObjectId(value) };
}

export function serializeCategoryId(category: unknown) {
  return category ? String(category) : null;
}
