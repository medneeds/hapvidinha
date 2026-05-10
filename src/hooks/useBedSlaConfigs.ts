import { useCallback, useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useHospital } from "@/contexts/HospitalContext";

export type SlaStage = "hotelaria" | "leito" | "transferencia";
export const SLA_STAGES: { key: SlaStage; label: string }[] = [
  { key: "hotelaria", label: "LIBERAÇÃO HOTELARIA" },
  { key: "leito", label: "LIBERAÇÃO LEITO" },
  { key: "transferencia", label: "TRANSFERÊNCIA" },
];

export const SLA_DEFAULTS: Record<SlaStage, number> = {
  hotelaria: 60,
  leito: 30,
  transferencia: 90,
};
export const WILDCARD_SECTOR = "*";

export interface SlaConfig {
  id: string;
  sector: string;
  stage: SlaStage;
  sla_minutes: number;
  warning_pct: number;
  hospital_unit_id: string;
  state_id: string;
}

export type SlaLevel = "ok" | "warning" | "late" | "pending" | "in_progress";

export function useBedSlaConfigs() {
  const { currentHospital, currentState } = useHospital();
  const [configs, setConfigs] = useState<SlaConfig[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAll = useCallback(async () => {
    if (!currentHospital?.id || !currentState?.id) return;
    setLoading(true);
    const { data } = await supabase
      .from("bed_sla_configs")
      .select("*")
      .eq("hospital_unit_id", currentHospital.id)
      .eq("state_id", currentState.id);
    setConfigs((data ?? []) as any);
    setLoading(false);
  }, [currentHospital?.id, currentState?.id]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const getSla = useCallback(
    (sector: string | null | undefined, stage: SlaStage) => {
      const s = (sector ?? "").trim();
      const exact = configs.find((c) => c.stage === stage && c.sector === s);
      const wildcard = configs.find((c) => c.stage === stage && c.sector === WILDCARD_SECTOR);
      const cfg = exact ?? wildcard;
      return {
        sla_minutes: cfg?.sla_minutes ?? SLA_DEFAULTS[stage],
        warning_pct: cfg?.warning_pct ?? 80,
      };
    },
    [configs]
  );

  const upsert = async (row: Omit<SlaConfig, "id"> & { id?: string }) => {
    if (!currentHospital?.id || !currentState?.id) return false;
    const payload = {
      ...row,
      hospital_unit_id: currentHospital.id,
      state_id: currentState.id,
    };
    const existing = configs.find(
      (c) => c.sector === row.sector && c.stage === row.stage
    );
    const { error } = existing
      ? await supabase.from("bed_sla_configs").update(payload).eq("id", existing.id)
      : await supabase.from("bed_sla_configs").insert(payload);
    if (!error) await fetchAll();
    return !error;
  };

  const remove = async (id: string) => {
    const { error } = await supabase.from("bed_sla_configs").delete().eq("id", id);
    if (!error) await fetchAll();
    return !error;
  };

  const sectors = useMemo(
    () => Array.from(new Set(configs.map((c) => c.sector))),
    [configs]
  );

  return { configs, loading, getSla, upsert, remove, refetch: fetchAll, sectors };
}

/**
 * Classify elapsed time vs SLA: ok (verde), warning (âmbar), late (vermelho).
 */
export function classifySla(
  elapsedMin: number | null,
  slaMinutes: number,
  warningPct: number
): SlaLevel {
  if (elapsedMin === null || elapsedMin === undefined) return "pending";
  const warnAt = (slaMinutes * warningPct) / 100;
  if (elapsedMin > slaMinutes) return "late";
  if (elapsedMin >= warnAt) return "warning";
  return "ok";
}
