import type { Patient } from "@/types/patient";
import { formatBirthDateDisplay } from "@/utils/calculateDetailedAge";
import { isBedInUtiUnit, type UtiUnit } from "@/utils/utiTransfer";

/**
 * UTI "Em trânsito · Aguardando alocação":
 * the emergency sends the patient to a UTI unit (UE bed freed at once) and the UTI
 * places the patient in a specific vacant bed. Waiting patients live as UTI rows with
 * sector 'outside' and a `transit_target_unit`; they never appear among the fixed beds.
 */
export interface TransitPatient extends Patient {
  transitTargetUnit: UtiUnit;
  transitStartedAt: string | null;
}

const splitLines = (v: unknown): string[] =>
  typeof v === "string" && v ? v.split("\n").filter(Boolean) : [];

export function mapTransitRow(p: any): TransitPatient {
  return {
    id: p.id,
    bedNumber: p.bed_number,
    name: p.name || "",
    age: p.age || "",
    birthDate: formatBirthDateDisplay(p.birth_date),
    sector: "outside",
    diagnoses: splitLines(p.diagnoses),
    medicalHistory: splitLines(p.medical_history),
    relevantExams: splitLines(p.relevant_exams),
    pendencies: splitLines(p.pendencies),
    utiDailyConducts: splitLines(p.uti_daily_conducts),
    utiOriginSector: splitLines(p.uti_origin_sector),
    schedule: [],
    admissionHistory: p.admission_history || "",
    admissionDate: "",
    allocationStatus: (p.allocation_status as Patient["allocationStatus"]) || "pending",
    medicalRecordNumber: p.medical_record_number || null,
    attendanceNumber: p.attendance_number || null,
    isVacant: false,
    transitTargetUnit: p.transit_target_unit === "UTI 2" ? "UTI 2" : "UTI 1",
    transitStartedAt: p.transit_started_at || null,
  };
}

const byWaitStart = (a: TransitPatient, b: TransitPatient) =>
  (a.transitStartedAt || "").localeCompare(b.transitStartedAt || "");

/** Section of one UTI: only patients the emergency indicated for that unit, longest wait first. */
export function transitForUnitSection(list: TransitPatient[], unit: UtiUnit): TransitPatient[] {
  return list.filter((p) => p.transitTargetUnit === unit).sort(byWaitStart);
}

/** Picking for a vacant bed: every waiting patient, the bed's own unit first (the UTI may take the other unit's patient). */
export function transitForBed(list: TransitPatient[], unit: UtiUnit): TransitPatient[] {
  const own = list.filter((p) => p.transitTargetUnit === unit).sort(byWaitStart);
  const other = list.filter((p) => p.transitTargetUnit !== unit).sort(byWaitStart);
  return [...own, ...other];
}

/** Vacant, non-blocked beds of one UTI among the loaded UTI beds, in bed order. */
export function vacantBedsOfUnit(beds: Patient[], unit: UtiUnit): Patient[] {
  return beds
    .filter((b) => isBedInUtiUnit(b.sector, unit) && b.isVacant === true && (b.bedStatus || "available") !== "maintenance")
    .sort((a, b) => a.bedNumber.localeCompare(b.bedNumber, "pt-BR", { numeric: true }));
}

/** UTI unit of a fixed UTI bed (UTI 1 = blue/red, UTI 2 = yellow). */
export function unitOfUtiBed(sector: string): UtiUnit {
  return sector === "yellow" ? "UTI 2" : "UTI 1";
}

/** Minutes the patient has been waiting in transit. */
export function transitWaitMinutes(startedAt: string | null, now: Date = new Date()): number {
  if (!startedAt) return 0;
  const t = new Date(startedAt).getTime();
  if (isNaN(t)) return 0;
  return Math.max(0, Math.floor((now.getTime() - t) / 60000));
}
