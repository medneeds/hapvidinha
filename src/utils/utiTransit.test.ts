import { describe, it, expect } from "vitest";
import type { Patient } from "@/types/patient";
import {
  transitForUnitSection,
  transitForBed,
  vacantBedsOfUnit,
  unitOfUtiBed,
  transitWaitMinutes,
  type TransitPatient,
} from "./utiTransit";

const transit = (id: string, unit: "UTI 1" | "UTI 2", startedAt: string): TransitPatient => ({
  id, bedNumber: id, name: id, age: "", sector: "outside", diagnoses: [], medicalHistory: [], relevantExams: [],
  pendencies: [], schedule: [], admissionHistory: "", admissionDate: "", transitTargetUnit: unit, transitStartedAt: startedAt,
});

const bed = (bedNumber: string, sector: Patient["sector"], isVacant: boolean, bedStatus: Patient["bedStatus"] = "available"): Patient => ({
  id: `${sector}-${bedNumber}`, bedNumber, name: "", age: "", sector, diagnoses: [], medicalHistory: [], relevantExams: [],
  pendencies: [], schedule: [], admissionHistory: "", admissionDate: "", isVacant, bedStatus,
});

const list = [
  transit("B", "UTI 2", "2026-10-31T08:00:00Z"),
  transit("A", "UTI 1", "2026-10-31T09:00:00Z"),
  transit("C", "UTI 1", "2026-10-31T07:00:00Z"),
];

describe("UTI transit area", () => {
  it("shows in a UTI section only the patients the emergency indicated for that UTI, longest wait first", () => {
    expect(transitForUnitSection(list, "UTI 1").map((p) => p.id)).toEqual(["C", "A"]);
    expect(transitForUnitSection(list, "UTI 2").map((p) => p.id)).toEqual(["B"]);
  });

  it("lets a vacant bed receive any waiting patient, its own UTI first", () => {
    expect(transitForBed(list, "UTI 2").map((p) => p.id)).toEqual(["B", "C", "A"]);
  });

  it("offers only vacant, available beds of the chosen UTI", () => {
    const beds = [bed("U02", "blue", true), bed("U01", "red", true), bed("U03", "blue", false), bed("U04", "blue", true, "maintenance"), bed("U05", "yellow", true)];
    expect(vacantBedsOfUnit(beds, "UTI 1").map((b) => b.bedNumber)).toEqual(["U01", "U02"]);
    expect(vacantBedsOfUnit(beds, "UTI 2").map((b) => b.bedNumber)).toEqual(["U05"]);
  });

  it("knows which UTI a bed belongs to", () => {
    expect(unitOfUtiBed("yellow")).toBe("UTI 2");
    expect(unitOfUtiBed("blue")).toBe("UTI 1");
  });

  it("counts the waiting time in minutes", () => {
    expect(transitWaitMinutes("2026-10-31T07:00:00Z", new Date("2026-10-31T09:25:00Z"))).toBe(145);
    expect(transitWaitMinutes(null)).toBe(0);
  });
});
