import { PDFDocument, StandardFonts, rgb, type PDFFont, type PDFPage } from "pdf-lib";
import layout from "./hemoLayout.json";
import { HEMO_DOCS, type HemoDocKey } from "./hemoRequest";

/**
 * Draws the directed values over the untouched original PDFs (public/documents/hemoderivados)
 * and returns one PDF with the selected documents in the standard order.
 */

interface Spot {
  page: number;
  x: number;
  y: number;
  size?: number;
  maxWidth?: number;
  align?: "left" | "center";
  line2?: { x: number; y: number; maxWidth: number };
  lineHeight?: number;
  maxLines?: number;
  /** When the text doesn't fit, wrap it into two small lines stacked just above the baseline. */
  stack?: boolean;
}
interface DocLayout {
  file: string;
  size: number;
  fields: Record<string, Spot>;
}

const INK = rgb(0.05, 0.28, 0.7);
const MIN_SIZE = 5.5;
const WIN_ANSI_EXTRA = "–—‘’“”•…€";

/** Helvetica (WinAnsi) cannot encode every character — drop the ones it can't print. */
export const toPrintable = (s: string) =>
  Array.from(s.normalize("NFC"))
    .filter((c) => c.charCodeAt(0) <= 0xff || WIN_ANSI_EXTRA.includes(c))
    .join("");

function wrap(text: string, font: PDFFont, size: number, width: number): string[] {
  const words = text.split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let cur = "";
  for (const w of words) {
    const next = cur ? `${cur} ${w}` : w;
    if (font.widthOfTextAtSize(next, size) <= width || !cur) cur = next;
    else {
      lines.push(cur);
      cur = w;
    }
  }
  if (cur) lines.push(cur);
  return lines;
}

function drawSpot(page: PDFPage, spot: Spot, raw: string, regular: PDFFont, bold: PDFFont, baseSize: number) {
  const text = toPrintable(raw).trim();
  if (!text) return;
  const H = page.getHeight();
  const isMark = text === "X";
  const font = isMark ? bold : regular;
  let size = spot.size ?? baseSize;

  if (spot.align === "center") {
    if (spot.maxWidth) while (size > MIN_SIZE && font.widthOfTextAtSize(text, size) > spot.maxWidth) size -= 0.25;
    const w = font.widthOfTextAtSize(text, size);
    page.drawText(text, { x: spot.x - w / 2, y: H - spot.y, size, font, color: INK });
    return;
  }

  const maxW = spot.maxWidth ?? 1000;
  // Multi-line box (hemocomponentes)
  if (spot.maxLines && spot.lineHeight) {
    let lines = wrap(text, font, size, maxW);
    while (lines.length > spot.maxLines && size > MIN_SIZE) {
      size -= 0.25;
      lines = wrap(text, font, size, maxW);
    }
    lines.forEach((l, i) => page.drawText(l, { x: spot.x, y: H - spot.y - i * spot.lineHeight!, size, font, color: INK }));
    return;
  }

  // Single line: shrink a little first, then continue on the form's second line, never cut the text.
  const fits = (s: number) => font.widthOfTextAtSize(text, s) <= maxW;
  const softMin = Math.max(MIN_SIZE, size - 1.5);
  let s = size;
  while (!fits(s) && s > softMin) s -= 0.25;
  if (!fits(s) && spot.stack) {
    let st = Math.min(size, 7);
    let lines = wrap(text, font, st, maxW);
    while (lines.length > 2 && st > MIN_SIZE) {
      st -= 0.25;
      lines = wrap(text, font, st, maxW);
    }
    const gap = st + 1;
    lines.forEach((l, idx) =>
      page.drawText(l, { x: spot.x, y: H - spot.y + (lines.length - 1 - idx) * gap, size: st, font, color: INK })
    );
    return;
  }
  if (fits(s) || !spot.line2) {
    while (!fits(s) && s > MIN_SIZE) s -= 0.25;
    page.drawText(text, { x: spot.x, y: H - spot.y, size: s, font, color: INK });
    return;
  }
  const words = text.split(/\s+/);
  let first = "";
  let i = 0;
  for (; i < words.length; i++) {
    const next = first ? `${first} ${words[i]}` : words[i];
    if (font.widthOfTextAtSize(next, size) > maxW && first) break;
    first = next;
  }
  let rest = words.slice(i).join(" ");
  let s2 = size;
  while (rest && font.widthOfTextAtSize(rest, s2) > spot.line2.maxWidth && s2 > MIN_SIZE) s2 -= 0.25;
  page.drawText(first, { x: spot.x, y: H - spot.y, size, font, color: INK });
  if (rest) page.drawText(rest, { x: spot.line2.x, y: H - spot.line2.y, size: s2, font, color: INK });
}

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
