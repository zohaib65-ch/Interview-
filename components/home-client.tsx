"use client";

import Link from "next/link";
import { useState } from "react";
import { ArrowRight, CircleCheckBig, Plus } from "lucide-react";

import { QuestionFormModal } from "@/components/question-form-modal";
import { Button } from "@/components/ui/button";
import type { QuestionItem } from "@/types/question";

export function HomeClient() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [lastSavedQuestion, setLastSavedQuestion] = useState<QuestionItem | null>(null);

  return (
    <main className="relative mx-auto flex w-full max-w-6xl flex-1 flex-col px-5 py-10 sm:px-8 sm:py-14">
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.12),transparent_40%),radial-gradient(circle_at_bottom_right,rgba(255,255,255,0.08),transparent_35%)]" />

      <section className="rounded-2xl border border-zinc-800 bg-zinc-950/80 p-6 backdrop-blur sm:p-10">
        <p className="text-xs uppercase tracking-[0.2em] text-zinc-400">Personal Interview Prep</p>
        <h1 className="mt-3 max-w-3xl text-3xl font-semibold tracking-tight text-zinc-50 sm:text-5xl sm:leading-[1.15]">Zohaib Interview</h1>
        <p className="mt-4 max-w-2xl text-sm leading-7 text-zinc-300 sm:text-base">
          Save technical interview questions with detailed rich-text answers, then revise everything in a clean card-based view.
        </p>

        <div className="mt-8 flex flex-wrap gap-3">
          <Button variant="primary" onClick={() => setIsModalOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Add Question
          </Button>
          <Link href="/interview-questions" className="inline-flex">
            <Button variant="outline">
              Open Interview Questions
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
        </div>

        {lastSavedQuestion ? (
          <div className="mt-8 rounded-lg border border-zinc-800 bg-zinc-900/70 p-4 text-zinc-200">
            <p className="flex items-center gap-2 text-sm text-zinc-300">
              <CircleCheckBig className="h-4 w-4 text-zinc-100" />
              Question saved successfully.
            </p>
            <p className="mt-1 text-sm font-semibold text-zinc-100">{lastSavedQuestion.question}</p>
          </div>
        ) : null}
      </section>

      <QuestionFormModal open={isModalOpen} onOpenChange={setIsModalOpen} onSuccess={(question) => setLastSavedQuestion(question)} />
    </main>
  );
}
