import { supabase } from "@/integrations/supabase/client";

/**
 * Returns true if the given (department, sector, bed_number) corresponds to a
 * FIXED-capacity slot that must NEVER be deleted (only vacated):
 *  - UTI: U01–U10 in sectors blue/yellow
 *  - Urgência observation: V01–V07 (red), A01–A06 (yellow), Z01–Z06 (blue)
 */
export function isFixedBed(
  department: string | null | undefined,
  sector: string | null | undefined,
  bedNumber: string | null | undefined,
): boolean {
  if (!sector || !bedNumber) return false;
  if (department === "UTI") {
    return (sector === "blue" || sector === "yellow") && /^U(0[1-9]|10)$/.test(bedNumber);
  }
  if (sector === "red") return /^V0[1-7]$/.test(bedNumber);
  if (sector === "yellow") return /^A0[1-6]$/.test(bedNumber);
  if (sector === "blue") return /^Z0[1-6]$/.test(bedNumber);
  return false;
}

/**
 * After a successful Alta/Óbito/Transferência, free the bed:
 *  - Fixed bed -> mark vacant, preserving bed_number/sector/department
 *  - Non-fixed bed -> hard delete the row
 *
 * Returns true if vacated (kept), false if deleted.
 */
export async function vacateOrDeletePatient(args: {
  id: string;
  department: string | null | undefined;
  sector: string | null | undefined;
  bedNumber: string | null | undefined;
}): Promise<{ vacated: boolean; error?: unknown }> {
  const { id, department, sector, bedNumber } = args;
  const fixed = isFixedBed(department, sector, bedNumber);

  if (fixed) {
    const { error } = await supabase
      .from("patients")
      .update({
        is_vacant: true,
        bed_status: "available",
        name: "",
        age: null,
        birth_date: null,
        diagnoses: null,
        medical_history: null,
        relevant_exams: null,
        pendencies: null,
        schedule: null,
        admission_history: null,
        admission_date: null,
        medical_responsibility: null,
        internment_status: null,
        internment_notes: null,
        is_door_patient: false,
        allocation_status: null,
        psm_status: null,
        clinical_status: null,
        patient_category: null,
        medical_record_number: null,
        attendance_number: null,
        cpf: null,
        mother_name: null,
        insurance_company: null,
        insurance_plan: null,
        insurance_plan_type: null,
        insurance_card_number: null,
        insurance_duration: null,
        highlighted_pendencies: [],
        highlighted_diagnoses: [],
        highlighted_medical_history: [],
        highlighted_conducts: [],
        uti_admission_date: null,
        uti_discharge_prediction: null,
        uti_allergies: null,
        uti_admission_reason: null,
        uti_current_status: null,
        uti_devices: null,
        uti_cultures_antibiotics: null,
        uti_specialties: null,
        uti_origin_sector: null,
        uti_daily_conducts: null,
      } as any)
      .eq("id", id);
    return { vacated: true, error: error ?? undefined };
  }

  const { error } = await supabase.from("patients").delete().eq("id", id);
  return { vacated: false, error: error ?? undefined };
}
