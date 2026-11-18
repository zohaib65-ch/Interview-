import { getBank } from "@/lib/question-banks";
import { slugify } from "@/lib/slug";

import { loadExportData } from "./load-export-data";
import type { ExportData, ExportScope } from "./types";

type PdfEngine = typeof import("./render-pdf");

let engine: Promise<PdfEngine> | null = null;

/** Starts downloading the PDF engine (~1 MB) ahead of the click, e.g. when the button is hovered. */
export function preloadPdfEngine() {
  engine ??= import("./render-pdf").catch((error: unknown) => {
    engine = null;
    throw error;
  });
  return engine;
}

function buildFileName(data: ExportData, scope: ExportScope) {
  const { href } = getBank(scope.bank);
  const bankPart = href.replace(/^\//, "").replace(/-questions$/, "");
  const categoryPart = scope.categorySlug ? `-${slugify(data.title) || scope.categorySlug}` : "";
  const day = data.exportedAt;
  const date = [day.getFullYear(), String(day.getMonth() + 1).padStart(2, "0"), String(day.getDate()).padStart(2, "0")].join("-");

  return `prepforge-${bankPart}${categoryPart}-${date}.pdf`;
}

function saveBlob(blob: Blob, fileName: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  link.remove();
  // Give the browser a moment to start the download before releasing the blob.
  setTimeout(() => URL.revokeObjectURL(url), 10_000);
}

/** Loads the questions for `scope`, renders them as a styled PDF and downloads it. */
export async function exportQuestionsPdf(scope: ExportScope) {
  const [data, pdfEngine] = await Promise.all([loadExportData(scope), preloadPdfEngine()]);

  if (data.questionCount === 0) throw new Error("There are no questions to export yet.");

  const blob = await pdfEngine.renderQuestionsPdf(data);
  const fileName = buildFileName(data, scope);
  saveBlob(blob, fileName);

  return { fileName, questionCount: data.questionCount };
}
