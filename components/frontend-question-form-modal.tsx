"use client";

import { useEffect, useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RichTextEditor } from "@/components/rich-text-editor";
import type { FrontendQuestionItem } from "@/types/frontend-question";

type FrontendQuestionFormModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: (question: FrontendQuestionItem, mode: "create" | "edit") => void;
  initialQuestion?: FrontendQuestionItem | null;
};

export function FrontendQuestionFormModal({
  open,
  onOpenChange,
  onSuccess,
  initialQuestion,
}: FrontendQuestionFormModalProps) {
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
      setError("Frontend question is required.");
      return;
    }

    if (!answer.trim()) {
      setError("Answer is required.");
      return;
    }

    setIsSubmitting(true);

    try {
      const endpoint = isEditMode
        ? `/api/frontend-questions/${initialQuestion?._id}`
        : "/api/frontend-questions";

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
        question?: FrontendQuestionItem;
        error?: string;
      };

      if (!response.ok || !payload.question) {
        throw new Error(payload.error ?? "Could not save frontend question.");
      }

      onSuccess(payload.question, isEditMode ? "edit" : "create");
      onOpenChange(false);
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Could not save frontend question.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-auto">
        <DialogHeader>
          <DialogTitle>{isEditMode ? "Edit Frontend Question" : "Add Frontend Question"}</DialogTitle>
          <DialogDescription>
            Save frontend interview questions with rich formatted answers for revision.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="frontend-question">Question</Label>
            <Input
              id="frontend-question"
              placeholder="e.g. What is the difference between useMemo and useCallback in React?"
              value={question}
              onChange={(event) => setQuestion(event.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="frontend-answer">Answer</Label>
            <div id="frontend-answer">
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
