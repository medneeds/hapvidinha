import { rgb, type PDFFont, type PDFPage } from "pdf-lib";

/**
 * Shared "write over the original PDF" drawing used by the hemocomponent documents and the
 * sepsis protocol form. The original pages are never changed — only these texts are drawn on top.
 * Positions are PDF points from the TOP-LEFT of the page; y is the text baseline.
 */
export interface Spot {
  page: number;
  x: number;
  y: number;
  size?: number;
  /** Smallest size this spot may shrink to (default 5.5). */
  minSize?: number;
  maxWidth?: number;
  align?: "left" | "center";
  line2?: { x: number; y: number; maxWidth: number };
  lineHeight?: number;
  maxLines?: number;
  /** When the text doesn't fit, wrap it into two small lines stacked just above the baseline. */
  stack?: boolean;
  /** When the text doesn't fit, continue on a second small line just below the baseline. */
  wrapBelow?: boolean;
  /** Extra space between the two wrapped lines (stack / wrapBelow). */
  lineGap?: number;
}

export interface DocLayout {
  file: string;
  size: number;
  fields: Record<string, Spot>;
}

export const INK = rgb(0.05, 0.28, 0.7);
const MIN_SIZE = 5.5;
const WIN_ANSI_EXTRA = "–—‘’“”•…€";

/** Helvetica (WinAnsi) cannot encode every character — drop the ones it can't print. */
export const toPrintable = (s: string) =>
  Array.from(s.normalize("NFC"))
    .filter((c) => c.charCodeAt(0) <= 0xff || WIN_ANSI_EXTRA.includes(c))
    .join("");

export function wrap(text: string, font: PDFFont, size: number, width: number): string[] {
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

export function drawSpot(page: PDFPage, spot: Spot, raw: string, regular: PDFFont, bold: PDFFont, baseSize: number) {
  const text = toPrintable(raw).trim();
  if (!text) return;
  const H = page.getHeight();
  const isMark = text === "X";
  const font = isMark ? bold : regular;
  const min = spot.minSize ?? MIN_SIZE;
  let size = spot.size ?? baseSize;

  if (spot.align === "center") {
    if (spot.maxWidth) while (size > min && font.widthOfTextAtSize(text, size) > spot.maxWidth) size -= 0.25;
    const w = font.widthOfTextAtSize(text, size);
    page.drawText(text, { x: spot.x - w / 2, y: H - spot.y, size, font, color: INK });
    return;
  }

  const maxW = spot.maxWidth ?? 1000;
  // Multi-line box
  if (spot.maxLines && spot.lineHeight) {
    let lines = wrap(text, font, size, maxW);
    while (lines.length > spot.maxLines && size > min) {
      size -= 0.25;
      lines = wrap(text, font, size, maxW);
    }
    lines.forEach((l, i) => page.drawText(l, { x: spot.x, y: H - spot.y - i * spot.lineHeight!, size, font, color: INK }));
    return;
  }

  // Single line: shrink a little first, then continue elsewhere, never cut the text.
  const fits = (s: number) => font.widthOfTextAtSize(text, s) <= maxW;
  const softMin = Math.max(min, size - 1.5);
  let s = size;
  while (!fits(s) && s > softMin) s -= 0.25;
  if (!fits(s) && (spot.stack || spot.wrapBelow)) {
    let st = Math.min(size, spot.wrapBelow ? 5 : 7);
    let lines = wrap(text, font, st, maxW);
    while (lines.length > 2 && st > min) {
      st -= 0.25;
      lines = wrap(text, font, st, maxW);
    }
    const gap = st + (spot.lineGap ?? (spot.wrapBelow ? 0.6 : 1));
    lines.forEach((l, idx) => {
      const offset = spot.wrapBelow ? -idx * gap : (lines.length - 1 - idx) * gap;
      page.drawText(l, { x: spot.x, y: H - spot.y + offset, size: st, font, color: INK });
    });
    return;
  }
  if (fits(s) || !spot.line2) {
    while (!fits(s) && s > min) s -= 0.25;
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
  const rest = words.slice(i).join(" ");
  let s2 = size;
  while (rest && font.widthOfTextAtSize(rest, s2) > spot.line2.maxWidth && s2 > min) s2 -= 0.25;
  page.drawText(first, { x: spot.x, y: H - spot.y, size, font, color: INK });
  if (rest) page.drawText(rest, { x: spot.line2.x, y: H - spot.line2.y, size: s2, font, color: INK });
}
