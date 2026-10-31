import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useHospital } from "@/contexts/HospitalContext";
import { mapTransitRow, type TransitPatient } from "@/utils/utiTransit";

/** Patients waiting in the UTI "Em trânsito · Aguardando alocação" area of the current hospital. */
export function useUtiTransitPatients(enabled = true) {
  const { currentHospital, currentState } = useHospital();
  const [transitPatients, setTransitPatients] = useState<TransitPatient[]>([]);

  const refetch = useCallback(async () => {
    if (!enabled || !currentHospital?.id || !currentState?.id) return;
    const { data, error } = await supabase
      .from("patients")
      .select("*")
      .eq("department", "UTI")
      .eq("sector", "outside")
      .not("transit_target_unit", "is", null)
      .eq("hospital_unit_id", currentHospital.id)
      .eq("state_id", currentState.id);
    if (error) {
      console.error("[useUtiTransitPatients]", error);
      return;
    }
    setTransitPatients((data || []).map(mapTransitRow));
  }, [enabled, currentHospital?.id, currentState?.id]);

  useEffect(() => {
    refetch();
  }, [refetch]);

  useEffect(() => {
    if (!enabled || !currentHospital?.id) return;
    const channel = supabase
      .channel(`uti-transit-${currentHospital.id}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "patients", filter: `hospital_unit_id=eq.${currentHospital.id}` },
        () => refetch()
      )
      .subscribe();
    const interval = window.setInterval(refetch, 45000);
    const onFocus = () => refetch();
    window.addEventListener("focus", onFocus);
    return () => {
      supabase.removeChannel(channel);
      window.clearInterval(interval);
      window.removeEventListener("focus", onFocus);
    };
  }, [enabled, currentHospital?.id, refetch]);

  const allocate = useCallback(async (transitId: string, bedId: string) => {
    const { data, error } = await supabase.rpc("allocate_uti_transit_patient", {
      p_transit_id: transitId,
      p_target_bed_id: bedId,
    });
    await refetch();
    return { data: data as { target_bed?: string; unit?: string } | null, error };
  }, [refetch]);

  const setDiscussing = useCallback(async (transitId: string, discussing: boolean) => {
    setTransitPatients((prev) => prev.map((p) => (p.id === transitId ? { ...p, allocationStatus: discussing ? "discussing" : "pending" } : p)));
    const { error } = await supabase
      .from("patients")
      .update({ allocation_status: discussing ? "discussing" : "pending" })
      .eq("id", transitId);
    if (error) await refetch();
    return { error };
  }, [refetch]);

  return { transitPatients, refetch, allocate, setDiscussing };
}
