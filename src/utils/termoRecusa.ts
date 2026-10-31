import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import termoRecusaAsset from "@/assets/documents/termo-recusa-tratamento.pdf.asset.json";

/**
 * "Termo de Recusa de Tratamento" (Hospital Guarás). In the hospital's Word file the line
 * "SÃO LUÍS/MA, __/__/____." is an automatic date field (the day it is printed), so the
 * stored PDF leaves that spot blank and the date of printing is written there when downloading.
 */
export const TERMO_RECUSA_DATE_SPOT = { x: 104.3, baselineFromTop: 548.3, size: 10.5 } as const;

export function formatTermoRecusaDate(d: Date): string {
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  return `${dd}/${mm}/${d.getFullYear()}`;
}

export async function buildTermoRecusaPdf(base: ArrayBuffer | Uint8Array, date = new Date()): Promise<Uint8Array> {
  const pdf = await PDFDocument.load(base);
  const page = pdf.getPage(0);
  const font = await pdf.embedFont(StandardFonts.Helvetica);
  page.drawText(formatTermoRecusaDate(date), {
    x: TERMO_RECUSA_DATE_SPOT.x,
    y: page.getHeight() - TERMO_RECUSA_DATE_SPOT.baselineFromTop,
    size: TERMO_RECUSA_DATE_SPOT.size,
    font,
    color: rgb(0, 0, 0),
  });
  return pdf.save();
}

/** Downloads the form with today's date already on the date line. */
export async function downloadTermoRecusa(): Promise<void> {
  const res = await fetch(termoRecusaAsset.url);
  if (!res.ok) throw new Error("Não foi possível carregar o termo.");
  const bytes = await buildTermoRecusaPdf(await res.arrayBuffer());
  const url = URL.createObjectURL(new Blob([bytes as BlobPart], { type: "application/pdf" }));
  const a = document.createElement("a");
  a.href = url;
  a.download = "TERMO_DE_RECUSA_DE_TRATAMENTO.pdf";
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 120_000);
}
