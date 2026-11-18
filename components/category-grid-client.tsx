"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { ArrowLeft, ArrowRight, Folder, Inbox, Pencil, Plus, Trash2 } from "lucide-react";

import { ExportPdfButton } from "@/components/export-pdf-button";
import { CategoryFormModal } from "@/components/category-form-modal";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { getCategorizedBank } from "@/lib/question-banks";
import { UNCATEGORIZED_SLUG, type CategoriesResponse, type CategoryBankKey, type CategoryItem } from "@/types/category";

type CategoryGridClientProps = {
  bank: CategoryBankKey;
};

function questionCount(count: number) {
  return `${count} ${count === 1 ? "question" : "questions"}`;
}

export function CategoryGridClient({ bank: bankKey }: CategoryGridClientProps) {
  const bank = getCategorizedBank(bankKey);

  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [uncategorizedCount, setUncategorizedCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<CategoryItem | null>(null);
  const [categoryToDelete, setCategoryToDelete] = useState<CategoryItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [creatingSuggestion, setCreatingSuggestion] = useState<string | null>(null);

  // `silent` refreshes the numbers after a change without swapping the grid for a spinner.
  const load = useCallback(
    async (silent = false) => {
      if (!silent) setIsLoading(true);
      setError(null);

      try {
        const response = await fetch(`/api/categories?bank=${bankKey}`, { cache: "no-store" });
        const payload = (await response.json()) as Partial<CategoriesResponse> & { error?: string };

        if (!response.ok || !payload.categories) {
          throw new Error(payload.error ?? "Could not load categories.");
        }

        setCategories(payload.categories);
        setUncategorizedCount(payload.uncategorizedCount ?? 0);
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : "Could not load categories.");
      } finally {
        setIsLoading(false);
      }
    },
    [bankKey],
  );

  useEffect(() => {
    void load();
  }, [load]);

  const totalQuestions = useMemo(
    () => categories.reduce((sum, category) => sum + category.count, uncategorizedCount),
    [categories, uncategorizedCount],
  );

  async function handleCreateSuggestion(name: string) {
    setCreatingSuggestion(name);
    setError(null);

    try {
      const response = await fetch("/api/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bank: bankKey, name }),
      });

      if (!response.ok) {
        const payload = (await response.json()) as { error?: string };
        throw new Error(payload.error ?? "Could not create category.");
      }

      await load(true);
    } catch (createError) {
      setError(createError instanceof Error ? createError.message : "Could not create category.");
    } finally {
      setCreatingSuggestion(null);
    }
  }

  async function handleConfirmDelete() {
    if (!categoryToDelete) return;

    setIsDeleting(true);

    try {
      const response = await fetch(`/api/categories/${categoryToDelete._id}`, { method: "DELETE" });

      if (!response.ok) {
        const payload = (await response.json()) as { error?: string };
        throw new Error(payload.error ?? "Could not delete category.");
      }

      setCategoryToDelete(null);
      await load(true);
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : "Could not delete category.");
      setCategoryToDelete(null);
    } finally {
      setIsDeleting(false);
    }
  }

  function openCreate() {
    setEditingCategory(null);
    setIsModalOpen(true);
  }

  const hasCategories = categories.length > 0;
  const showGrid = hasCategories || uncategorizedCount > 0;

  return (
    <main className="mx-auto flex w-full max-w-7xl flex-1 flex-col px-5 py-10 sm:px-8 sm:py-14">
      <section className="rounded-2xl border border-zinc-800 bg-zinc-950/80 p-5 backdrop-blur sm:p-8">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-xs font-medium text-zinc-400 transition-colors hover:text-zinc-100"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to home
        </Link>

        <div className="mt-5 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">{bank.label} Bank</p>
            <h1 className="mt-1 text-2xl font-semibold tracking-tight text-zinc-50 sm:text-3xl">{bank.label} Questions</h1>
            <p className="mt-2 text-sm text-zinc-300">Pick a category to see its questions.</p>
          </div>

          <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
            <ExportPdfButton bank={bank.key} disabled={isLoading || totalQuestions === 0} />
            <Button variant="primary" className="w-full sm:w-auto" onClick={openCreate}>
              <Plus className="mr-2 h-4 w-4" />
              New category
            </Button>
          </div>
        </div>

        {!isLoading && !error ? (
          <Badge variant="outline" className="mt-6 border-zinc-800 bg-zinc-900/90 px-3 py-1.5 font-normal text-zinc-400">
            {categories.length} {categories.length === 1 ? "category" : "categories"} · {questionCount(totalQuestions)}
          </Badge>
        ) : null}
      </section>

      {error ? (
        <div className="mt-6 rounded-lg border border-red-800 bg-red-950/30 p-4 text-sm text-red-300">{error}</div>
      ) : null}

      {isLoading ? (
        <div className="mt-6 flex min-h-48 items-center justify-center rounded-xl border border-zinc-800 bg-zinc-950/60">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-zinc-600 border-t-zinc-100" />
        </div>
      ) : (
        <>
          {showGrid ? (
            <section className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {categories.map((category) => (
                <div key={category._id} className="group relative">
                  <Link
                    href={`${bank.href}/${category.slug}`}
                    className="block h-full rounded-2xl outline-none focus-visible:ring-2 focus-visible:ring-zinc-500"
                  >
                    <Card className="flex h-full min-h-36 flex-col justify-between rounded-2xl transition-all group-hover:border-zinc-600 group-hover:bg-zinc-900/60">
                      <CardHeader>
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-zinc-700 bg-zinc-900">
                          <Folder className="h-5 w-5 text-zinc-300" />
                        </div>
                      </CardHeader>
                      <CardContent className="flex items-end justify-between gap-3">
                        <div className="min-w-0">
                          <CardTitle className="text-lg break-words text-zinc-50">{category.name}</CardTitle>
                          <CardDescription className="mt-1">{questionCount(category.count)}</CardDescription>
                        </div>
                        <ArrowRight className="h-4 w-4 shrink-0 text-zinc-500 transition-transform group-hover:translate-x-0.5 group-hover:text-zinc-200" />
                      </CardContent>
                    </Card>
                  </Link>

                  <div className="absolute top-3 right-3 flex gap-1 transition-opacity sm:opacity-0 sm:group-focus-within:opacity-100 sm:group-hover:opacity-100">
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      aria-label={`Rename ${category.name}`}
                      title="Rename"
                      onClick={() => {
                        setEditingCategory(category);
                        setIsModalOpen(true);
                      }}
                      className="h-7 w-7 border-zinc-800 bg-zinc-950/90 text-zinc-400 hover:text-zinc-100"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      aria-label={`Delete ${category.name}`}
                      title="Delete"
                      onClick={() => setCategoryToDelete(category)}
                      className="h-7 w-7 border-zinc-800 bg-zinc-950/90 text-zinc-400 hover:text-red-300"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              ))}

              {uncategorizedCount > 0 ? (
                <Link
                  href={`${bank.href}/${UNCATEGORIZED_SLUG}`}
                  className="group block h-full rounded-2xl outline-none focus-visible:ring-2 focus-visible:ring-zinc-500"
                >
                  <Card className="flex h-full min-h-36 flex-col justify-between rounded-2xl bg-zinc-950/40 transition-all group-hover:border-zinc-600 group-hover:bg-zinc-900/60">
                    <CardHeader>
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-zinc-800 bg-zinc-900/60">
                        <Inbox className="h-5 w-5 text-zinc-400" />
                      </div>
                    </CardHeader>
                    <CardContent className="flex items-end justify-between gap-3">
                      <div>
                        <CardTitle className="text-lg text-zinc-300">Uncategorized</CardTitle>
                        <CardDescription className="mt-1 text-zinc-500">{questionCount(uncategorizedCount)}</CardDescription>
                      </div>
                      <ArrowRight className="h-4 w-4 shrink-0 text-zinc-600 transition-transform group-hover:translate-x-0.5 group-hover:text-zinc-200" />
                    </CardContent>
                  </Card>
                </Link>
              ) : null}

              <Button
                type="button"
                variant="outline"
                onClick={openCreate}
                className="h-auto min-h-36 w-full flex-col gap-2 rounded-2xl border-dashed text-zinc-400 hover:border-zinc-500 hover:text-zinc-100"
              >
                <Plus className="h-5 w-5" />
                <span className="text-sm font-medium">New category</span>
              </Button>
            </section>
          ) : null}

          {!hasCategories ? (
            <section className="mt-6 rounded-2xl border border-zinc-800 bg-zinc-950/60 p-8 text-center">
              <p className="text-zinc-200">No {bank.label.toLowerCase()} categories yet.</p>
              <p className="mt-1 text-sm text-zinc-400">Create your first one with the button above, or start with a suggestion:</p>
              <div className="mt-5 flex flex-wrap justify-center gap-2">
                {bank.categorySuggestions?.map((suggestion) => (
                  <Button
                    key={suggestion}
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={creatingSuggestion !== null}
                    onClick={() => void handleCreateSuggestion(suggestion)}
                    className="rounded-full px-3.5 text-zinc-300 hover:text-zinc-50"
                  >
                    <Plus className="mr-1.5 h-3.5 w-3.5" />
                    {creatingSuggestion === suggestion ? "Adding..." : suggestion}
                  </Button>
                ))}
              </div>
            </section>
          ) : null}
        </>
      )}

      <CategoryFormModal
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
        bank={bankKey}
        bankLabel={bank.label}
        initialCategory={editingCategory}
        onSuccess={() => void load(true)}
      />

      <Dialog
        open={Boolean(categoryToDelete)}
        onOpenChange={(open) => {
          if (!open && !isDeleting) setCategoryToDelete(null);
        }}
      >
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Delete Category</DialogTitle>
            <DialogDescription>
              {categoryToDelete && categoryToDelete.count > 0
                ? `The category will be removed. Its ${questionCount(categoryToDelete.count)} will be kept and moved to Uncategorized.`
                : "This category is empty, so nothing else will be affected."}
            </DialogDescription>
          </DialogHeader>

          {categoryToDelete ? (
            <div className="rounded-md border border-zinc-800 bg-zinc-900/60 p-3 text-sm text-zinc-200">
              {categoryToDelete.name}
            </div>
          ) : null}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setCategoryToDelete(null)} disabled={isDeleting}>
              Cancel
            </Button>
            <Button type="button" variant="destructive" onClick={handleConfirmDelete} disabled={isDeleting}>
              {isDeleting ? "Deleting..." : "Delete category"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </main>
  );
}
