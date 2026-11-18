import { NextResponse } from "next/server";
import sanitizeHtml from "sanitize-html";

import { resolveCategoryFilter, resolveCategoryInput, serializeCategoryId } from "@/lib/categories";
import { connectToDatabase } from "@/lib/mongoose";
import { normalizeAnswerHtml } from "@/lib/normalize-answer";
import FrontendQuestion from "@/models/FrontendQuestion";

const BANK = "frontend";

function toPlainText(html: string) {
  return html
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function sanitizeAnswer(answer: string) {
  const cleanedAnswer = normalizeAnswerHtml(answer);

  return sanitizeHtml(cleanedAnswer, {
    allowedTags: ["p", "br", "strong", "em", "u", "s", "ul", "ol", "li", "blockquote", "pre", "code", "h1", "h2", "h3", "h4", "h5", "h6", "a"],
    allowedAttributes: {
      a: ["href", "target", "rel"],
    },
    allowedSchemes: ["http", "https", "mailto"],
    allowProtocolRelative: false,
  });
}

function serialize(item: { _id: { toString: () => string }; question: string; answer: string; category?: unknown; createdAt: Date; updatedAt: Date }) {
  return {
    _id: item._id.toString(),
    question: item.question,
    answer: normalizeAnswerHtml(item.answer),
    category: serializeCategoryId(item.category),
    createdAt: item.createdAt,
    updatedAt: item.updatedAt,
  };
}

// `?category=<slug>` limits the list to one category, `?category=uncategorized` to questions without one.
// With no param every question is returned.
export async function GET(request: Request) {
  try {
    await connectToDatabase();

    const scope = await resolveCategoryFilter(BANK, new URL(request.url).searchParams.get("category"));
    if (!scope.ok) {
      return NextResponse.json({ error: "Category not found." }, { status: 404 });
    }

    const questions = await FrontendQuestion.find(scope.filter).sort({ createdAt: -1 }).lean();

    return NextResponse.json({
      questions: questions.map((item) => serialize(item)),
      category: scope.category
        ? { _id: String(scope.category._id), name: scope.category.name, slug: scope.category.slug }
        : null,
    });
  } catch (error) {
    console.error("Failed to fetch frontend questions", error);
    return NextResponse.json({ error: "Failed to fetch frontend questions." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      question?: string;
      answer?: string;
      category?: unknown;
    };

    const question = body.question?.trim();
    const answer = body.answer?.trim();

    if (!question || !answer) {
      return NextResponse.json({ error: "Frontend question and answer are required." }, { status: 400 });
    }

    const safeAnswer = sanitizeAnswer(answer);
    if (!toPlainText(safeAnswer)) {
      return NextResponse.json({ error: "Answer cannot be empty." }, { status: 400 });
    }

    await connectToDatabase();

    const category = await resolveCategoryInput(BANK, body.category);
    if (!category.ok) {
      return NextResponse.json({ error: category.error }, { status: 400 });
    }

    const created = await FrontendQuestion.create({
      question,
      answer: safeAnswer,
      category: category.value ?? null,
    });

    return NextResponse.json({ question: serialize(created) }, { status: 201 });
  } catch (error) {
    console.error("Failed to add frontend question", error);
    return NextResponse.json({ error: "Failed to add frontend question." }, { status: 500 });
  }
}
