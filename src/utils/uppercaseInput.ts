type TextField = HTMLInputElement | HTMLTextAreaElement;

/**
 * Uppercases what the user typed without moving the caret.
 *
 * Writing the uppercase text back to the field before React re-renders keeps the
 * cursor where the user is typing (React only resets the caret when the state value
 * differs from what is already in the field). While a mobile keyboard / IME is still
 * composing a word the text is left untouched — changing it mid-composition makes
 * keyboards duplicate letters — and it is uppercased on the next keystroke or on save.
 */
export function uppercaseKeepingCaret(el: TextField, isComposing = false): string {
  const raw = el.value;
  if (isComposing) return raw;
  const upper = raw.toUpperCase();
  if (upper === raw) return raw;

  const start = el.selectionStart;
  const end = el.selectionEnd;
  const delta = upper.length - raw.length; // non-zero only for rare letters such as "ß"
  el.value = upper;
  if (start !== null && end !== null) {
    const clamp = (n: number) => Math.max(0, Math.min(upper.length, n));
    el.setSelectionRange(clamp(start + delta), clamp(end + delta));
  }
  return upper;
}

/** Character offset inside `container`'s text at the clicked point (null when unknown). */
export function caretOffsetFromPoint(container: HTMLElement, x: number, y: number): number | null {
  const doc = document as Document & {
    caretPositionFromPoint?: (x: number, y: number) => { offsetNode: Node; offset: number } | null;
  };
  let node: Node | null = null;
  let offset = 0;
  if (typeof doc.caretPositionFromPoint === "function") {
    const pos = doc.caretPositionFromPoint(x, y);
    if (pos) { node = pos.offsetNode; offset = pos.offset; }
  } else if (typeof document.caretRangeFromPoint === "function") {
    const range = document.caretRangeFromPoint(x, y);
    if (range) { node = range.startContainer; offset = range.startOffset; }
  }
  if (!node || !container.contains(node) || node.nodeType !== Node.TEXT_NODE) return null;

  // Add the length of any text that comes before the clicked text node.
  let total = offset;
  const walker = document.createTreeWalker(container, NodeFilter.SHOW_TEXT);
  for (let n = walker.nextNode(); n && n !== node; n = walker.nextNode()) {
    total += n.textContent?.length ?? 0;
  }
  return total;
}
