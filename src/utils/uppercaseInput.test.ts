// @vitest-environment jsdom
import { describe, it, expect } from "vitest";
import { uppercaseKeepingCaret } from "./uppercaseInput";

describe("uppercaseKeepingCaret", () => {
  it("uppercases a letter typed in the middle and keeps the cursor right after it", () => {
    const el = document.createElement("textarea");
    document.body.appendChild(el);
    el.value = "DIPIRaONA"; // "a" typed after "DIPIR"
    el.setSelectionRange(6, 6);
    expect(uppercaseKeepingCaret(el)).toBe("DIPIRAONA");
    expect(el.value).toBe("DIPIRAONA");
    expect(el.selectionStart).toBe(6);
    expect(el.selectionEnd).toBe(6);
  });

  it("leaves the text alone while the keyboard is still composing a word", () => {
    const el = document.createElement("input");
    el.value = "dipi";
    expect(uppercaseKeepingCaret(el, true)).toBe("dipi");
    expect(el.value).toBe("dipi");
  });
});
