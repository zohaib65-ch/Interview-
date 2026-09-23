"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { ArrowLeft, ArrowUp, Bot, Check, Copy, RotateCcw, Sparkles, Square, User } from "lucide-react";

import { Button } from "@/components/ui/button";

type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
};

const STORAGE_KEY = "prepforge-ai-chat";

const SUGGESTED_PROMPTS = [
  "Explain the JavaScript event loop the way I should answer it in an interview.",
  "Start a mock React interview and ask me one question at a time.",
  "What is the difference between RAG and fine-tuning an LLM?",
  "How would you design a URL shortener? Walk me through it.",
];

function createId() {
  return typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

export function AiChatClient() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [hasLoaded, setHasLoaded] = useState(false);

  const abortRef = useRef<AbortController | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) setMessages(JSON.parse(saved) as ChatMessage[]);
    } catch {
      // Storage unavailable; start with an empty chat.
    }
    setHasLoaded(true);
  }, []);

  useEffect(() => {
    if (!hasLoaded || isStreaming) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(messages));
    } catch {
      // Storage unavailable; chat simply won't persist.
    }
  }, [messages, hasLoaded, isStreaming]);

  useEffect(() => {
    const container = scrollRef.current;
    if (container) container.scrollTop = container.scrollHeight;
  }, [messages]);

  useEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    textarea.style.height = "auto";
    textarea.style.height = `${Math.min(textarea.scrollHeight, 200)}px`;
  }, [input]);

  useEffect(() => () => abortRef.current?.abort(), []);

  async function sendMessage(history: ChatMessage[]) {
    const assistantId = createId();
    setMessages([...history, { id: assistantId, role: "assistant", content: "" }]);
    setIsStreaming(true);
    setError(null);

    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const response = await fetch("/api/ai-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: history.map(({ role, content }) => ({ role, content })),
        }),
        signal: controller.signal,
      });

      if (!response.ok || !response.body) {
        const payload = (await response.json().catch(() => ({}))) as { error?: string };
        throw new Error(payload.error ?? "Could not get a response from the AI.");
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const text = decoder.decode(value, { stream: true });
        setMessages((prev) =>
          prev.map((message) =>
            message.id === assistantId ? { ...message, content: message.content + text } : message,
          ),
        );
      }
    } catch (sendError) {
      if (!(sendError instanceof DOMException && sendError.name === "AbortError")) {
        setError(sendError instanceof Error ? sendError.message : "Could not get a response from the AI.");
      }
    } finally {
      // Drop the assistant placeholder if nothing was streamed back.
      setMessages((prev) =>
        prev.filter((message) => message.id !== assistantId || message.content.trim().length > 0),
      );
      setIsStreaming(false);
      abortRef.current = null;
    }
  }

  function handleSubmit(content = input) {
    const trimmed = content.trim();
    if (!trimmed || isStreaming) return;

    setInput("");
    void sendMessage([...messages, { id: createId(), role: "user", content: trimmed }]);
  }

  function handleRetry() {
    const lastUserIndex = messages.findLastIndex((message) => message.role === "user");
    if (lastUserIndex === -1 || isStreaming) return;
    void sendMessage(messages.slice(0, lastUserIndex + 1));
  }

  function handleNewChat() {
    abortRef.current?.abort();
    setMessages([]);
    setError(null);
    setInput("");
    textareaRef.current?.focus();
  }

  async function handleCopy(message: ChatMessage) {
    try {
      await navigator.clipboard.writeText(message.content);
      setCopiedId(message.id);
      setTimeout(() => setCopiedId((current) => (current === message.id ? null : current)), 1500);
    } catch {
      // Clipboard unavailable.
    }
  }

  const lastMessage = messages[messages.length - 1];
  const isWaitingForFirstToken = isStreaming && lastMessage?.role === "assistant" && !lastMessage.content;

  return (
    <main className="mx-auto flex h-[calc(100dvh-4rem)] w-full max-w-7xl flex-col px-4 py-4 sm:px-8 sm:py-6">
      <section className="shrink-0 rounded-2xl border border-zinc-800 bg-zinc-950/80 p-4 backdrop-blur sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-zinc-700 bg-zinc-900">
              <Bot className="h-5 w-5 text-zinc-300" />
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">AI Coach</p>
              <h1 className="text-xl font-semibold tracking-tight text-zinc-50 sm:text-2xl">AI Interview Chat</h1>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Link href="/" className="inline-flex">
              <Button variant="outline" size="sm">
                <ArrowLeft className="mr-1.5 h-4 w-4" />
                Home
              </Button>
            </Link>
            <Link href="/ai-questions" className="inline-flex">
              <Button variant="outline" size="sm">
                <Sparkles className="mr-1.5 h-4 w-4" />
                AI Questions
              </Button>
            </Link>
            <Button variant="primary" size="sm" onClick={handleNewChat} disabled={messages.length === 0 && !isStreaming}>
              <RotateCcw className="mr-1.5 h-4 w-4" />
              New Chat
            </Button>
          </div>
        </div>
      </section>

      <section className="mt-4 flex min-h-0 flex-1 flex-col overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-950/70 backdrop-blur">
        <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-5 sm:px-6">
          {messages.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-zinc-700 bg-zinc-900">
                <Sparkles className="h-5 w-5 text-zinc-300" />
              </div>
              <h2 className="mt-4 text-lg font-semibold text-zinc-50 sm:text-xl">Ask anything about your interview</h2>
              <p className="mt-2 max-w-md text-sm text-zinc-400">
                Concepts, coding, system design, scenarios, or a full mock interview with feedback.
              </p>
              <div className="mt-6 grid w-full max-w-2xl gap-2 sm:grid-cols-2">
                {SUGGESTED_PROMPTS.map((prompt) => (
                  <button
                    key={prompt}
                    type="button"
                    onClick={() => handleSubmit(prompt)}
                    className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-3 text-left text-sm text-zinc-300 transition hover:border-zinc-700 hover:bg-zinc-900 hover:text-zinc-100"
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {messages.map((message) =>
                message.role === "user" ? (
                  <div key={message.id} className="flex justify-end gap-3">
                    <div className="max-w-[85%] rounded-2xl rounded-tr-sm bg-zinc-100 px-4 py-2.5 text-sm leading-relaxed whitespace-pre-wrap text-zinc-900">
                      {message.content}
                    </div>
                    <div className="hidden h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-zinc-700 bg-zinc-900 sm:flex">
                      <User className="h-4 w-4 text-zinc-300" />
                    </div>
                  </div>
                ) : (
                  <div key={message.id} className="group flex gap-3">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-zinc-700 bg-zinc-900">
                      <Bot className="h-4 w-4 text-zinc-300" />
                    </div>
                    <div className="min-w-0 flex-1">
                      {message.content ? (
                        <article className="prose-qa prose-chat max-w-none text-sm text-zinc-200">
                          <ReactMarkdown
                            remarkPlugins={[remarkGfm]}
                            components={{
                              a: ({ href, children }) => (
                                <a href={href} target="_blank" rel="noopener noreferrer">
                                  {children}
                                </a>
                              ),
                            }}
                          >
                            {message.content}
                          </ReactMarkdown>
                        </article>
                      ) : null}
                      {message.content && !(isStreaming && message.id === lastMessage?.id) ? (
                        <button
                          type="button"
                          onClick={() => handleCopy(message)}
                          className="mt-1 inline-flex items-center gap-1 rounded-md px-1.5 py-1 text-xs text-zinc-500 transition hover:bg-zinc-900 hover:text-zinc-300"
                        >
                          {copiedId === message.id ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                          {copiedId === message.id ? "Copied" : "Copy"}
                        </button>
                      ) : null}
                    </div>
                  </div>
                ),
              )}

              {isWaitingForFirstToken ? (
                <div className="flex items-center gap-1.5 pl-11">
                  <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-zinc-400 [animation-delay:-0.3s]" />
                  <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-zinc-400 [animation-delay:-0.15s]" />
                  <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-zinc-400" />
                </div>
              ) : null}

              {error ? (
                <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-red-800 bg-red-950/30 p-3 text-sm text-red-300">
                  <span>{error}</span>
                  <Button variant="outline" size="sm" onClick={handleRetry}>
                    <RotateCcw className="mr-1.5 h-4 w-4" />
                    Retry
                  </Button>
                </div>
              ) : null}
            </div>
          )}
        </div>

        <form
          onSubmit={(event) => {
            event.preventDefault();
            handleSubmit();
          }}
          className="shrink-0 border-t border-zinc-800 p-3 sm:p-4"
        >
          <div className="flex items-end gap-2 rounded-xl border border-zinc-700 bg-zinc-900/70 p-2 focus-within:border-zinc-500">
            <textarea
              ref={textareaRef}
              value={input}
              onChange={(event) => setInput(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter" && !event.shiftKey && !event.nativeEvent.isComposing) {
                  event.preventDefault();
                  handleSubmit();
                }
              }}
              rows={1}
              placeholder="Ask an interview question..."
              className="max-h-[200px] min-h-10 flex-1 resize-none bg-transparent px-2 py-2 text-sm text-zinc-100 outline-none placeholder:text-zinc-500"
            />
            {isStreaming ? (
              <Button type="button" variant="outline" size="icon" onClick={() => abortRef.current?.abort()} aria-label="Stop generating">
                <Square className="h-4 w-4" />
              </Button>
            ) : (
              <Button type="submit" variant="primary" size="icon" disabled={!input.trim()} aria-label="Send message">
                <ArrowUp className="h-4 w-4" />
              </Button>
            )}
          </div>
          <p className="mt-2 hidden text-center text-[11px] text-zinc-500 sm:block">
            Enter to send, Shift + Enter for a new line. AI answers can be wrong, so verify important details.
          </p>
        </form>
      </section>
    </main>
  );
}
