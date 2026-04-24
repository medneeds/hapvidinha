import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useHospital } from "@/contexts/HospitalContext";
import { toast } from "sonner";

export type BedEventType =
  | "medical_discharge"
  | "administrative_discharge"
  | "bed_vacated"
  | "cleaning_started"
  | "cleaning_finished"
  | "bed_released"
  | "bed_occupied";

export const BED_EVENT_LABELS: Record<BedEventType, string> = {
  medical_discharge: "Alta médica",
  administrative_discharge: "Alta administrativa",
  bed_vacated: "Desocupação do leito",
  cleaning_started: "Início da preparação",
  cleaning_finished: "Finalização da preparação",
  bed_released: "Leito liberado",
  bed_occupied: "Leito ocupado",
};

export const BED_EVENT_ORDER: BedEventType[] = [
  "medical_discharge",
  "administrative_discharge",
  "bed_vacated",
  "cleaning_started",
  "cleaning_finished",
  "bed_released",
  "bed_occupied",
];

export interface BedLifecycleEvent {
  id: string;
  hospital_unit_id: string;
  state_id: string;
  department: string | null;
  bed_number: string;
  sector: string | null;
  patient_id: string | null;
  patient_name: string | null;
  event_type: BedEventType;
  event_at: string;
  registered_by: string | null;
  registered_by_name: string | null;
  notes: string | null;
  cycle_id: string | null;
  created_at: string;
}

export function useBedLifecycle() {
  const { user } = useAuth();
  const { currentHospital, currentState } = useHospital();
  const [events, setEvents] = useState<BedLifecycleEvent[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchEvents = useCallback(async () => {
    if (!currentHospital || !currentState) return;
    setLoading(true);
    const { data, error } = await supabase
      .from("bed_lifecycle_events")
      .select("*")
      .eq("hospital_unit_id", currentHospital.id)
      .eq("state_id", currentState.id)
      .order("event_at", { ascending: false })
      .limit(500);

    if (error) {
      console.error(error);
      toast.error("Erro ao carregar eventos");
    } else {
      setEvents((data || []) as BedLifecycleEvent[]);
    }
    setLoading(false);
  }, [currentHospital, currentState]);

  useEffect(() => {
    fetchEvents();
    if (!currentHospital) return;
    const channel = supabase
      .channel("bed_lifecycle_changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "bed_lifecycle_events" },
        () => fetchEvents()
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchEvents, currentHospital]);

  const registerEvent = async (
    payload: Omit<
      BedLifecycleEvent,
      | "id"
      | "created_at"
      | "event_at"
      | "registered_by"
      | "registered_by_name"
      | "hospital_unit_id"
      | "state_id"
    > & { event_at?: string; cycle_id?: string | null }
  ) => {
    if (!user || !currentHospital || !currentState) return false;
    const registeredName =
      user.email?.split("@")[0]?.toUpperCase() || "OPERADOR";
    const { error } = await supabase.from("bed_lifecycle_events").insert({
      ...payload,
      event_at: payload.event_at || new Date().toISOString(),
      hospital_unit_id: currentHospital.id,
      state_id: currentState.id,
      registered_by: user.id,
      registered_by_name: registeredName,
    });
    if (error) {
      toast.error("Erro ao registrar evento: " + error.message);
      return false;
    }
    toast.success(`${BED_EVENT_LABELS[payload.event_type]} registrada`);
    return true;
  };

  return { events, loading, registerEvent, refetch: fetchEvents };
}
