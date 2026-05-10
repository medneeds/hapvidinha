import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useHospital } from "@/contexts/HospitalContext";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export type BedRequestType = "uti" | "enfermaria" | "transporte";
export type BedRequestStatus =
  | "pending"
  | "accepted"
  | "in_progress"
  | "completed"
  | "cancelled";
export type BedRequestPriority = "low" | "normal" | "high" | "urgent";

export interface BedRequest {
  id: string;
  hospital_unit_id: string;
  state_id: string;
  request_type: BedRequestType;
  status: BedRequestStatus;
  priority: BedRequestPriority;
  patient_name: string;
  patient_age: string | null;
  origin_sector: string | null;
  origin_bed: string | null;
  destination_sector: string | null;
  destination_bed: string | null;
  target_bed_id: string | null;
  clinical_summary: string | null;
  notes: string | null;
  requested_by: string | null;
  requested_by_name: string | null;
  accepted_by: string | null;
  accepted_by_name: string | null;
  accepted_at: string | null;
  started_at: string | null;
  completed_at: string | null;
  cancelled_at: string | null;
  cancellation_reason: string | null;
  created_at: string;
  updated_at: string;
}

export const REQUEST_TYPE_LABELS: Record<BedRequestType, string> = {
  uti: "UTI",
  enfermaria: "Enfermaria",
  transporte: "Transporte / Condutor",
};

export const PRIORITY_LABELS: Record<BedRequestPriority, string> = {
  low: "Baixa",
  normal: "Normal",
  high: "Alta",
  urgent: "Urgente",
};

export function useBedRequests() {
  const { currentHospital, currentState } = useHospital();
  const { user } = useAuth();
  const [requests, setRequests] = useState<BedRequest[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchRequests = useCallback(async () => {
    if (!currentHospital || !currentState) return;
    setLoading(true);
    const { data, error } = await supabase
      .from("bed_requests")
      .select("*")
      .eq("hospital_unit_id", currentHospital.id)
      .eq("state_id", currentState.id)
      .order("created_at", { ascending: false })
      .limit(300);
    if (error) {
      console.error(error);
      toast.error("Erro ao carregar solicitações");
    } else {
      setRequests((data || []) as BedRequest[]);
    }
    setLoading(false);
  }, [currentHospital, currentState]);

  useEffect(() => {
    fetchRequests();
    if (!currentHospital) return;
    const channel = supabase
      .channel("bed_requests_changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "bed_requests" },
        () => fetchRequests()
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchRequests, currentHospital]);

  const createRequest = async (payload: {
    request_type: BedRequestType;
    priority?: BedRequestPriority;
    patient_name: string;
    patient_age?: string;
    origin_sector?: string;
    destination_sector?: string;
    destination_bed?: string;
    clinical_summary?: string;
    notes?: string;
  }) => {
    if (!user || !currentHospital || !currentState) return false;
    const requested_by_name =
      user.email?.split("@")[0]?.toUpperCase() || "OPERADOR";
    const { error } = await supabase.from("bed_requests").insert({
      hospital_unit_id: currentHospital.id,
      state_id: currentState.id,
      request_type: payload.request_type,
      priority: payload.priority || "normal",
      patient_name: payload.patient_name.toUpperCase(),
      patient_age: payload.patient_age,
      origin_sector: payload.origin_sector?.toUpperCase(),
      destination_sector: payload.destination_sector?.toUpperCase(),
      destination_bed: payload.destination_bed?.toUpperCase(),
      clinical_summary: payload.clinical_summary?.toUpperCase(),
      notes: payload.notes?.toUpperCase(),
      requested_by: user.id,
      requested_by_name,
      status: "pending",
    });
    if (error) {
      toast.error("Erro ao criar solicitação: " + error.message);
      return false;
    }
    toast.success("Solicitação criada");
    return true;
  };

  const updateRequestStatus = async (
    id: string,
    next_status: BedRequestStatus,
    extra?: Partial<BedRequest>
  ) => {
    if (!user) return false;
    const now = new Date().toISOString();
    const updates: Partial<BedRequest> = { status: next_status, ...extra };
    const acceptedName =
      user.email?.split("@")[0]?.toUpperCase() || "OPERADOR";
    if (next_status === "accepted") {
      updates.accepted_at = now;
      updates.accepted_by = user.id;
      updates.accepted_by_name = acceptedName;
    }
    if (next_status === "in_progress") updates.started_at = now;
    if (next_status === "completed") updates.completed_at = now;
    if (next_status === "cancelled") updates.cancelled_at = now;
    const { error } = await supabase
      .from("bed_requests")
      .update(updates)
      .eq("id", id);
    if (error) {
      toast.error("Erro ao atualizar: " + error.message);
      return false;
    }
    return true;
  };

  return {
    requests,
    loading,
    createRequest,
    updateRequestStatus,
    refetch: fetchRequests,
  };
}
