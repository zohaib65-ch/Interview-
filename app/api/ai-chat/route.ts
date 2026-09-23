import { NextResponse } from "next/server";

const GEMINI_API_BASE = "https://generativelanguage.googleapis.com/v1beta/models";
const DEFAULT_MODEL = "gemini-3.5-flash-lite";
// Used when the primary model stays overloaded after retries.
const FALLBACK_MODEL = "gemini-2.5-flash-lite";
const MAX_HISTORY = 10;
const MAX_OUTPUT_TOKENS = 1024;
const MAX_MESSAGE_LENGTH = 8000;
const MAX_ATTEMPTS = 2;
const RETRYABLE_STATUSES = new Set([500, 503]);

const SYSTEM_INSTRUCTION = `You are PrepForge AI, a technical interview coach for software engineering and AI/ML interviews.
Rules:
- Keep every answer short: 2-3 lines that simply explain what the thing is. No long intros, headings, or extra sections.
- Only give examples, code, or detailed explanations when the user explicitly asks for them (e.g. "example do", "detail mein batao", "code dikhao").
- Always reply in English by default, even if the user's message contains Roman Urdu words.
- Switch to Roman Urdu (Urdu written in English letters) only when the user explicitly asks for it (e.g. "Urdu mein baat karo", "reply in Urdu"). Keep using Roman Urdu until they ask for English again. Keep technical terms in English and never use Urdu script.
- For a mock interview, ask one question at a time and give 1-2 lines of feedback on each answer.
- If a request is unrelated to interviews, careers, or technical learning, politely steer back to interview preparation in one line.`;

type ChatMessage = {
  role: "user" | "assistant";
  content: string;
};

type GeminiStreamChunk = {
  candidates?: { content?: { parts?: { text?: string; thought?: boolean }[] } }[];
  error?: { message?: string };
};

function isValidMessage(value: unknown): value is ChatMessage {
  if (!value || typeof value !== "object") return false;
  const message = value as Record<string, unknown>;

  return (
    (message.role === "user" || message.role === "assistant") &&
    typeof message.content === "string" &&
    message.content.trim().length > 0 &&
    message.content.length <= MAX_MESSAGE_LENGTH
  );
}

function friendlyGeminiError(status: number) {
  if (status === 503) return "Gemini is busy right now. Please try again in a few seconds.";
  if (status === 429) return "Gemini rate limit reached. Please wait a moment and try again.";
  if (status === 400 || status === 403) return "Gemini rejected the request. Check GEMINI_API_KEY and GEMINI_MODEL.";
  if (status === 404) return "Gemini model not found. Check GEMINI_MODEL in your environment.";
  return "Gemini is unavailable right now. Please try again.";
}

export async function POST(request: Request) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "GEMINI_API_KEY is not configured on the server." }, { status: 500 });
  }

  let messages: ChatMessage[];
  try {
    const body = (await request.json()) as { messages?: unknown };
    if (!Array.isArray(body.messages) || body.messages.length === 0 || !body.messages.every(isValidMessage)) {
      return NextResponse.json({ error: "Please send a valid message." }, { status: 400 });
    }
    messages = body.messages.slice(-MAX_HISTORY);
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  if (messages[messages.length - 1].role !== "user") {
    return NextResponse.json({ error: "The last message must be from the user." }, { status: 400 });
  }

  const model = process.env.GEMINI_MODEL?.trim() || DEFAULT_MODEL;

  const requestBody = JSON.stringify({
    systemInstruction: { parts: [{ text: SYSTEM_INSTRUCTION }] },
    contents: messages.map((message) => ({
      role: message.role === "assistant" ? "model" : "user",
      parts: [{ text: message.content }],
    })),
    generationConfig: { maxOutputTokens: MAX_OUTPUT_TOKENS },
  });

  const models = model === FALLBACK_MODEL ? [model] : [model, FALLBACK_MODEL];
  const attempts = models.flatMap((name) => Array.from({ length: MAX_ATTEMPTS }, () => name));

  let geminiResponse: Response | undefined;
  // Gemini free tier occasionally returns 503 when overloaded; retry, then fall back to another model.
  for (let attempt = 0; attempt < attempts.length; attempt++) {
    try {
      geminiResponse = await fetch(`${GEMINI_API_BASE}/${attempts[attempt]}:streamGenerateContent?alt=sse`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": apiKey,
        },
        body: requestBody,
        signal: request.signal,
      });
    } catch (error) {
      console.error("Failed to reach Gemini", error);
      return NextResponse.json({ error: "Could not reach Gemini. Please try again." }, { status: 502 });
    }

    if (!RETRYABLE_STATUSES.has(geminiResponse.status) || attempt === attempts.length - 1) break;
    console.warn(`Gemini ${attempts[attempt]} returned ${geminiResponse.status}, retrying`);
    await geminiResponse.body?.cancel();
    await new Promise((resolve) => setTimeout(resolve, 600));
  }

  if (!geminiResponse) {
    return NextResponse.json({ error: "Could not reach Gemini. Please try again." }, { status: 502 });
  }

  if (!geminiResponse.ok || !geminiResponse.body) {
    console.error("Gemini request failed", geminiResponse.status, await geminiResponse.text().catch(() => ""));
    return NextResponse.json({ error: friendlyGeminiError(geminiResponse.status) }, { status: 502 });
  }

  const reader = geminiResponse.body.getReader();
  const decoder = new TextDecoder();
  const encoder = new TextEncoder();

  // Re-stream Gemini's SSE events to the client as plain text chunks.
  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      let buffer = "";

      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split(/\r?\n/);
          buffer = lines.pop() ?? "";

          for (const line of lines) {
            if (!line.startsWith("data:")) continue;
            const data = line.slice(5).trim();
            if (!data) continue;

            const chunk = JSON.parse(data) as GeminiStreamChunk;
            if (chunk.error) {
              throw new Error(chunk.error.message ?? "Gemini stream error");
            }

            const text = chunk.candidates?.[0]?.content?.parts
              ?.filter((part) => !part.thought)
              .map((part) => part.text ?? "")
              .join("");

            if (text) controller.enqueue(encoder.encode(text));
          }
        }

        controller.close();
      } catch (error) {
        console.error("Gemini stream failed", error);
        controller.error(error);
      }
    },
    cancel() {
      void reader.cancel();
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "no-store",
    },
  });
}
