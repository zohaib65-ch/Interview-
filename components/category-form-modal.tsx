"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MAX_CATEGORY_NAME_LENGTH } from "@/lib/slug";
import type { CategoryBankKey, CategoryItem } from "@/types/category";

type CategoryFormModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  bank: CategoryBankKey;
  bankLabel: string;
  onSuccess: (category: CategoryItem, mode: "create" | "edit") => void;
  /** When set the dialog renames this category instead of creating a new one. */
  initialCategory?: CategoryItem | null;
};

type CategoryFormProps = Omit<CategoryFormModalProps, "open">;

// The form lives inside DialogContent, which Radix unmounts while closed, so its state starts
// fresh every time the dialog opens and no reset-on-open effect is needed.
function CategoryForm({ onOpenChange, bank, bankLabel, onSuccess, initialCategory }: CategoryFormProps) {
  const isEditMode = Boolean(initialCategory);
  const [name, setName] = useState(initialCategory?.name ?? "");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    if (!name.trim()) {
      setError("Category name is required.");
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch(isEditMode ? `/api/categories/${initialCategory?._id}` : "/api/categories", {
        method: isEditMode ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bank, name }),
      });

      const payload = (await response.json()) as { category?: CategoryItem; error?: string };

      if (!response.ok || !payload.category) {
        throw new Error(payload.error ?? "Could not save category.");
      }

      onSuccess(payload.category, isEditMode ? "edit" : "create");
      onOpenChange(false);
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Could not save category.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <>
      <DialogHeader>
        <DialogTitle>{isEditMode ? "Rename Category" : "New Category"}</DialogTitle>
        <DialogDescription>
          {isEditMode
            ? "Its questions stay in the category."
            : `Group your ${bankLabel.toLowerCase()} questions, for example by framework or topic.`}
        </DialogDescription>
      </DialogHeader>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="space-y-2">
          <Label htmlFor="category-name">Name</Label>
          <Input
            id="category-name"
            autoFocus
            autoComplete="off"
            maxLength={MAX_CATEGORY_NAME_LENGTH}
            placeholder={bank === "frontend" ? "e.g. React" : "e.g. Node.js"}
            value={name}
            onChange={(event) => setName(event.target.value)}
          />
        </div>

        {error ? <p className="text-sm text-red-400">{error}</p> : null}

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" disabled={isSubmitting}>
            {isSubmitting ? (isEditMode ? "Renaming..." : "Creating...") : isEditMode ? "Rename" : "Create"}
          </Button>
        </DialogFooter>
      </form>
    </>
  );
}

export function CategoryFormModal({ open, ...formProps }: CategoryFormModalProps) {
  return (
    <Dialog open={open} onOpenChange={formProps.onOpenChange}>
      <DialogContent className="max-w-md">
        <CategoryForm {...formProps} />
      </DialogContent>
    </Dialog>
  );
}
