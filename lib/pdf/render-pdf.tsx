import { pdf } from "@react-pdf/renderer";

import { registerPdfFonts } from "./fonts";
import { QuestionsDocument } from "./questions-document";
import type { ExportData } from "./types";

/** Renders the export to a PDF blob. Imported lazily so the PDF engine never loads until someone exports. */
export async function renderQuestionsPdf(data: ExportData): Promise<Blob> {
  registerPdfFonts();
  return pdf(<QuestionsDocument data={data} />).toBlob();
}
