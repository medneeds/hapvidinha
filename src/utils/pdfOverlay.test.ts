import { describe, it, expect } from "vitest";
import { toPrintable } from "./pdfOverlay";

describe("toPrintable", () => {
  it("turns line breaks typed in a field into spaces so the form still prints", () => {
    expect(toPrintable("CEFTRIAXONA 1G\nMETRONIDAZOL 500 MG")).toBe("CEFTRIAXONA 1G METRONIDAZOL 500 MG");
    expect(toPrintable("A\r\n\tB")).toBe("A B");
  });
  it("keeps accents and drops characters the PDF font cannot print", () => {
    expect(toPrintable("HOSPITAL GUARÁS ≥ 2\u0007")).toBe("HOSPITAL GUARÁS  2");
  });
});
