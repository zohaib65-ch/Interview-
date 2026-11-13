"use client";

import { useEffect, useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RichTextEditor } from "@/components/rich-text-editor";
import type { AsadQuestionItem } from "@/types/asad-question";

type AsadQuestionFormModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: (question: AsadQuestionItem, mode: "create" | "edit") => void;
  initialQuestion?: AsadQuestionItem | null;
};

export function AsadQuestionFormModal({
  open,
  onOpenChange,
  onSuccess,
  initialQuestion,
}: AsadQuestionFormModalProps) {
  const isEditMode = useMemo(() => Boolean(initialQuestion), [initialQuestion]);
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!open) return;

    setQuestion(initialQuestion?.question ?? "");
    setAnswer(initialQuestion?.answer ?? "");
    setError(null);
  }, [initialQuestion, open]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    if (!question.trim()) {
      setError("Asad's question is required.");
      return;
    }

    if (!answer.trim()) {
      setError("Answer is required.");
      return;
    }

    setIsSubmitting(true);

    try {
      const endpoint = isEditMode
        ? `/api/asad-questions/${initialQuestion?._id}`
        : "/api/asad-questions";

      const method = isEditMode ? "PUT" : "POST";
      const response = await fetch(endpoint, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          question,
          answer,
        }),
      });

      const payload = (await response.json()) as {
        question?: AsadQuestionItem;
        error?: string;
      };

      if (!response.ok || !payload.question) {
        throw new Error(payload.error ?? "Could not save Asad's question.");
      }

      onSuccess(payload.question, isEditMode ? "edit" : "create");
      onOpenChange(false);
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Could not save Asad's question.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-auto">
        <DialogHeader>
          <DialogTitle>{isEditMode ? "Edit Asad's Question" : "Add Asad's Question"}</DialogTitle>
          <DialogDescription>
            Save Asad&apos;s interview questions with rich formatted answers for revision.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="asad-question">Question</Label>
            <Input
              id="asad-question"
              placeholder="e.g. Explain how the JavaScript event loop works."
              value={question}
              onChange={(event) => setQuestion(event.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="asad-answer">Answer</Label>
            <div id="asad-answer">
              <RichTextEditor value={answer} onChange={setAnswer} />
            </div>
          </div>

          {error ? <p className="text-sm text-red-400">{error}</p> : null}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" disabled={isSubmitting}>
              {isSubmitting ? (isEditMode ? "Updating..." : "Saving...") : isEditMode ? "Update" : "Save"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
