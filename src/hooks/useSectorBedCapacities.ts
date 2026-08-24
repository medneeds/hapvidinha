import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useHospital } from "@/contexts/HospitalContext";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import {
  CapacityRow,
  setCapacityRows,
  getBedPrefix,
  getDefaultFixedBedCount,
} from "@/utils/bedCapacityStore";

export interface SectorBedCapacity extends CapacityRow {
  id: string;
}

export function useSectorBedCapacities() {
  const { currentHospital, currentState } = useHospital();
  const { user } = useAuth();
  const [capacities, setCapacities] = useState<SectorBedCapacity[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchCapacities = useCallback(async () => {
    if (!currentHospital || !currentState) return;
    setLoading(true);
    const { data, error } = await supabase
      .from("sector_bed_capacities")
      .select("id, department, sector, bed_prefix, fixed_bed_count")
      .eq("hospital_unit_id", currentHospital.id)
      .eq("state_id", currentState.id);
    if (error) {
      console.error("[useSectorBedCapacities]", error);
    } else {
      const rows = (data || []) as SectorBedCapacity[];
      setCapacities(rows);
      setCapacityRows(rows);
    }
    setLoading(false);
  }, [currentHospital, currentState]);

  useEffect(() => {
    fetchCapacities();
  }, [fetchCapacities]);

  const saveCapacity = async (department: string, sector: string, count: number) => {
    if (!currentHospital || !currentState) return false;
    const { error } = await supabase.from("sector_bed_capacities").upsert(
      {
        hospital_unit_id: currentHospital.id,
        state_id: currentState.id,
        department,
        sector,
        bed_prefix: getBedPrefix(department, sector),
        fixed_bed_count: count,
        updated_by: user?.id ?? null,
      },
      { onConflict: "hospital_unit_id,state_id,department,sector" },
    );
    if (error) {
      toast.error("Erro ao salvar quantitativo: " + error.message);
      return false;
    }
    await fetchCapacities();
    window.dispatchEvent(new CustomEvent("hapmap:bed-capacity-updated"));
    return true;

  };

  const getCount = (department: string, sector: string) =>
    capacities.find((c) => c.department === department && c.sector === sector)?.fixed_bed_count ??
    getDefaultFixedBedCount(department, sector);

  return { capacities, loading, saveCapacity, getCount, refetch: fetchCapacities };
}
