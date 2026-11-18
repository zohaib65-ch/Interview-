import { NextResponse } from "next/server";
import mongoose from "mongoose";
import sanitizeHtml from "sanitize-html";

import { resolveCategoryInput, serializeCategoryId } from "@/lib/categories";
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

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function PUT(request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: "Invalid ID." }, { status: 400 });
    }

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

    // `category` omitted = leave as is; null = move to Uncategorized; an id = move into that category.
    const category = await resolveCategoryInput(BANK, body.category);
    if (!category.ok) {
      return NextResponse.json({ error: category.error }, { status: 400 });
    }

    const updated = await FrontendQuestion.findByIdAndUpdate(
      id,
      { question, answer: safeAnswer, ...(category.value !== undefined ? { category: category.value } : {}) },
      { new: true }
    );

    if (!updated) {
      return NextResponse.json({ error: "Frontend question not found." }, { status: 404 });
    }

    return NextResponse.json({ question: serialize(updated) });
  } catch (error) {
    console.error("Failed to update frontend question", error);
    return NextResponse.json({ error: "Failed to update frontend question." }, { status: 500 });
  }
}

export async function DELETE(_request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: "Invalid ID." }, { status: 400 });
    }

    await connectToDatabase();
    const deleted = await FrontendQuestion.findByIdAndDelete(id);

    if (!deleted) {
      return NextResponse.json({ error: "Frontend question not found." }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to delete frontend question", error);
    return NextResponse.json({ error: "Failed to delete frontend question." }, { status: 500 });
  }
}
