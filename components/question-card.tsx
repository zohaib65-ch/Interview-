"use client";

import { Edit3, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { QuestionItem } from "@/types/question";

type QuestionCardProps = {
  question: QuestionItem;
  index: number;
  onEdit: (question: QuestionItem) => void;
  onDelete: (id: string) => void;
  isDeleting: boolean;
};

export function QuestionCard({ question, index, onEdit, onDelete, isDeleting }: QuestionCardProps) {
  const createdDate = new Date(question.createdAt).toLocaleString();

  return (
    <Card className="group relative overflow-hidden">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.07),transparent_60%)]" />
      <CardHeader className="relative pb-0 px-5 pt-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="space-y-1">
            <CardDescription>Question {index}</CardDescription>
            <CardTitle className="text-lg leading-7 font-extrabold! ">
              <span className="">Question : {question.question}</span>
            </CardTitle>
          </div>
          <div className="flex items-center gap-2">
            <Button type="button" variant="ghost" size="sm" onClick={() => onEdit(question)} className="text-zinc-300">
              <Edit3 className="mr-1.5 h-4 w-4" />
              Edit
            </Button>
            <Button type="button" variant="destructive" size="sm" onClick={() => onDelete(question._id)} disabled={isDeleting}>
              <Trash2 className="mr-1.5 h-4 w-4" />
              {isDeleting ? "Deleting..." : "Delete"}
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="relative">
        <article className="prose-qa mt-2 max-w-none text-zinc-200" dangerouslySetInnerHTML={{ __html: question.answer }} />
        <p className="text-xs text-right text-zinc-500">Saved: {createdDate}</p>
      </CardContent>
    </Card>
  );
}
