import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useHospital } from "@/contexts/HospitalContext";
import { toast } from "sonner";

export type TransportStatus = "pending" | "accepted" | "in_progress" | "completed" | "cancelled";
export type TransportPriority = "low" | "normal" | "high" | "urgent";
export type TransportType = "patient" | "general";

export interface TransportRequest {
  id: string;
  hospital_unit_id: string;
  state_id: string;
  department: string | null;
  request_type: TransportType;
  patient_id: string | null;
  patient_name: string | null;
  patient_bed: string | null;
  origin: string;
  destination: string;
  description: string | null;
  priority: TransportPriority;
  status: TransportStatus;
  requested_by: string | null;
  requested_by_name: string | null;
  assigned_to: string | null;
  assigned_to_name: string | null;
  accepted_at: string | null;
  started_at: string | null;
  completed_at: string | null;
  cancelled_at: string | null;
  cancellation_reason: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export function useTransportRequests() {
  const { user } = useAuth();
  const { currentHospital, currentState } = useHospital();
  const [requests, setRequests] = useState<TransportRequest[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchRequests = useCallback(async () => {
    if (!currentHospital || !currentState) return;
    setLoading(true);
    const { data, error } = await supabase
      .from("transport_requests")
      .select("*")
      .eq("hospital_unit_id", currentHospital.id)
      .eq("state_id", currentState.id)
      .order("created_at", { ascending: false });

    if (error) {
      console.error(error);
      toast.error("Erro ao carregar chamados");
    } else {
      setRequests((data || []) as TransportRequest[]);
    }
    setLoading(false);
  }, [currentHospital, currentState]);

  useEffect(() => {
    fetchRequests();

    if (!currentHospital) return;
    const channel = supabase
      .channel("transport_requests_changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "transport_requests" },
        () => fetchRequests()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchRequests, currentHospital]);

  const createRequest = async (
    payload: Omit<
      TransportRequest,
      | "id"
      | "created_at"
      | "updated_at"
      | "status"
      | "requested_by"
      | "accepted_at"
      | "started_at"
      | "completed_at"
      | "cancelled_at"
      | "cancellation_reason"
      | "assigned_to"
      | "assigned_to_name"
      | "hospital_unit_id"
      | "state_id"
    >
  ) => {
    if (!user || !currentHospital || !currentState) return;
    const { error } = await supabase.from("transport_requests").insert({
      ...payload,
      hospital_unit_id: currentHospital.id,
      state_id: currentState.id,
      requested_by: user.id,
      status: "pending",
    });
    if (error) {
      toast.error("Erro ao criar chamado: " + error.message);
      return false;
    }
    toast.success("Chamado criado");
    return true;
  };

  const updateStatus = async (
    id: string,
    status: TransportStatus,
    extra?: Partial<TransportRequest>
  ) => {
    if (!user) return;
    const now = new Date().toISOString();
    const updates: Partial<TransportRequest> = { status, ...extra };
    if (status === "accepted") {
      updates.accepted_at = now;
      updates.assigned_to = user.id;
      if (!updates.assigned_to_name) {
        updates.assigned_to_name = user.email?.split("@")[0]?.toUpperCase() || "CONDUTOR";
      }
    }
    if (status === "in_progress") updates.started_at = now;
    if (status === "completed") updates.completed_at = now;
    if (status === "cancelled") updates.cancelled_at = now;

    const { error } = await supabase
      .from("transport_requests")
      .update(updates)
      .eq("id", id);
    if (error) {
      toast.error("Erro ao atualizar: " + error.message);
      return false;
    }
    return true;
  };

  return { requests, loading, createRequest, updateStatus, refetch: fetchRequests };
}
