import { describe, it, expect } from "vitest";
import { describeListChange } from "./conductHistory";

describe("describeListChange (histórico de condutas)", () => {
  it("records an added item", () => {
    expect(describeListChange(["A"], ["A", "B"])).toEqual([{ oldValue: null, newValue: "[ADICIONADO] B" }]);
  });
  it("records a removed item", () => {
    expect(describeListChange(["A", "B"], ["A"])).toEqual([{ oldValue: "[REMOVIDO] B", newValue: null }]);
  });
  it("records an edited item as old and new text", () => {
    expect(describeListChange(["A", "B"], ["A", "C"])).toEqual([{ oldValue: "A\nB", newValue: "A\nC" }]);
  });
  it("ignores pure reordering", () => {
    expect(describeListChange(["A", "B"], ["B", "A"])).toEqual([]);
  });
});
