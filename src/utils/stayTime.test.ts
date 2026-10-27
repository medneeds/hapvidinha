import { describe, it, expect } from "vitest";
import { formatTps } from "./stayTime";

describe("formatTps", () => {
  it("shows minutes under one hour", () => {
    expect(formatTps(45)).toBe("45min");
  });
  it("shows hours and minutes under one day", () => {
    expect(formatTps(205)).toBe("3h 25min");
    expect(formatTps(180)).toBe("3h");
  });
  it("shows days and hours from 24h on", () => {
    expect(formatTps(1680)).toBe("1d 4h");
    expect(formatTps(2880)).toBe("2d");
  });
});
