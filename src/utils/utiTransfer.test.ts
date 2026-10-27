import { describe, it, expect } from "vitest";
import { buildUtiOriginLabel, buildUtiDestinationLabel, getVacantUtiBeds } from "./utiTransfer";

describe("UE → UTI transfer", () => {
  it("writes the ward the patient came from in the UTI origin", () => {
    expect(buildUtiOriginLabel("URGÊNCIA E EMERGÊNCIA ADULTO", "red", "V03")).toBe("UE ADULTO – CUIDADOS ESPECIAIS (V03)");
  });

  it("records the destination as unit and bed", () => {
    expect(buildUtiDestinationLabel("UTI 1", "U03")).toBe("UTI 1 – U03");
  });

  it("offers only vacant, available beds of the chosen UTI", () => {
    const rows = [
      { id: "1", bed_number: "U02", sector: "blue", is_vacant: true, bed_status: "available" },
      { id: "2", bed_number: "U01", sector: "blue", is_vacant: false, bed_status: "available" },
      { id: "3", bed_number: "U05", sector: "yellow", is_vacant: true, bed_status: "available" },
      { id: "4", bed_number: "U10", sector: "blue", is_vacant: true, bed_status: "maintenance" },
      { id: "5", bed_number: "U09", sector: "blue", is_vacant: true, bed_status: null },
    ];
    expect(getVacantUtiBeds(rows, "UTI 1").map(r => r.bed_number)).toEqual(["U02", "U09"]);
    expect(getVacantUtiBeds(rows, "UTI 2").map(r => r.bed_number)).toEqual(["U05"]);
  });
});
