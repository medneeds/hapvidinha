import { supabase } from "@/integrations/supabase/client";
import { vacantPatientSlotPayload } from "@/utils/patientSlotPayload";

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
  if (sector === "red") return /^V0[1-2]$/.test(bedNumber);
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
      .update(vacantPatientSlotPayload)
      .eq("id", id);
    return { vacated: true, error: error ?? undefined };
  }

  const { error } = await supabase.from("patients").delete().eq("id", id);
  return { vacated: false, error: error ?? undefined };
}
