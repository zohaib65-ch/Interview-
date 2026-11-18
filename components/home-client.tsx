"use client";

import Link from "next/link";
import { useState } from "react";
import { ArrowRight, BookOpen, Bot, CircleCheckBig, Layers, MessageSquare, Plus, Sparkles } from "lucide-react";

import { QuestionFormModal } from "@/components/question-form-modal";
import { AiQuestionFormModal } from "@/components/ai-question-form-modal";
import { ScenarioQuestionFormModal } from "@/components/scenario-question-form-modal";
import { Button } from "@/components/ui/button";
import type { AiQuestionItem } from "@/types/ai-question";
import type { QuestionItem } from "@/types/question";
import type { ScenarioQuestionItem } from "@/types/scenario-question";

export function HomeClient() {
  const [isQuestionModalOpen, setIsQuestionModalOpen] = useState(false);
  const [isScenarioModalOpen, setIsScenarioModalOpen] = useState(false);
  const [isAiModalOpen, setIsAiModalOpen] = useState(false);

  const [lastSaved, setLastSaved] = useState<{
    type: "technical" | "scenario" | "ai";
    title: string;
  } | null>(null);

  return (
    <main className="relative mx-auto flex w-full max-w-7xl flex-1 flex-col px-5 py-8 sm:px-8 sm:py-12">
      <div className="absolute inset-0 -z-10 " />

      {/* Hero Section */}
      <section className="rounded-2xl border border-zinc-800 bg-zinc-950/80 p-6 backdrop-blur sm:p-10">
        <div className="inline-flex items-center gap-2 rounded-full border border-zinc-800 bg-zinc-900/90 px-3 py-1 text-xs text-zinc-300">
          <Sparkles className="h-3.5 w-3.5 text-zinc-400" />
          <span>Personal Interview Prep Workspace</span>
        </div>
        <h1 className="mt-4 max-w-3xl text-3xl font-bold tracking-tight text-zinc-50 sm:text-5xl sm:leading-[1.15]">
          Master Your Next Tech Interview
        </h1>
        <p className="mt-3 max-w-3xl text-sm leading-relaxed text-zinc-300 sm:text-base">
          Dedicated question banks for technical mastery, scenario solving, and AI fundamentals, plus an AI coach to practice with.
        </p>

        {lastSaved ? (
          <div className="mt-6 flex items-center gap-3 rounded-lg border border-zinc-800 bg-zinc-900/90 p-4 text-zinc-200">
            <CircleCheckBig className="h-5 w-5 text-emerald-400 shrink-0" />
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-emerald-400">
                {lastSaved.type === "technical"
                  ? "Technical Question Saved"
                  : lastSaved.type === "scenario"
                    ? "Scenario Question Saved"
                    : "AI Question Saved"}
              </p>
              <p className="text-sm font-medium text-zinc-100">{lastSaved.title}</p>
            </div>
          </div>
        ) : null}
      </section>

      {/* Dedicated Track Cards */}
      <section className="mt-8 grid gap-6 md:grid-cols-2 ">
        {/* Track 1: Technical Questions */}
        <div className="group relative flex flex-col justify-between rounded-2xl border border-zinc-800 bg-zinc-950/70 p-6 transition-all hover:border-zinc-700 sm:p-8">
          <div className="pointer-events-none absolute inset-0 rounded-2xl bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.05),transparent_50%)]" />
          <div>
            <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-zinc-700 bg-zinc-900 text-zinc-200 shadow-sm">
              <BookOpen className="h-5 w-5 text-zinc-300" />
            </div>

            <p className="mt-5 text-xs font-mono uppercase tracking-[0.2em] text-zinc-400">Track 01</p>
            <h2 className="mt-1 text-xl sm:text-2xl font-semibold text-zinc-50">Technical Interview Questions</h2>
            <p className="mt-3 text-sm leading-relaxed text-zinc-400">
              Core concept questions, algorithms, syntax fundamentals, and standard technical Q&amp;A with rich-text formatted answers.
            </p>
          </div>

          <div className="mt-8 flex flex-wrap gap-3">
            <Button
              variant="primary"
              onClick={() => setIsQuestionModalOpen(true)}
              className="flex-1 sm:flex-initial"
            >
              <Plus className="mr-1.5 h-4 w-4" />
              Add Technical Question
            </Button>
            <Link href="/interview-questions" className="flex-1 sm:flex-initial">
              <Button variant="outline" className="w-full">
                Open Questions
                <ArrowRight className="ml-1.5 h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>

        {/* Track 2: Scenario Questions */}
        <div className="group relative flex flex-col justify-between rounded-2xl border border-zinc-800 bg-zinc-950/70 p-6 transition-all hover:border-zinc-700 sm:p-8">
          <div className="pointer-events-none absolute inset-0 rounded-2xl bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.05),transparent_50%)]" />
          <div>
            <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-zinc-700 bg-zinc-900 text-zinc-200 shadow-sm">
              <Layers className="h-5 w-5 text-zinc-300" />
            </div>

            <p className="mt-5 text-xs font-mono uppercase tracking-[0.2em] text-zinc-400">Track 02 • Scenarios</p>
            <h2 className="mt-1 text-xl sm:text-2xl font-semibold text-zinc-50">Scenario-Based Questions</h2>
            <p className="mt-3 text-sm leading-relaxed text-zinc-400">
              Real-world situational challenges, production outages, architectural trade-offs, and step-by-step resolution walkthroughs.
            </p>
          </div>

          <div className="mt-8 flex flex-wrap gap-3">
            <Button
              variant="primary"
              onClick={() => setIsScenarioModalOpen(true)}
              className="flex-1 sm:flex-initial"
            >
              <Plus className="mr-1.5 h-4 w-4" />
              Add Scenario Question
            </Button>
            <Link href="/scenario-questions" className="flex-1 sm:flex-initial">
              <Button variant="outline" className="w-full">
                Open Scenarios
                <ArrowRight className="ml-1.5 h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
        {/* Track 3: AI Based Questions */}
        <div className="group relative flex flex-col justify-between rounded-2xl border border-zinc-800 bg-zinc-950/70 p-6 transition-all hover:border-zinc-700 sm:p-8">
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

          <div className="mt-8 flex flex-wrap gap-3">
            <Button
              variant="primary"
              onClick={() => setIsAiModalOpen(true)}
              className="flex-1 sm:flex-initial"
            >
              <Plus className="mr-1.5 h-4 w-4" />
              Add AI Question
            </Button>
            <Link href="/ai-questions" className="flex-1 sm:flex-initial">
              <Button variant="outline" className="w-full">
                Open AI Questions
                <ArrowRight className="ml-1.5 h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
        {/* Track 4: AI Interview Chat */}
        <div className="group relative flex flex-col justify-between rounded-2xl border border-zinc-800 bg-zinc-950/70 p-6 transition-all hover:border-zinc-700 sm:p-8">
          <div className="pointer-events-none absolute inset-0 rounded-2xl bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.05),transparent_50%)]" />
          <div>
            <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-zinc-700 bg-zinc-900 text-zinc-200 shadow-sm">
              <MessageSquare className="h-5 w-5 text-zinc-300" />
            </div>

            <p className="mt-5 text-xs font-mono uppercase tracking-[0.2em] text-zinc-400">Track 04 • AI Coach</p>
            <h2 className="mt-1 text-xl sm:text-2xl font-semibold text-zinc-50">AI Interview Chat</h2>
            <p className="mt-3 text-sm leading-relaxed text-zinc-400">
              Ask any interview question and get instant explanations, code examples, or run a full mock interview with feedback.
            </p>
          </div>

          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/ai-chat" className="flex-1 sm:flex-initial">
              <Button variant="primary" className="w-full">
                <MessageSquare className="mr-1.5 h-4 w-4" />
                Start Chatting
                <ArrowRight className="ml-1.5 h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Modals */}
      <QuestionFormModal
        open={isQuestionModalOpen}
        onOpenChange={setIsQuestionModalOpen}
        onSuccess={(question: QuestionItem) =>
          setLastSaved({
            type: "technical",
            title: question.question,
          })
        }
      />

      <ScenarioQuestionFormModal
        open={isScenarioModalOpen}
        onOpenChange={setIsScenarioModalOpen}
        onSuccess={(scenario: ScenarioQuestionItem) =>
          setLastSaved({
            type: "scenario",
            title: scenario.question,
          })
        }
      />
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
    </main>
  );
}
