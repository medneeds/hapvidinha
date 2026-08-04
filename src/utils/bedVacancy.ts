import { supabase } from "@/integrations/supabase/client";
import { vacantPatientSlotPayload } from "@/utils/patientSlotPayload";
import { isWithinFixedRange } from "@/utils/bedCapacityStore";

/**
 * Returns true if the given (department, sector, bed_number) corresponds to a
 * FIXED-capacity slot that must NEVER be deleted (only vacated).
 * The quantity per sector is configured in the admin panel
 * (table `sector_bed_capacities`), with historical defaults as fallback.
 */
export function isFixedBed(
  department: string | null | undefined,
  sector: string | null | undefined,
  bedNumber: string | null | undefined,
): boolean {
  if (!sector || !bedNumber) return false;
  if (department === "UTI" && sector !== "blue" && sector !== "yellow") return false;
  return isWithinFixedRange(department, sector, bedNumber);
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
