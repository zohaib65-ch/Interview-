"use client";

import { useEffect, useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RichTextEditor } from "@/components/rich-text-editor";
import type { AiQuestionItem } from "@/types/ai-question";

type AiQuestionFormModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: (question: AiQuestionItem, mode: "create" | "edit") => void;
  initialQuestion?: AiQuestionItem | null;
};

export function AiQuestionFormModal({
  open,
  onOpenChange,
  onSuccess,
  initialQuestion,
}: AiQuestionFormModalProps) {
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
      setError("AI question is required.");
      return;
    }

    if (!answer.trim()) {
      setError("Answer is required.");
      return;
    }

    setIsSubmitting(true);

    try {
      const endpoint = isEditMode
        ? `/api/ai-questions/${initialQuestion?._id}`
        : "/api/ai-questions";

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
        question?: AiQuestionItem;
        error?: string;
      };

      if (!response.ok || !payload.question) {
        throw new Error(payload.error ?? "Could not save AI question.");
      }

      onSuccess(payload.question, isEditMode ? "edit" : "create");
      onOpenChange(false);
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Could not save AI question.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-auto">
        <DialogHeader>
          <DialogTitle>{isEditMode ? "Edit AI Question" : "Add AI Question"}</DialogTitle>
          <DialogDescription>
            Save AI-based questions with rich formatted answers for revision.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="ai-question">Question</Label>
            <Input
              id="ai-question"
              placeholder="e.g. What is the difference between RAG and fine-tuning?"
              value={question}
              onChange={(event) => setQuestion(event.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="ai-answer">Answer</Label>
            <div id="ai-answer">
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
