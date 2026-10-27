import { describe, it, expect } from "vitest";
import { getChangedPatientFields } from "./patientDiff";
import type { Patient } from "@/types/patient";

const base: Patient = {
  id: "p1",
  bedNumber: "U04",
  name: "MARIA",
  age: "",
  sector: "yellow",
  diagnoses: ["ANGINA", "TESTE A"],
  medicalHistory: ["HAS"],
  relevantExams: [],
  pendencies: [],
  schedule: [],
  admissionHistory: "",
  admissionDate: "",
};

describe("getChangedPatientFields", () => {
  it("does not resend a column the user did not touch", () => {
    // stale snapshot still has the old diagnoses, but only medicalHistory changed
    const changed = getChangedPatientFields(base, {
      ...base,
      medicalHistory: ["HAS", "DM"],
    });
    expect(changed).toEqual({ medicalHistory: ["HAS", "DM"] });
  });

  it("returns nothing when nothing changed", () => {
    expect(getChangedPatientFields(base, { ...base })).toEqual({});
  });

  it("keeps a field that is being cleared", () => {
    expect(getChangedPatientFields({ ...base, birthDate: "20/07/1941" }, { birthDate: "" })).toEqual({ birthDate: "" });
  });
});
