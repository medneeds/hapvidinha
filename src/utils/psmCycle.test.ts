import { describe, it, expect } from "vitest";
import { getPatientPsmState, nextPatientPsm } from "./psmCycle";

describe("PSM status pill", () => {
  it("recognises AGUARDANDO aliases written in the pendencies", () => {
    expect(getPatientPsmState({ psmStatus: null, pendencies: ["INTERNAÇÃO EM UTI - EM AUDITORIA"] })).toBe("aguardando");
  });

  it("follows the cycle AGUARDANDO → FAVORÁVEL → DESFAVORÁVEL → IR PARA → AGUARDANDO", () => {
    expect(nextPatientPsm({ psmStatus: "aguardando", pendencies: [] }).psmStatus).toBe("favoravel");
    expect(nextPatientPsm({ psmStatus: "favoravel", pendencies: [] }).psmStatus).toBe("desfavoravel");
    expect(nextPatientPsm({ psmStatus: "desfavoravel", pendencies: [] }).psmStatus).toBe("ir_para");
    expect(nextPatientPsm({ psmStatus: "ir_para" as any, pendencies: [] }).psmStatus).toBe("aguardando");
  });

  it("starts at AGUARDANDO when there is no status", () => {
    expect(nextPatientPsm({ psmStatus: null, pendencies: [] }).psmStatus).toBe("aguardando");
  });

  it("turns the pendency into the destination at IR PARA", () => {
    const result = nextPatientPsm({ psmStatus: "desfavoravel", pendencies: ["SOLICITADA INTERNAÇÃO EM UTI (PSM DESFAVORÁVEL)"] });
    expect(result.pendencies).toEqual(["IR PARA LEITO DE UTI"]);
    expect(result.psmStatus).toBe("ir_para");
  });
});
