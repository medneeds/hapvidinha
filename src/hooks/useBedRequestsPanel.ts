import { useEffect, useState, useCallback, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useHospital } from "@/contexts/HospitalContext";
import { useDepartment } from "@/contexts/DepartmentContext";

export interface PanelRequest {
  id: string;
  sequence_number: number | null;
  created_at: string;
  patient_name: string | null;
  patient_id: string | null;
  diagnosis: string | null;
  is_isolation: boolean;
  requesting_sector: string | null;
  requesting_doctor_name: string | null;
  requesting_office_number: string | null;
  requested_sector: string;
  requested_bed: string | null;
  accommodation_type: string | null;
  status: string;
  hotelaria_requested_at: string | null;
  hotelaria_released_at: string | null;
  hotelaria_released_by: string | null;
  bed_released_at: string | null;
  bed_released_by: string | null;
  transfer_started_at: string | null;
  transfer_completed_at: string | null;
  non_compliance_reason: string | null;
  rejection_reason: string | null;
  reviewed_at: string | null;
}

export interface PanelKPIs {
  total: number;
  pending: number;
  inProgress: number;
  completed: number;
  isolation: number;
  avgHotelariaMin: number | null;
  avgTransferMin: number | null;
  onTimePct: number;
}

export type StageStatus = "pending" | "in_progress" | "ok" | "late" | "skipped";

export function diffMinutes(a?: string | null, b?: string | null): number | null {
  if (!a || !b) return null;
  const ms = new Date(b).getTime() - new Date(a).getTime();
  if (isNaN(ms)) return null;
  return Math.max(0, Math.round(ms / 60000));
}

export function formatHHMM(min: number | null): string {
  if (min === null || min === undefined) return "—";
  const h = Math.floor(min / 60);
  const m = min % 60;
  return `${String(h).padStart(1, "0")}:${String(m).padStart(2, "0")}`;
}

const HOTEL_SLA = 60; // minutos
const TRANSFER_SLA = 90;

export function getRequestStatusInfo(r: PanelRequest) {
  const hotelMin = diffMinutes(r.hotelaria_requested_at ?? r.created_at, r.hotelaria_released_at);
  const transferMin = diffMinutes(r.bed_released_at, r.transfer_completed_at);
  const totalMin = diffMinutes(r.created_at, r.transfer_completed_at);
  const completed = !!r.transfer_completed_at;
  const onTime = completed && (totalMin ?? 0) <= HOTEL_SLA + TRANSFER_SLA;
  return { hotelMin, transferMin, totalMin, completed, onTime };
}

export function useBedRequestsPanel() {
  const { currentHospital, currentState } = useHospital();
  const { currentDepartment } = useDepartment();
  const [requests, setRequests] = useState<PanelRequest[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAll = useCallback(async () => {
    if (!currentHospital?.id || !currentState?.id) return;
    setLoading(true);
    const { data, error } = await supabase
      .from("bed_allocation_requests")
      .select("*")
      .eq("hospital_unit_id", currentHospital.id)
      .eq("state_id", currentState.id)
      .eq("department", currentDepartment)
      .order("created_at", { ascending: false })
      .limit(500);
    if (!error && data) setRequests(data as any as PanelRequest[]);
    setLoading(false);
  }, [currentHospital?.id, currentState?.id, currentDepartment]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  useEffect(() => {
    if (!currentHospital?.id) return;
    const ch = supabase
      .channel("bed-panel-rt")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "bed_allocation_requests", filter: `hospital_unit_id=eq.${currentHospital.id}` },
        () => fetchAll()
      )
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [currentHospital?.id, fetchAll]);

  const kpis: PanelKPIs = useMemo(() => {
    const total = requests.length;
    const pending = requests.filter((r) => r.status === "pending").length;
    const completed = requests.filter((r) => !!r.transfer_completed_at).length;
    const inProgress = total - completed - requests.filter((r) => r.status === "rejected").length;
    const isolation = requests.filter((r) => r.is_isolation).length;
    const hotelDeltas = requests.map((r) => diffMinutes(r.hotelaria_requested_at ?? r.created_at, r.hotelaria_released_at)).filter((v): v is number => v !== null);
    const transDeltas = requests.map((r) => diffMinutes(r.bed_released_at, r.transfer_completed_at)).filter((v): v is number => v !== null);
    const onTime = requests.filter((r) => getRequestStatusInfo(r).onTime).length;
    return {
      total,
      pending,
      inProgress: Math.max(0, inProgress),
      completed,
      isolation,
      avgHotelariaMin: hotelDeltas.length ? Math.round(hotelDeltas.reduce((a, b) => a + b, 0) / hotelDeltas.length) : null,
      avgTransferMin: transDeltas.length ? Math.round(transDeltas.reduce((a, b) => a + b, 0) / transDeltas.length) : null,
      onTimePct: completed ? Math.round((onTime / completed) * 100) : 0,
    };
  }, [requests]);

  const updateStage = async (id: string, patch: Partial<PanelRequest>) => {
    const { error } = await supabase.from("bed_allocation_requests").update(patch as any).eq("id", id);
    if (!error) await fetchAll();
    return !error;
  };

  return { requests, loading, kpis, refetch: fetchAll, updateStage };
}
