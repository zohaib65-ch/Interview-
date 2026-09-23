"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { ArrowLeft, BookOpen, Layers, Plus, Search } from "lucide-react";

import { AiQuestionCard } from "@/components/ai-question-card";
import { AiQuestionFormModal } from "@/components/ai-question-form-modal";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import type { AiQuestionItem } from "@/types/ai-question";

type ApiResponse = {
  questions?: AiQuestionItem[];
  error?: string;
};

export function AiQuestionsClient() {
  const [questions, setQuestions] = useState<AiQuestionItem[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<AiQuestionItem | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [questionToDelete, setQuestionToDelete] = useState<AiQuestionItem | null>(null);

  const fetchQuestions = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/ai-questions", {
        method: "GET",
        cache: "no-store",
      });

      const payload = (await response.json()) as ApiResponse;
      if (!response.ok || !payload.questions) {
        throw new Error(payload.error ?? "Could not load AI questions.");
      }

      setQuestions(payload.questions);
    } catch (fetchError) {
      setError(fetchError instanceof Error ? fetchError.message : "Could not load AI questions.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchQuestions();
  }, [fetchQuestions]);

  const filteredQuestions = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return questions;

    return questions.filter((item) => item.question.toLowerCase().includes(query));
  }, [questions, searchQuery]);

  function handleRequestDelete(id: string) {
    const selectedQuestion = questions.find((item) => item._id === id) ?? null;
    setQuestionToDelete(selectedQuestion);
  }

  async function handleConfirmDelete() {
    if (!questionToDelete) return;

    const id = questionToDelete._id;
    setDeletingId(id);

    try {
      const response = await fetch(`/api/ai-questions/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const payload = (await response.json()) as { error?: string };
        throw new Error(payload.error ?? "Could not delete AI question.");
      }

      setQuestions((prev) => prev.filter((item) => item._id !== id));
      setQuestionToDelete(null);
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : "Could not delete AI question.");
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <main className="mx-auto flex w-full max-w-7xl flex-1 flex-col px-5 py-10 sm:px-8 sm:py-14">
      <section className="rounded-2xl border border-zinc-800 bg-zinc-950/80 p-5 backdrop-blur sm:p-8">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">AI Bank</p>
            <h1 className="mt-1 text-2xl font-semibold tracking-tight text-zinc-50 sm:text-3xl">
              AI Based Questions
            </h1>
            <p className="mt-2 text-sm text-zinc-300">
              Latest AI questions appear first for faster revision.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Link href="/" className="inline-flex">
              <Button variant="outline">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Home
              </Button>
            </Link>
            <Link href="/interview-questions" className="inline-flex">
              <Button variant="outline">
                <BookOpen className="mr-2 h-4 w-4" />
                Technical Questions
              </Button>
            </Link>
            <Link href="/scenario-questions" className="inline-flex">
              <Button variant="outline">
                <Layers className="mr-2 h-4 w-4" />
                Scenario Questions
              </Button>
            </Link>
            <Button
              variant="primary"
              onClick={() => {
                setEditingQuestion(null);
                setIsModalOpen(true);
              }}
            >
              <Plus className="mr-2 h-4 w-4" />
              Add AI Question
            </Button>
          </div>
        </div>

        <div className="mt-6 relative">
          <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-zinc-500" />
          <Input
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            placeholder="Search AI questions..."
            className="pl-9"
          />
        </div>
      </section>

      {error ? (
        <div className="mt-6 rounded-lg border border-red-800 bg-red-950/30 p-4 text-sm text-red-300">
          {error}
        </div>
      ) : null}

      <section className="mt-6 grid gap-4 sm:gap-5">
        {isLoading ? (
          <div className="flex min-h-48 items-center justify-center rounded-xl border border-zinc-800 bg-zinc-950/60">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-zinc-600 border-t-zinc-100" />
          </div>
        ) : filteredQuestions.length === 0 ? (
          <div className="rounded-xl border border-zinc-800 bg-zinc-950/60 p-8 text-center">
            <p className="text-zinc-300">
              {questions.length === 0
                ? "No AI questions yet. Click 'Add AI Question' to create your first one."
                : "No AI question matches your search."}
            </p>
          </div>
        ) : (
          filteredQuestions.map((item, index) => (
            <AiQuestionCard
              key={item._id}
              question={item}
              index={index + 1}
              onEdit={(question) => {
                setEditingQuestion(question);
                setIsModalOpen(true);
              }}
              onDelete={handleRequestDelete}
              isDeleting={deletingId === item._id}
            />
          ))
        )}
      </section>

      <AiQuestionFormModal
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
        initialQuestion={editingQuestion}
        onSuccess={(savedQuestion, mode) => {
          if (mode === "create") {
            setQuestions((prev) => [savedQuestion, ...prev]);
            return;
          }

          setQuestions((prev) =>
            prev.map((item) => (item._id === savedQuestion._id ? savedQuestion : item)),
          );
          setEditingQuestion(null);
        }}
      />

      <Dialog
        open={Boolean(questionToDelete)}
        onOpenChange={(open) => {
          if (!open && !deletingId) {
            setQuestionToDelete(null);
          }
        }}
      >
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Delete AI Question</DialogTitle>
            <DialogDescription>
              This action cannot be undone. This will permanently delete your AI question and resolution.
            </DialogDescription>
          </DialogHeader>

          {questionToDelete ? (
            <div className="rounded-md border border-zinc-800 bg-zinc-900/60 p-3 text-sm text-zinc-200">
              {questionToDelete.question}
            </div>
          ) : null}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setQuestionToDelete(null)}
              disabled={Boolean(deletingId)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={handleConfirmDelete}
              disabled={Boolean(deletingId)}
            >
              {deletingId ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </main>
  );
}
