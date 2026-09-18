import { NextResponse } from "next/server";
import sanitizeHtml from "sanitize-html";

import { connectToDatabase } from "@/lib/mongoose";
import ScenarioQuestion from "@/models/ScenarioQuestion";

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

export async function GET() {
  try {
    await connectToDatabase();
    const questions = await ScenarioQuestion.find().sort({ createdAt: -1 }).lean();

    return NextResponse.json({
      questions: questions.map((item) => serialize(item)),
    });
  } catch (error) {
    console.error("Failed to fetch scenario questions", error);
    return NextResponse.json({ error: "Failed to fetch scenario questions." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      question?: string;
      answer?: string;
    };

    const question = body.question?.trim();
    const answer = body.answer?.trim();

    if (!question || !answer) {
      return NextResponse.json({ error: "Scenario question and answer are required." }, { status: 400 });
    }

    const safeAnswer = sanitizeAnswer(answer);
    if (!toPlainText(safeAnswer)) {
      return NextResponse.json({ error: "Answer cannot be empty." }, { status: 400 });
    }

    await connectToDatabase();
    const created = await ScenarioQuestion.create({
      question,
      answer: safeAnswer,
    });

    return NextResponse.json({ question: serialize(created) }, { status: 201 });
  } catch (error) {
    console.error("Failed to add scenario question", error);
    return NextResponse.json({ error: "Failed to add scenario question." }, { status: 500 });
  }
}
