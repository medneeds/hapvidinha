import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useHospital } from "@/contexts/HospitalContext";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export type BedStatus =
  | "occupied"
  | "medical_discharge"
  | "admin_discharge"
  | "vacated_dirty"
  | "cleaning_in_progress"
  | "cleaning_done"
  | "available"
  | "reserved"
  | "blocked";

export const BED_STATUS_LABELS: Record<BedStatus, string> = {
  occupied: "Ocupado",
  medical_discharge: "Alta médica",
  admin_discharge: "Alta administrativa",
  vacated_dirty: "Vago sujo",
  cleaning_in_progress: "Em higienização",
  cleaning_done: "Limpeza concluída",
  available: "Disponível",
  reserved: "Reservado",
  blocked: "Bloqueado",
};

export const BED_STATUS_COLORS: Record<BedStatus, string> = {
  occupied: "bg-blue-500/15 text-blue-700 border-blue-300 dark:text-blue-300",
  medical_discharge: "bg-amber-500/15 text-amber-700 border-amber-300 dark:text-amber-300",
  admin_discharge: "bg-orange-500/15 text-orange-700 border-orange-300 dark:text-orange-300",
  vacated_dirty: "bg-rose-500/15 text-rose-700 border-rose-300 dark:text-rose-300",
  cleaning_in_progress: "bg-cyan-500/15 text-cyan-700 border-cyan-300 dark:text-cyan-300",
  cleaning_done: "bg-teal-500/15 text-teal-700 border-teal-300 dark:text-teal-300",
  available: "bg-emerald-500/15 text-emerald-700 border-emerald-300 dark:text-emerald-300",
  reserved: "bg-violet-500/15 text-violet-700 border-violet-300 dark:text-violet-300",
  blocked: "bg-zinc-500/15 text-zinc-700 border-zinc-300 dark:text-zinc-300",
};

export interface ManagedBed {
  id: string;
  hospital_unit_id: string;
  state_id: string;
  sector: string;
  bed_number: string;
  bed_type: string;
  current_status: BedStatus;
  current_patient_name: string | null;
  current_patient_id: string | null;
  current_cycle_id: string | null;
  status_changed_at: string;
  is_blocked: boolean;
  block_reason: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export function useManagedBeds() {
  const { currentHospital, currentState } = useHospital();
  const { user } = useAuth();
  const [beds, setBeds] = useState<ManagedBed[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchBeds = useCallback(async () => {
    if (!currentHospital || !currentState) return;
    setLoading(true);
    const { data, error } = await supabase
      .from("managed_beds")
      .select("*")
      .eq("hospital_unit_id", currentHospital.id)
      .eq("state_id", currentState.id)
      .order("sector", { ascending: true })
      .order("bed_number", { ascending: true });
    if (error) {
      console.error(error);
      toast.error("Erro ao carregar leitos");
    } else {
      setBeds((data || []) as ManagedBed[]);
    }
    setLoading(false);
  }, [currentHospital, currentState]);

  useEffect(() => {
    fetchBeds();
    if (!currentHospital) return;
    const channel = supabase
      .channel("managed_beds_changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "managed_beds" },
        () => fetchBeds()
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchBeds, currentHospital]);

  const createBed = async (payload: {
    sector: string;
    bed_number: string;
    bed_type?: string;
    notes?: string;
  }) => {
    if (!user || !currentHospital || !currentState) return false;
    const { error } = await supabase.from("managed_beds").insert({
      hospital_unit_id: currentHospital.id,
      state_id: currentState.id,
      sector: payload.sector.toUpperCase(),
      bed_number: payload.bed_number.toUpperCase(),
      bed_type: payload.bed_type || "enfermaria",
      notes: payload.notes,
      created_by: user.id,
    });
    if (error) {
      toast.error("Erro ao cadastrar leito: " + error.message);
      return false;
    }
    toast.success("Leito cadastrado");
    return true;
  };

  const updateBedStatus = async (
    id: string,
    next_status: BedStatus,
    extra?: Partial<ManagedBed>
  ) => {
    const { error } = await supabase
      .from("managed_beds")
      .update({
        current_status: next_status,
        status_changed_at: new Date().toISOString(),
        ...extra,
      })
      .eq("id", id);
    if (error) {
      toast.error("Erro ao atualizar status: " + error.message);
      return false;
    }
    return true;
  };

  const deleteBed = async (id: string) => {
    const { error } = await supabase.from("managed_beds").delete().eq("id", id);
    if (error) {
      toast.error("Erro ao excluir leito: " + error.message);
      return false;
    }
    toast.success("Leito excluído");
    return true;
  };

  return { beds, loading, createBed, updateBedStatus, deleteBed, refetch: fetchBeds };
}
