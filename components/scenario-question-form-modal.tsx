"use client";

import { useEffect, useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RichTextEditor } from "@/components/rich-text-editor";
import type { ScenarioQuestionItem } from "@/types/scenario-question";

type ScenarioQuestionFormModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: (question: ScenarioQuestionItem, mode: "create" | "edit") => void;
  initialQuestion?: ScenarioQuestionItem | null;
};

export function ScenarioQuestionFormModal({
  open,
  onOpenChange,
  onSuccess,
  initialQuestion,
}: ScenarioQuestionFormModalProps) {
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
      setError("Scenario question is required.");
      return;
    }

    if (!answer.trim()) {
      setError("Answer is required.");
      return;
    }

    setIsSubmitting(true);

    try {
      const endpoint = isEditMode
        ? `/api/scenario-questions/${initialQuestion?._id}`
        : "/api/scenario-questions";

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
        question?: ScenarioQuestionItem;
        error?: string;
      };

      if (!response.ok || !payload.question) {
        throw new Error(payload.error ?? "Could not save scenario question.");
      }

      onSuccess(payload.question, isEditMode ? "edit" : "create");
      onOpenChange(false);
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Could not save scenario question.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-auto">
        <DialogHeader>
          <DialogTitle>{isEditMode ? "Edit Scenario Question" : "Add Scenario Question"}</DialogTitle>
          <DialogDescription>
            Save scenario-based questions with rich formatted answers for revision.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="scenario-question">Question</Label>
            <Input
              id="scenario-question"
              placeholder="e.g. How do you handle a production server spike to 100% CPU?"
              value={question}
              onChange={(event) => setQuestion(event.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="scenario-answer">Answer</Label>
            <div id="scenario-answer">
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
