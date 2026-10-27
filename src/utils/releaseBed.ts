import type { Patient } from "@/types/patient";

/**
 * Patient fields wiped when a vacant bed is released for a new patient.
 * A vacant slot keeps only its identity (id, bed number, sector, order);
 * nothing from the previous occupant (names, dates, clinical lists) may carry over.
 */
export const RELEASED_BED_FIELDS: Partial<Patient> = {
  name: "",
  age: "",
  birthDate: "",
  diagnoses: [],
  medicalHistory: [],
  relevantExams: [],
  pendencies: [],
  schedule: [],
  admissionHistory: "",
  admissionDate: "",
  highlightedPendencies: [],
  highlightedDiagnoses: [],
  highlightedMedicalHistory: [],
  highlightedConducts: [],
  // null (not undefined) so the cleared value is actually persisted
  medicalResponsibility: null as unknown as Patient["medicalResponsibility"],
  internmentStatus: null,
  internmentNotes: null,
  allocationStatus: null,
  psmStatus: null,
  clinicalStatus: null,
  utiAdmissionDate: [],
  utiDischargePrediction: [],
  utiAllergies: [],
  utiAdmissionReason: [],
  utiCurrentStatus: [],
  utiDevices: [],
  utiCulturesAntibiotics: [],
  utiSpecialties: [],
  utiOriginSector: [],
  utiDailyConducts: [],
  medicalRecordNumber: null,
  attendanceNumber: null,
  cpf: null,
  motherName: null,
  insuranceCompany: null,
  insurancePlan: null,
  insurancePlanType: null,
  insuranceCardNumber: null,
  insuranceDuration: null,
};

/** Returns the bed ready to be filled: occupied, available and with no leftover data. */
export function releaseBedForFilling(patient: Patient, overrides: Partial<Patient> = {}): Patient {
  return {
    ...patient,
    ...RELEASED_BED_FIELDS,
    isVacant: false,
    bedStatus: "available",
    bedMaintenanceReason: null,
    bedMaintenanceStartedAt: null,
    bedMaintenanceStartedBy: null,
    ...overrides,
  };
}
