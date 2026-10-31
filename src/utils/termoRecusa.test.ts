import { describe, it, expect } from "vitest";
import { formatTermoRecusaDate } from "./termoRecusa";

describe("Termo de Recusa de Tratamento", () => {
  it("prints the day it is downloaded as dd/mm/aaaa on the date line", () => {
    expect(formatTermoRecusaDate(new Date(2026, 9, 31))).toBe("31/10/2026");
    expect(formatTermoRecusaDate(new Date(2027, 0, 5))).toBe("05/01/2027");
  });
});
