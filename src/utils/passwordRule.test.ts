import { describe, it, expect } from "vitest";
import { isValidPassword } from "./passwordRule";

describe("regra de senha (6 caracteres, maiúsculas e/ou números)", () => {
  it("aceita letras e números misturados", () => {
    expect(isValidPassword("ABC123")).toBe(true);
  });
  it("aceita apenas números", () => {
    expect(isValidPassword("482915")).toBe(true);
  });
  it("aceita apenas letras maiúsculas", () => {
    expect(isValidPassword("HAPMAP")).toBe(true);
  });
  it("recusa menos ou mais de 6 caracteres", () => {
    expect(isValidPassword("ABC12")).toBe(false);
    expect(isValidPassword("ABC1234")).toBe(false);
  });
  it("recusa minúsculas e símbolos", () => {
    expect(isValidPassword("abc123")).toBe(false);
    expect(isValidPassword("ABC-12")).toBe(false);
  });
});
