import { PDFDocument, StandardFonts, type PDFFont } from "pdf-lib";
import layout from "./hemoLayout.json";
import { HEMO_DOCS, type HemoDocKey } from "./hemoRequest";
import { drawSpot, type DocLayout } from "./pdfOverlay";

export { toPrintable } from "./pdfOverlay";

/**
 * Draws the directed values over the untouched original PDFs (public/documents/hemoderivados)
 * and returns one PDF with the selected documents in the standard order.
 */

type FetchFile = (file: string) => Promise<ArrayBuffer>;

const fetchOriginal: FetchFile = async (file) => {
  const res = await fetch(`/documents/hemoderivados/${file}`);
  if (!res.ok) throw new Error(`Não foi possível abrir o documento ${file}.`);
  return res.arrayBuffer();
};

async function appendFilledDoc(
  out: PDFDocument,
  key: HemoDocKey,
  values: Record<string, string>,
  fonts: { regular: PDFFont; bold: PDFFont },
  fetchFile: FetchFile
) {
  const doc = (layout as unknown as Record<string, DocLayout>)[key];
  const src = await PDFDocument.load(await fetchFile(doc.file));
  const pages = await out.copyPages(src, src.getPageIndices());
  pages.forEach((p) => out.addPage(p));
  for (const [field, value] of Object.entries(values || {})) {
    const spot = doc.fields[field];
    if (!spot || !value) continue;
    drawSpot(pages[spot.page], spot, value, fonts.regular, fonts.bold, doc.size);
  }
}

/** One filled document on its own (used by the tabbed print window). */
export async function generateHemoDocPdf(
  values: Record<HemoDocKey, Record<string, string>>,
  key: HemoDocKey,
  fetchFile: FetchFile = fetchOriginal
): Promise<Uint8Array> {
  const out = await PDFDocument.create();
  const fonts = { regular: await out.embedFont(StandardFonts.Helvetica), bold: await out.embedFont(StandardFonts.HelveticaBold) };
  await appendFilledDoc(out, key, values[key], fonts, fetchFile);
  out.setTitle(HEMO_DOCS.find((d) => d.key === key)?.title || "Hemocomponentes");
  return out.save();
}

/** All selected documents in one PDF, in the standard order (fallback when the print window is blocked). */
export async function generateHemoPdf(
  values: Record<HemoDocKey, Record<string, string>>,
  selected: Record<HemoDocKey, boolean>,
  fetchFile: FetchFile = fetchOriginal
): Promise<Uint8Array> {
  const out = await PDFDocument.create();
  const fonts = { regular: await out.embedFont(StandardFonts.Helvetica), bold: await out.embedFont(StandardFonts.HelveticaBold) };
  for (const { key } of HEMO_DOCS) {
    if (!selected[key]) continue;
    await appendFilledDoc(out, key, values[key], fonts, fetchFile);
  }
  out.setTitle("Solicitação de Hemocomponentes");
  return out.save();
}
