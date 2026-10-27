import { describe, it, expect } from "vitest";
import { releaseBedForFilling } from "./releaseBed";
import type { Patient } from "@/types/patient";

const leftover: Patient = {
  id: "b1",
  bedNumber: "U04",
  name: "",
  age: "",
  birthDate: "20/07/1941",
  sector: "yellow",
  diagnoses: ["ANTIGO"],
  medicalHistory: [],
  relevantExams: [],
  pendencies: [],
  schedule: [],
  admissionHistory: "",
  admissionDate: "2026-10-26T12:00:00Z",
  utiAdmissionDate: ["26/10/2026"],
  utiDischargePrediction: ["28/10/2026"],
  isVacant: true,
};

describe("releaseBedForFilling", () => {
  it("clears birth date and every date left by the previous patient", () => {
    const released = releaseBedForFilling(leftover);
    expect(released.birthDate).toBe("");
    expect(released.admissionDate).toBe("");
    expect(released.utiAdmissionDate).toEqual([]);
    expect(released.utiDischargePrediction).toEqual([]);
    expect(released.diagnoses).toEqual([]);
  });

  it("keeps the bed identity and opens it for filling", () => {
    const released = releaseBedForFilling(leftover);
    expect(released.id).toBe("b1");
    expect(released.bedNumber).toBe("U04");
    expect(released.sector).toBe("yellow");
    expect(released.isVacant).toBe(false);
  });
});
