import { NextResponse } from "next/server";

import { htmlToPlainText } from "@/lib/html-text";
import { connectToDatabase } from "@/lib/mongoose";
import AiQuestion from "@/models/AiQuestion";
import BackendQuestion from "@/models/BackendQuestion";
import FrontendQuestion from "@/models/FrontendQuestion";
import Category from "@/models/Category";
import SystemDesignQuestion from "@/models/SystemDesignQuestion";
import { isCategoryBankKey } from "@/types/category";
import type { QuestionBankKey, SearchResponse, SearchResult } from "@/types/search";

export const dynamic = "force-dynamic";

const MIN_QUERY_LENGTH = 2;
const MAX_QUERY_LENGTH = 100;
const MAX_TERMS = 8;
const MAX_RESULTS_PER_BANK = 8;
const SNIPPET_RADIUS = 70;

type CategoryInfo = { name: string; slug: string };
type Row = { _id: { toString: () => string }; question: string; answer: string; category?: unknown };

// Every bank stores the same { question, answer } shape, so they are searched uniformly.
const SOURCES: { bank: QuestionBankKey; load: () => Promise<Row[]> }[] = [
  { bank: "ai", load: () => AiQuestion.find().select("question answer").lean().exec() },
  { bank: "frontend", load: () => FrontendQuestion.find().select("question answer category").lean().exec() },
  { bank: "backend", load: () => BackendQuestion.find().select("question answer category").lean().exec() },
  { bank: "systemdesign", load: () => SystemDesignQuestion.find().select("question answer").lean().exec() },
];

function buildSnippet(answerText: string, answerLower: string, anchor: string) {
  const index = answerLower.indexOf(anchor);
  if (index === -1) return null;

  const start = Math.max(0, index - SNIPPET_RADIUS);
  const end = Math.min(answerText.length, index + anchor.length + SNIPPET_RADIUS);

  return `${start > 0 ? "…" : ""}${answerText.slice(start, end).trim()}${end < answerText.length ? "…" : ""}`;
}

function matchRow(
  bank: QuestionBankKey,
  row: Row,
  terms: string[],
  phrase: string,
  categories: Map<string, CategoryInfo>,
) {
  const questionLower = row.question.toLowerCase();
  const answerText = htmlToPlainText(row.answer);
  const answerLower = answerText.toLowerCase();

  // Every word must appear somewhere in the question or the answer.
  if (!terms.every((term) => questionLower.includes(term) || answerLower.includes(term))) {
    return null;
  }

  const inQuestion = terms.every((term) => questionLower.includes(term));
  const inAnswer = terms.every((term) => answerLower.includes(term));

  // Question matches outrank answer-only matches; an exact phrase outranks scattered words.
  let score = 0;
  if (questionLower.includes(phrase)) score += 100;
  if (inQuestion) score += 50;
  if (answerLower.includes(phrase)) score += 20;
  if (inAnswer) score += 10;

  // Only show an excerpt when the match isn't already visible in the question title.
  const anchor = terms.find((term) => !questionLower.includes(term));
  const snippet = anchor ? buildSnippet(answerText, answerLower, anchor) : null;

  const result: SearchResult = { id: row._id.toString(), bank, question: row.question, snippet };
  if (isCategoryBankKey(bank)) {
    result.category = row.category ? (categories.get(String(row.category)) ?? null) : null;
  }

  return { result, score };
}

export async function GET(request: Request) {
  try {
    const raw = new URL(request.url).searchParams.get("q")?.trim().slice(0, MAX_QUERY_LENGTH) ?? "";

    if (raw.length < MIN_QUERY_LENGTH) {
      return NextResponse.json<SearchResponse>({ results: [], totals: {} });
    }

    const phrase = raw.toLowerCase();
    const terms = Array.from(new Set(phrase.split(/\s+/).filter(Boolean))).slice(0, MAX_TERMS);

    await connectToDatabase();
    const [banks, categoryDocs] = await Promise.all([
      Promise.all(SOURCES.map(async (source) => ({ bank: source.bank, rows: await source.load() }))),
      Category.find().select("name slug").lean().exec(),
    ]);
    const categories = new Map<string, CategoryInfo>(
      categoryDocs.map((category) => [String(category._id), { name: category.name, slug: category.slug }]),
    );

    const results: SearchResult[] = [];
    const totals: SearchResponse["totals"] = {};

    for (const { bank, rows } of banks) {
      const matches = rows
        .map((row) => matchRow(bank, row, terms, phrase, categories))
        .filter((match): match is NonNullable<typeof match> => match !== null)
        .sort((a, b) => b.score - a.score);

      if (matches.length > 0) {
        totals[bank] = matches.length;
        results.push(...matches.slice(0, MAX_RESULTS_PER_BANK).map((match) => match.result));
      }
    }

    return NextResponse.json<SearchResponse>({ results, totals });
  } catch (error) {
    console.error("Failed to search questions", error);
    return NextResponse.json({ error: "Failed to search questions." }, { status: 500 });
  }
}
