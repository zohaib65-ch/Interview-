import { NextResponse } from "next/server";
import mongoose from "mongoose";
import sanitizeHtml from "sanitize-html";

import { connectToDatabase } from "@/lib/mongoose";
import AiQuestion from "@/models/AiQuestion";

function toPlainText(html: string) {
  return html
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function normalizeAnswerHtml(answer: string) {
  return answer
    .replace(/\u00a0/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/\u00ad/g, "")
    .replace(/[\u200B-\u200D\uFEFF]/g, "")
    .replace(/([A-Za-z0-9])\s*<br\s*\/?>\s*([A-Za-z0-9])/g, "$1$2")
    .replace(/([A-Za-z0-9])\r?\n([A-Za-z0-9])/g, "$1$2");
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

function serialize(item: { _id: { toString: () => string }; question: string; answer: string; createdAt: Date; updatedAt: Date }) {
  return {
    _id: item._id.toString(),
    question: item.question,
    answer: normalizeAnswerHtml(item.answer),
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
    };

    const question = body.question?.trim();
    const answer = body.answer?.trim();

    if (!question || !answer) {
      return NextResponse.json({ error: "AI question and answer are required." }, { status: 400 });
    }

    const safeAnswer = sanitizeAnswer(answer);
    if (!toPlainText(safeAnswer)) {
      return NextResponse.json({ error: "Answer cannot be empty." }, { status: 400 });
    }

    await connectToDatabase();
    const updated = await AiQuestion.findByIdAndUpdate(
      id,
      { question, answer: safeAnswer },
      { new: true }
    );

    if (!updated) {
      return NextResponse.json({ error: "AI question not found." }, { status: 404 });
    }

    return NextResponse.json({ question: serialize(updated) });
  } catch (error) {
    console.error("Failed to update AI question", error);
    return NextResponse.json({ error: "Failed to update AI question." }, { status: 500 });
  }
}

export async function DELETE(_request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: "Invalid ID." }, { status: 400 });
    }

    await connectToDatabase();
    const deleted = await AiQuestion.findByIdAndDelete(id);

    if (!deleted) {
      return NextResponse.json({ error: "AI question not found." }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to delete AI question", error);
    return NextResponse.json({ error: "Failed to delete AI question." }, { status: 500 });
  }
}
