"use client";

import { Edit3, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { normalizeAnswerHtml } from "@/lib/normalize-answer";
import type { AiQuestionItem } from "@/types/ai-question";

type AiQuestionCardProps = {
  question: AiQuestionItem;
  index: number;
  onEdit: (question: AiQuestionItem) => void;
  onDelete: (id: string) => void;
  isDeleting: boolean;
};

export function AiQuestionCard({ question, index, onEdit, onDelete, isDeleting }: AiQuestionCardProps) {
  const createdDate = new Date(question.createdAt).toLocaleString(undefined, {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });

  const normalizedAnswer = normalizeAnswerHtml(question.answer);

  return (
    <Card className="group relative overflow-hidden">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.07),transparent_60%)]" />
      <CardHeader className="relative pb-0 px-5 pt-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="space-y-1">
            <CardDescription>AI Question {index}</CardDescription>
            <CardTitle className="sm:text-lg text-sm leading-7 font-extrabold!">
              <span>Q : {question.question}</span>
            </CardTitle>
          </div>
          <div className="flex w-full items-center gap-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => onEdit(question)}
              className="text-zinc-300 border flex-1 sm:flex-initial"
            >
              <Edit3 className="mr-1.5 h-4 w-4" />
              Edit
            </Button>
            <Button
              type="button"
              variant="destructive"
              size="sm"
              onClick={() => onDelete(question._id)}
              disabled={isDeleting}
              className="flex-1 sm:flex-initial"
            >
              <Trash2 className="mr-1.5 h-4 w-4" />
              {isDeleting ? "Deleting..." : "Delete"}
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="relative">
        <article
          className="prose-qa mt-2 max-w-none text-zinc-200"
          dangerouslySetInnerHTML={{ __html: normalizedAnswer }}
        />
        <p className="text-xs text-right text-zinc-500" suppressHydrationWarning>
          Saved: {createdDate}
        </p>
      </CardContent>
    </Card>
  );
}
