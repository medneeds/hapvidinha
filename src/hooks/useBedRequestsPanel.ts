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

import { classifySla, SlaLevel, SLA_DEFAULTS, useBedSlaConfigs } from "./useBedSlaConfigs";

export interface StageEval {
  elapsedMin: number | null;
  slaMinutes: number;
  warningPct: number;
  level: SlaLevel; // ok | warning | late | pending | in_progress
  done: boolean;
}

export type SlaResolver = (
  sector: string | null | undefined,
  stage: "hotelaria" | "leito" | "transferencia"
) => { sla_minutes: number; warning_pct: number };

const defaultResolver: SlaResolver = (_s, stage) => ({
  sla_minutes: SLA_DEFAULTS[stage],
  warning_pct: 80,
});

export function getRequestStatusInfo(r: PanelRequest, resolver: SlaResolver = defaultResolver) {
  const sector = r.requested_sector;
  const now = new Date().toISOString();

  // Hotelaria: from request to hotelaria_released_at
  const hotelStart = r.hotelaria_requested_at ?? r.created_at;
  const hotelEnd = r.hotelaria_released_at;
  const hotelMin = diffMinutes(hotelStart, hotelEnd ?? now);
  const hotelCfg = resolver(sector, "hotelaria");
  const hotelStage: StageEval = {
    elapsedMin: hotelEnd ? diffMinutes(hotelStart, hotelEnd) : hotelMin,
    slaMinutes: hotelCfg.sla_minutes,
    warningPct: hotelCfg.warning_pct,
    level: hotelEnd
      ? classifySla(diffMinutes(hotelStart, hotelEnd), hotelCfg.sla_minutes, hotelCfg.warning_pct)
      : (hotelMin === null ? "pending" : (classifySla(hotelMin, hotelCfg.sla_minutes, hotelCfg.warning_pct) === "late" ? "late" : "in_progress")),
    done: !!hotelEnd,
  };

  // Leito: from hotelaria_released_at to bed_released_at
  const leitoStart = r.hotelaria_released_at;
  const leitoEnd = r.bed_released_at;
  const leitoCfg = resolver(sector, "leito");
  const leitoElapsed = leitoStart ? diffMinutes(leitoStart, leitoEnd ?? now) : null;
  const leitoStage: StageEval = {
    elapsedMin: leitoStart ? diffMinutes(leitoStart, leitoEnd ?? now) : null,
    slaMinutes: leitoCfg.sla_minutes,
    warningPct: leitoCfg.warning_pct,
    level: !leitoStart
      ? "pending"
      : leitoEnd
        ? classifySla(diffMinutes(leitoStart, leitoEnd), leitoCfg.sla_minutes, leitoCfg.warning_pct)
        : (classifySla(leitoElapsed, leitoCfg.sla_minutes, leitoCfg.warning_pct) === "late" ? "late" : "in_progress"),
    done: !!leitoEnd,
  };

  // Transferência: from bed_released_at to transfer_completed_at
  const trStart = r.bed_released_at;
  const trEnd = r.transfer_completed_at;
  const trCfg = resolver(sector, "transferencia");
  const trElapsed = trStart ? diffMinutes(trStart, trEnd ?? now) : null;
  const transferStage: StageEval = {
    elapsedMin: trStart ? diffMinutes(trStart, trEnd ?? now) : null,
    slaMinutes: trCfg.sla_minutes,
    warningPct: trCfg.warning_pct,
    level: !trStart
      ? "pending"
      : trEnd
        ? classifySla(diffMinutes(trStart, trEnd), trCfg.sla_minutes, trCfg.warning_pct)
        : (classifySla(trElapsed, trCfg.sla_minutes, trCfg.warning_pct) === "late" ? "late" : "in_progress"),
    done: !!trEnd,
  };

  const transferMin = trStart && trEnd ? diffMinutes(trStart, trEnd) : null;
  const totalMin = diffMinutes(r.created_at, r.transfer_completed_at);
  const completed = !!r.transfer_completed_at;
  const onTime =
    completed &&
    hotelStage.level !== "late" &&
    leitoStage.level !== "late" &&
    transferStage.level !== "late";

  return {
    hotelMin: hotelEnd ? diffMinutes(hotelStart, hotelEnd) : null,
    transferMin,
    totalMin,
    completed,
    onTime,
    stages: { hotelaria: hotelStage, leito: leitoStage, transferencia: transferStage },
  };
}

export function useBedRequestsPanel() {
  const { currentHospital, currentState } = useHospital();
  const { currentDepartment } = useDepartment();
  const { getSla } = useBedSlaConfigs();
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

  const resolver: SlaResolver = useCallback((sector, stage) => getSla(sector, stage), [getSla]);

  const kpis: PanelKPIs = useMemo(() => {
    const total = requests.length;
    const pending = requests.filter((r) => r.status === "pending").length;
    const completed = requests.filter((r) => !!r.transfer_completed_at).length;
    const inProgress = total - completed - requests.filter((r) => r.status === "rejected").length;
    const isolation = requests.filter((r) => r.is_isolation).length;
    const hotelDeltas = requests.map((r) => diffMinutes(r.hotelaria_requested_at ?? r.created_at, r.hotelaria_released_at)).filter((v): v is number => v !== null);
    const transDeltas = requests.map((r) => diffMinutes(r.bed_released_at, r.transfer_completed_at)).filter((v): v is number => v !== null);
    const onTime = requests.filter((r) => getRequestStatusInfo(r, resolver).onTime).length;
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
  }, [requests, resolver]);

  const updateStage = async (id: string, patch: Partial<PanelRequest>) => {
    const { error } = await supabase.from("bed_allocation_requests").update(patch as any).eq("id", id);
    if (!error) await fetchAll();
    return !error;
  };

  return { requests, loading, kpis, refetch: fetchAll, updateStage, resolver };
}
