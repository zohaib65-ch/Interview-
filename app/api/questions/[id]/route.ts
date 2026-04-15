import { NextResponse } from "next/server";
import mongoose from "mongoose";
import sanitizeHtml from "sanitize-html";

import { connectToDatabase } from "@/lib/mongoose";
import Question from "@/models/Question";

function toPlainText(html: string) {
  return html
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function sanitizeAnswer(answer: string) {
  return sanitizeHtml(answer, {
    allowedTags: ["p", "br", "strong", "em", "u", "s", "ul", "ol", "li", "blockquote", "pre", "code", "h1", "h2", "h3", "h4", "h5", "h6", "a"],
    allowedAttributes: {
      a: ["href", "target", "rel"],
    },
    allowedSchemes: ["http", "https", "mailto"],
    allowProtocolRelative: false,
  });
}

function serialize(question: { _id: { toString: () => string }; question: string; answer: string; createdAt: Date; updatedAt: Date }) {
  return {
    _id: question._id.toString(),
    question: question.question,
    answer: question.answer,
    createdAt: question.createdAt,
    updatedAt: question.updatedAt,
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
      return NextResponse.json({ error: "Question and answer are required." }, { status: 400 });
    }

    const safeAnswer = sanitizeAnswer(answer);
    if (!toPlainText(safeAnswer)) {
      return NextResponse.json({ error: "Answer cannot be empty." }, { status: 400 });
    }

    await connectToDatabase();
    const updated = await Question.findByIdAndUpdate(id, { question, answer: safeAnswer }, { new: true });

    if (!updated) {
      return NextResponse.json({ error: "Question not found." }, { status: 404 });
    }

    return NextResponse.json({ question: serialize(updated) });
  } catch (error) {
    console.error("Failed to update question", error);
    return NextResponse.json({ error: "Failed to update question." }, { status: 500 });
  }
}

export async function DELETE(_request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: "Invalid ID." }, { status: 400 });
    }

    await connectToDatabase();
    const deleted = await Question.findByIdAndDelete(id);

    if (!deleted) {
      return NextResponse.json({ error: "Question not found." }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to delete question", error);
    return NextResponse.json({ error: "Failed to delete question." }, { status: 500 });
  }
}
