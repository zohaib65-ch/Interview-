import { getBank } from "@/lib/question-banks";
import { UNCATEGORIZED_SLUG, type CategoriesResponse, type CategoryRef } from "@/types/category";

import type { ExportData, ExportQuestion, ExportScope, ExportSection } from "./types";

type ApiQuestion = { _id: string; question: string; answer: string; category?: string | null };
type QuestionsResponse = { questions?: ApiQuestion[]; category?: CategoryRef | null; error?: string };

async function getJson<T>(url: string): Promise<{ ok: boolean; status: number; data: T }> {
  const response = await fetch(url, { cache: "no-store" });
  const data = (await response.json().catch(() => ({}))) as T;
  return { ok: response.ok, status: response.status, data };
}

const toExportQuestion = (item: ApiQuestion): ExportQuestion => ({ id: item._id, question: item.question, answer: item.answer });

/** Fetches the questions for a scope and shapes them into the sections the PDF renders. */
export async function loadExportData(scope: ExportScope): Promise<ExportData> {
  const bank = getBank(scope.bank);
  const sections: ExportSection[] = [];
  let title = `${bank.label} Questions`;

  if (bank.categorized && scope.categorySlug) {
    // One category: a single list under the category's own name.
    const { ok, status, data } = await getJson<QuestionsResponse>(
      `${bank.apiPath}?category=${encodeURIComponent(scope.categorySlug)}`,
    );
    if (status === 404) throw new Error("This category no longer exists.");
    if (!ok || !data.questions) throw new Error(data.error ?? "Could not load the questions.");

    title = scope.categorySlug === UNCATEGORIZED_SLUG ? "Uncategorized" : (data.category?.name ?? title);
    sections.push({ id: "all", title: null, questions: data.questions.map(toExportQuestion) });
  } else if (bank.categorized) {
    // Whole bank: one section per category (A-Z, as the category grid shows them), Uncategorized last.
    const [questionsResult, categoriesResult] = await Promise.all([
      getJson<QuestionsResponse>(bank.apiPath),
      getJson<Partial<CategoriesResponse> & { error?: string }>(`/api/categories?bank=${scope.bank}`),
    ]);
    if (!questionsResult.ok || !questionsResult.data.questions) {
      throw new Error(questionsResult.data.error ?? "Could not load the questions.");
    }
    if (!categoriesResult.ok || !categoriesResult.data.categories) {
      throw new Error(categoriesResult.data.error ?? "Could not load the categories.");
    }

    const byCategory = new Map<string | null, ExportQuestion[]>();
    for (const item of questionsResult.data.questions) {
      const key = item.category ?? null;
      byCategory.set(key, [...(byCategory.get(key) ?? []), toExportQuestion(item)]);
    }

    for (const category of categoriesResult.data.categories) {
      const questions = byCategory.get(category._id);
      if (questions?.length) sections.push({ id: category.slug, title: category.name, questions });
    }
    const uncategorized = byCategory.get(null);
    if (uncategorized?.length) sections.push({ id: UNCATEGORIZED_SLUG, title: "Uncategorized", questions: uncategorized });
  } else {
    const { ok, data } = await getJson<QuestionsResponse>(bank.apiPath);
    if (!ok || !data.questions) throw new Error(data.error ?? "Could not load the questions.");
    sections.push({ id: "all", title: null, questions: data.questions.map(toExportQuestion) });
  }

  return {
    bank: scope.bank,
    bankLabel: bank.label,
    title,
    questionCount: sections.reduce((sum, section) => sum + section.questions.length, 0),
    sections,
    exportedAt: new Date(),
  };
}
