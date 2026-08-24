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
    if (!currentHospital || !currentState) {
      toast.error("Unidade/estado ainda não carregados. Recarregue a página e tente novamente.");
      return false;
    }

    const payload = {
      hospital_unit_id: currentHospital.id,
      state_id: currentState.id,
      department,
      sector,
      bed_prefix: getBedPrefix(department, sector),
      fixed_bed_count: count,
      updated_by: user?.id ?? null,
    };

    // 1) tenta upsert pela chave única
    let { error } = await supabase
      .from("sector_bed_capacities")
      .upsert(payload, { onConflict: "hospital_unit_id,state_id,department,sector" });

    // 2) fallback: update explícito e, se não existir linha, insert
    if (error) {
      console.error("[useSectorBedCapacities] upsert falhou:", error);
      const upd = await supabase
        .from("sector_bed_capacities")
        .update({
          fixed_bed_count: count,
          bed_prefix: payload.bed_prefix,
          updated_by: payload.updated_by,
        })
        .eq("hospital_unit_id", currentHospital.id)
        .eq("state_id", currentState.id)
        .eq("department", department)
        .eq("sector", sector)
        .select("id");

      if (upd.error) {
        error = upd.error;
      } else if (!upd.data || upd.data.length === 0) {
        const ins = await supabase.from("sector_bed_capacities").insert(payload);
        error = ins.error ?? null;
      } else {
        error = null;
      }
    }

    if (error) {
      toast.error("Erro ao salvar quantitativo: " + error.message);
      return false;
    }

    // Confirma persistência real no banco antes de declarar sucesso
    const { data: check } = await supabase
      .from("sector_bed_capacities")
      .select("fixed_bed_count")
      .eq("hospital_unit_id", currentHospital.id)
      .eq("state_id", currentState.id)
      .eq("department", department)
      .eq("sector", sector)
      .maybeSingle();

    if (!check || check.fixed_bed_count !== count) {
      toast.error("O quantitativo não foi persistido. Verifique sua permissão de administrador.");
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
