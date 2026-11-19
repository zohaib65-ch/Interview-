"use client";

import { useEffect, useRef, useState } from "react";
import { Check, CircleAlert, FileDown, LoaderCircle } from "lucide-react";

import { Button } from "@/components/ui/button";
import { exportQuestionsPdf, preloadPdfEngine } from "@/lib/pdf/export-questions";
import type { ExportScope } from "@/lib/pdf/types";
import { cn } from "@/lib/utils";

type ExportPdfButtonProps = ExportScope & {
  /** Nothing to export (still loading, or the list is empty). */
  disabled?: boolean;
  className?: string;
};

type Status = "idle" | "working" | "done" | "error";

const RESET_AFTER_MS = 2800;

/** One-click "Export PDF": fetches the questions, builds the document in the browser and downloads it. */
export function ExportPdfButton({ bank, categorySlug, disabled, className }: ExportPdfButtonProps) {
  const [status, setStatus] = useState<Status>("idle");
  const [message, setMessage] = useState("");
  const resetTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => {
    if (resetTimer.current) clearTimeout(resetTimer.current);
  }, []);

  async function handleExport() {
    if (status === "working") return;

    if (resetTimer.current) clearTimeout(resetTimer.current);
    setStatus("working");
    setMessage("Preparing your PDF...");

    try {
      const { fileName, questionCount } = await exportQuestionsPdf({ bank, categorySlug });
      setStatus("done");
      setMessage(`Downloaded ${fileName} with ${questionCount} ${questionCount === 1 ? "question" : "questions"}.`);
    } catch (error) {
      setStatus("error");
      setMessage(error instanceof Error ? error.message : "Could not export the PDF.");
    }

    resetTimer.current = setTimeout(() => setStatus("idle"), RESET_AFTER_MS);
  }

  return (
    <>
      <Button
        type="button"
        variant="outline"
        disabled={disabled || status === "working"}
        onClick={() => void handleExport()}
        // Warm up the PDF engine while the pointer is on its way to the click.
        onPointerEnter={() => void preloadPdfEngine().catch(() => undefined)}
        onFocus={() => void preloadPdfEngine().catch(() => undefined)}
        title={status === "error" ? message : "Download these questions as a PDF"}
        className={cn(
          // Fixed minimum width so the label swap (Export PDF / Preparing / Downloaded) doesn't shift the neighbouring button.
          "w-full sm:w-auto sm:min-w-36",
          status === "done" && "border-emerald-500/40 bg-emerald-500/10 text-emerald-300 hover:bg-emerald-500/10",
          status === "error" && "border-red-500/40 bg-red-500/10 text-red-300 hover:bg-red-500/10",
          className,
        )}
      >
        {status === "working" ? (
          <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
        ) : status === "done" ? (
          <Check className="mr-2 h-4 w-4" />
        ) : status === "error" ? (
          <CircleAlert className="mr-2 h-4 w-4" />
        ) : (
          <FileDown className="mr-2 h-4 w-4" />
        )}
        {status === "working" ? "Preparing PDF..." : status === "done" ? "PDF downloaded" : status === "error" ? "Export failed" : "Export PDF"}
      </Button>

      {/* Announces the outcome to screen readers; the button label already shows it visually. */}
      <span role="status" aria-live="polite" className="sr-only">
        {status === "idle" ? "" : message}
      </span>
    </>
  );
}
