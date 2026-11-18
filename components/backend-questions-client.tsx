"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { ArrowLeft, Plus, Search } from "lucide-react";

import { ExportPdfButton } from "@/components/export-pdf-button";
import { BackendQuestionCard } from "@/components/backend-question-card";
import { BackendQuestionFormModal } from "@/components/backend-question-form-modal";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useFocusQuestion } from "@/hooks/use-focus-question";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { UNCATEGORIZED_SLUG, type CategoryRef } from "@/types/category";
import type { BackendQuestionItem } from "@/types/backend-question";

const BANK_HREF = "/backend-questions";

type ApiResponse = {
  questions?: BackendQuestionItem[];
  category?: CategoryRef | null;
  error?: string;
};

type BackendQuestionsClientProps = {
  /** Category slug from the URL, or "uncategorized" for questions that have none. */
  categorySlug: string;
};

export function BackendQuestionsClient({ categorySlug }: BackendQuestionsClientProps) {
  const isUncategorized = categorySlug === UNCATEGORIZED_SLUG;

  const [questions, setQuestions] = useState<BackendQuestionItem[]>([]);
  const [category, setCategory] = useState<CategoryRef | null>(null);
  const [categoryNotFound, setCategoryNotFound] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<BackendQuestionItem | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [questionToDelete, setQuestionToDelete] = useState<BackendQuestionItem | null>(null);
  useFocusQuestion(!isLoading);

  const fetchQuestions = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/backend-questions?category=${encodeURIComponent(categorySlug)}`, {
        method: "GET",
        cache: "no-store",
      });

      if (response.status === 404) {
        setCategoryNotFound(true);
        return;
      }

      const payload = (await response.json()) as ApiResponse;
      if (!response.ok || !payload.questions) {
        throw new Error(payload.error ?? "Could not load backend questions.");
      }

      setQuestions(payload.questions);
      setCategory(payload.category ?? null);
    } catch (fetchError) {
      setError(fetchError instanceof Error ? fetchError.message : "Could not load backend questions.");
    } finally {
      setIsLoading(false);
    }
  }, [categorySlug]);

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
      const response = await fetch(`/api/backend-questions/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const payload = (await response.json()) as { error?: string };
        throw new Error(payload.error ?? "Could not delete backend question.");
      }

      setQuestions((prev) => prev.filter((item) => item._id !== id));
      setQuestionToDelete(null);
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : "Could not delete backend question.");
    } finally {
      setDeletingId(null);
    }
  }

  const title = isUncategorized ? "Uncategorized" : (category?.name ?? "Loading...");
  // A question belongs on this page when its category matches the one being viewed (null = Uncategorized).
  const currentCategoryId = category?._id ?? null;

  if (categoryNotFound) {
    return (
      <main className="mx-auto flex w-full max-w-7xl flex-1 flex-col px-5 py-10 sm:px-8 sm:py-14">
        <section className="rounded-2xl border border-zinc-800 bg-zinc-950/80 p-5 backdrop-blur sm:p-8">
          <Link
            href={BANK_HREF}
            className="inline-flex items-center gap-1.5 text-xs font-medium text-zinc-400 transition-colors hover:text-zinc-100"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Back to Backend
          </Link>
          <h1 className="mt-5 text-2xl font-semibold tracking-tight text-zinc-50 sm:text-3xl">Category not found</h1>
          <p className="mt-2 text-sm text-zinc-300">
            This category may have been renamed or deleted. Pick one from the Backend page instead.
          </p>
        </section>
      </main>
    );
  }

  return (
    <main className="mx-auto flex w-full max-w-7xl flex-1 flex-col px-5 py-10 sm:px-8 sm:py-14">
      <section className="rounded-2xl border border-zinc-800 bg-zinc-950/80 p-5 backdrop-blur sm:p-8">
        <Link
          href={BANK_HREF}
          className="inline-flex items-center gap-1.5 text-xs font-medium text-zinc-400 transition-colors hover:text-zinc-100"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to Backend
        </Link>

        <div className="mt-5 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">Backend Bank</p>
            <h1 className="mt-1 text-2xl font-semibold tracking-tight text-zinc-50 sm:text-3xl">{title}</h1>
            <p className="mt-2 text-sm text-zinc-300">
              {isUncategorized
                ? "Questions without a category. Edit a question to move it into one."
                : "Latest questions appear first for faster revision."}
            </p>
          </div>

          <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
            <ExportPdfButton bank="backend" categorySlug={categorySlug} disabled={isLoading || questions.length === 0} />
            <Button
              variant="primary"
              className="w-full sm:w-auto"
              onClick={() => {
                setEditingQuestion(null);
                setIsModalOpen(true);
              }}
            >
              <Plus className="mr-2 h-4 w-4" />
              Add Question
            </Button>
          </div>
        </div>

        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-zinc-500" />
            <Input
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="Search backend questions..."
              className="pl-9"
            />
          </div>
          <Badge variant="outline" className="border-zinc-800 bg-zinc-900/90 px-3 py-1.5 font-normal text-zinc-400" aria-live="polite">
            {isLoading
              ? "Loading..."
              : searchQuery.trim()
                ? `${filteredQuestions.length} of ${questions.length} shown`
                : `${questions.length} ${questions.length === 1 ? "question" : "questions"}`}
          </Badge>
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
                ? `No questions in ${title} yet. Click 'Add Question' to create your first one.`
                : "No question matches your search."}
            </p>
          </div>
        ) : (
          filteredQuestions.map((item, index) => (
            <div
              key={item._id}
              id={`q-${item._id}`}
              className="scroll-mt-24 rounded-xl transition-shadow duration-500 data-[highlighted=true]:ring-2 data-[highlighted=true]:ring-zinc-300/70 data-[highlighted=true]:ring-offset-2 data-[highlighted=true]:ring-offset-zinc-950"
            >
              <BackendQuestionCard
                question={item}
                index={index + 1}
                onEdit={(question) => {
                  setEditingQuestion(question);
                  setIsModalOpen(true);
                }}
                onDelete={handleRequestDelete}
                isDeleting={deletingId === item._id}
              />
            </div>
          ))
        )}
      </section>

      <BackendQuestionFormModal
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
        initialQuestion={editingQuestion}
        defaultCategoryId={currentCategoryId}
        onSuccess={(savedQuestion, mode) => {
          const belongsHere = savedQuestion.category === currentCategoryId;

          if (mode === "create") {
            // Saved into a different category via the dropdown: it lives there now, not in this list.
            if (belongsHere) setQuestions((prev) => [savedQuestion, ...prev]);
            return;
          }

          setQuestions((prev) =>
            belongsHere
              ? prev.map((item) => (item._id === savedQuestion._id ? savedQuestion : item))
              : prev.filter((item) => item._id !== savedQuestion._id),
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
            <DialogTitle>Delete Backend Question</DialogTitle>
            <DialogDescription>
              This action cannot be undone. This will permanently delete this backend question and its answer.
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
