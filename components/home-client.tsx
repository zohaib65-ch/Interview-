"use client";

import Link from "next/link";
import { useState } from "react";
import { ArrowRight, Bot, CircleCheckBig, Database, Monitor, Plus, Server } from "lucide-react";

import { AiQuestionFormModal } from "@/components/ai-question-form-modal";
import { BackendQuestionFormModal } from "@/components/backend-question-form-modal";
import { FrontendQuestionFormModal } from "@/components/frontend-question-form-modal";
import { SystemDesignQuestionFormModal } from "@/components/system-design-question-form-modal";
import { Button } from "@/components/ui/button";
import type { AiQuestionItem } from "@/types/ai-question";
import type { BackendQuestionItem } from "@/types/backend-question";
import type { FrontendQuestionItem } from "@/types/frontend-question";
import type { SystemDesignQuestionItem } from "@/types/system-design-question";

export function HomeClient() {
  const [isAiModalOpen, setIsAiModalOpen] = useState(false);
  const [isFrontendModalOpen, setIsFrontendModalOpen] = useState(false);
  const [isBackendModalOpen, setIsBackendModalOpen] = useState(false);
  const [isSystemDesignModalOpen, setIsSystemDesignModalOpen] = useState(false);

  const [lastSaved, setLastSaved] = useState<{
    type: "ai" | "frontend" | "backend" | "systemdesign";
    title: string;
  } | null>(null);

  return (
    <main className="relative mx-auto flex w-full max-w-7xl flex-1 flex-col px-5 py-8 sm:px-8 sm:py-12">
      {/* Save confirmation */}
      {lastSaved ? (
        <div className="mb-8 flex items-center gap-3 rounded-lg border border-zinc-800 bg-zinc-900/90 p-4 text-zinc-200">
          <CircleCheckBig className="h-5 w-5 text-emerald-400 shrink-0" />
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-emerald-400">
              {lastSaved.type === "ai"
                ? "AI Question Saved"
                : lastSaved.type === "frontend"
                  ? "Frontend Question Saved"
                  : lastSaved.type === "backend"
                    ? "Backend Question Saved"
                    : "System Design / Database Question Saved"}
            </p>
            <p className="text-sm font-medium text-zinc-100">{lastSaved.title}</p>
          </div>
        </div>
      ) : null}

      {/* Dedicated Track Cards */}
      <section className="grid gap-6 md:grid-cols-2">
        <div className="relative flex flex-col justify-between rounded-2xl border border-zinc-800 bg-zinc-950/70 p-6 transition-all hover:border-zinc-700 sm:p-8">
          <div className="pointer-events-none absolute inset-0 rounded-2xl bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.05),transparent_50%)]" />
          <div>
            <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-zinc-700 bg-zinc-900 text-zinc-200 shadow-sm">
              <Monitor className="h-5 w-5 text-zinc-300" />
            </div>

            <p className="mt-5 text-xs font-mono uppercase tracking-[0.2em] text-zinc-400">Track 01 • Frontend</p>
            <h2 className="mt-1 text-xl sm:text-2xl font-semibold text-zinc-50">Frontend Questions</h2>
            <p className="mt-3 text-sm leading-relaxed text-zinc-400">
              HTML, CSS, JavaScript, React, browser internals, performance, and accessibility questions with detailed answers.
            </p>
          </div>

          <div className="mt-8 grid grid-cols-[repeat(auto-fit,minmax(min(100%,14rem),1fr))] gap-3">
            <Button
              variant="primary"
              onClick={() => setIsFrontendModalOpen(true)}
              className="w-full"
            >
              <Plus className="mr-1.5 h-4 w-4" />
              Add Frontend Question
            </Button>
            <Link href="/frontend-questions">
              <Button variant="outline" className="w-full">
                Open Frontend Questions
                <ArrowRight className="ml-1.5 h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
        <div className="relative flex flex-col justify-between rounded-2xl border border-zinc-800 bg-zinc-950/70 p-6 transition-all hover:border-zinc-700 sm:p-8">
          <div className="pointer-events-none absolute inset-0 rounded-2xl bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.05),transparent_50%)]" />
          <div>
            <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-zinc-700 bg-zinc-900 text-zinc-200 shadow-sm">
              <Server className="h-5 w-5 text-zinc-300" />
            </div>

            <p className="mt-5 text-xs font-mono uppercase tracking-[0.2em] text-zinc-400">Track 02 • Backend</p>
            <h2 className="mt-1 text-xl sm:text-2xl font-semibold text-zinc-50">Backend Questions</h2>
            <p className="mt-3 text-sm leading-relaxed text-zinc-400">
              APIs, databases, authentication, caching, system design, and scalability questions with detailed answers.
            </p>
          </div>

          <div className="mt-8 grid grid-cols-[repeat(auto-fit,minmax(min(100%,14rem),1fr))] gap-3">
            <Button
              variant="primary"
              onClick={() => setIsBackendModalOpen(true)}
              className="w-full"
            >
              <Plus className="mr-1.5 h-4 w-4" />
              Add Backend Question
            </Button>
            <Link href="/backend-questions">
              <Button variant="outline" className="w-full">
                Open Backend Questions
                <ArrowRight className="ml-1.5 h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
        <div className="relative flex flex-col justify-between rounded-2xl border border-zinc-800 bg-zinc-950/70 p-6 transition-all hover:border-zinc-700 sm:p-8">
          <div className="pointer-events-none absolute inset-0 rounded-2xl bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.05),transparent_50%)]" />
          <div>
            <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-zinc-700 bg-zinc-900 text-zinc-200 shadow-sm">
              <Bot className="h-5 w-5 text-zinc-300" />
            </div>

            <p className="mt-5 text-xs font-mono uppercase tracking-[0.2em] text-zinc-400">Track 03 • AI</p>
            <h2 className="mt-1 text-xl sm:text-2xl font-semibold text-zinc-50">AI Based Questions</h2>
            <p className="mt-3 text-sm leading-relaxed text-zinc-400">
              Machine learning, LLMs, prompt engineering, RAG, embeddings, and AI system design questions with detailed answers.
            </p>
          </div>

          <div className="mt-8 grid grid-cols-[repeat(auto-fit,minmax(min(100%,14rem),1fr))] gap-3">
            <Button
              variant="primary"
              onClick={() => setIsAiModalOpen(true)}
              className="w-full"
            >
              <Plus className="mr-1.5 h-4 w-4" />
              Add AI Question
            </Button>
            <Link href="/ai-questions">
              <Button variant="outline" className="w-full">
                Open AI Questions
                <ArrowRight className="ml-1.5 h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>

        {/* Track 4: System Design / Database */}
        <div className="relative flex flex-col justify-between rounded-2xl border border-zinc-800 bg-zinc-950/70 p-6 transition-all hover:border-zinc-700 sm:p-8">
          <div className="pointer-events-none absolute inset-0 rounded-2xl bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.05),transparent_50%)]" />
          <div>
            <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-zinc-700 bg-zinc-900 text-zinc-200 shadow-sm">
              <Database className="h-5 w-5 text-zinc-300" />
            </div>

            <p className="mt-5 text-xs font-mono uppercase tracking-[0.2em] text-zinc-400">Track 04 • System Design</p>
            <h2 className="mt-1 text-xl sm:text-2xl font-semibold text-zinc-50">System Design / Database</h2>
            <p className="mt-3 text-sm leading-relaxed text-zinc-400">
              Database design, SQL and NoSQL, indexing, transactions, caching, scaling, and system design questions with detailed answers.
            </p>
          </div>

          <div className="mt-8 grid grid-cols-[repeat(auto-fit,minmax(min(100%,14rem),1fr))] gap-3">
            <Button
              variant="primary"
              onClick={() => setIsSystemDesignModalOpen(true)}
              className="w-full"
            >
              <Plus className="mr-1.5 h-4 w-4" />
              Add Question
            </Button>
            <Link href="/system-design-questions">
              <Button variant="outline" className="w-full">
                Open Questions
                <ArrowRight className="ml-1.5 h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Modals */}
      <AiQuestionFormModal
        open={isAiModalOpen}
        onOpenChange={setIsAiModalOpen}
        onSuccess={(aiQuestion: AiQuestionItem) =>
          setLastSaved({
            type: "ai",
            title: aiQuestion.question,
          })
        }
      />
      <FrontendQuestionFormModal
        open={isFrontendModalOpen}
        onOpenChange={setIsFrontendModalOpen}
        onSuccess={(frontendQuestion: FrontendQuestionItem) =>
          setLastSaved({
            type: "frontend",
            title: frontendQuestion.question,
          })
        }
      />
      <BackendQuestionFormModal
        open={isBackendModalOpen}
        onOpenChange={setIsBackendModalOpen}
        onSuccess={(backendQuestion: BackendQuestionItem) =>
          setLastSaved({
            type: "backend",
            title: backendQuestion.question,
          })
        }
      />
      <SystemDesignQuestionFormModal
        open={isSystemDesignModalOpen}
        onOpenChange={setIsSystemDesignModalOpen}
        onSuccess={(systemDesignQuestion: SystemDesignQuestionItem) =>
          setLastSaved({
            type: "systemdesign",
            title: systemDesignQuestion.question,
          })
        }
      />
    </main>
  );
}
