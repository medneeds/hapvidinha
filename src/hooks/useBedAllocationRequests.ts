import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useHospital } from "@/contexts/HospitalContext";
import { useDepartment } from "@/contexts/DepartmentContext";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";

export interface BedAllocationRequest {
  id: string;
  patient_id: string;
  requested_by: string;
  requested_sector: string;
  requested_bed: string | null;
  status: "pending" | "approved" | "discussing" | "rejected";
  rejection_reason: string | null;
  reviewed_by: string | null;
  reviewed_at: string | null;
  state_id: string;
  hospital_unit_id: string;
  department: string;
  created_at: string;
  updated_at: string;
  requesting_doctor_name: string | null;
  requesting_office_number: string | null;
  // Joined patient data
  patient?: {
    id: string;
    name: string;
    age: string | null;
    diagnoses: string | null;
    admission_history: string | null;
    bed_number: string;
    sector: string;
  };
}

export function useBedAllocationRequests() {
  const [requests, setRequests] = useState<BedAllocationRequest[]>([]);
  const [pendingCount, setPendingCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const { currentHospital, currentState } = useHospital();
  const { currentDepartment } = useDepartment();
  const { user } = useAuth();

  const fetchRequests = useCallback(async () => {
    if (!currentHospital?.id || !currentState?.id) return;

    try {
      const { data, error } = await supabase
        .from("bed_allocation_requests")
        .select(`
          *,
          patient:patients(id, name, age, diagnoses, admission_history, bed_number, sector)
        `)
        .eq("hospital_unit_id", currentHospital.id)
        .eq("state_id", currentState.id)
        .eq("department", currentDepartment)
        .order("created_at", { ascending: false });

      if (error) throw error;

      setRequests((data as unknown as BedAllocationRequest[]) || []);
      setPendingCount(data?.filter(r => r.status === "pending").length || 0);
    } catch (error) {
      console.error("Error fetching bed allocation requests:", error);
    } finally {
      setLoading(false);
    }
  }, [currentHospital?.id, currentState?.id, currentDepartment]);

  // Realtime subscription
  useEffect(() => {
    if (!currentHospital?.id) return;

    const channel = supabase
      .channel("bed-allocation-requests-realtime")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "bed_allocation_requests",
          filter: `hospital_unit_id=eq.${currentHospital.id}`,
        },
        (payload) => {
          console.log("Realtime update:", payload);
          fetchRequests();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [currentHospital?.id, fetchRequests]);

  useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);

  const createRequest = async (
    patientId: string, 
    requestedSector: string, 
    requestedBed?: string,
    doctorName?: string,
    officeNumber?: string
  ) => {
    if (!currentHospital?.id || !currentState?.id || !user?.id) {
      toast({
        title: "Erro",
        description: "Dados de contexto não disponíveis",
        variant: "destructive",
      });
      return null;
    }

    try {
      const { data, error } = await supabase
        .from("bed_allocation_requests")
        .insert({
          patient_id: patientId,
          requested_by: user.id,
          requested_sector: requestedSector,
          requested_bed: requestedBed || null,
          requesting_doctor_name: doctorName || null,
          requesting_office_number: officeNumber || null,
          state_id: currentState.id,
          hospital_unit_id: currentHospital.id,
          department: currentDepartment,
        })
        .select()
        .single();

      if (error) throw error;

      // Update patient allocation status
      await supabase
        .from("patients")
        .update({ allocation_status: "pending" })
        .eq("id", patientId);

      toast({
        title: "Solicitação enviada",
        description: "O líder será notificado sobre sua solicitação de alocação.",
      });

      return data;
    } catch (error) {
      console.error("Error creating bed allocation request:", error);
      toast({
        title: "Erro",
        description: "Falha ao enviar solicitação de alocação",
        variant: "destructive",
      });
      return null;
    }
  };

  const approveRequest = async (requestId: string) => {
    if (!user?.id) return false;

    try {
      // First try to find in local state, otherwise fetch from database
      let request = requests.find(r => r.id === requestId);
      
      if (!request) {
        // Fetch from database if not in local state
        const { data, error } = await supabase
          .from("bed_allocation_requests")
          .select("*")
          .eq("id", requestId)
          .single();
        
        if (error || !data) {
          throw new Error("Solicitação não encontrada");
        }
        request = data as unknown as BedAllocationRequest;
      }

      // Update request status
      const { error: updateError } = await supabase
        .from("bed_allocation_requests")
        .update({
          status: "approved",
          reviewed_by: user.id,
          reviewed_at: new Date().toISOString(),
        })
        .eq("id", requestId);

      if (updateError) throw updateError;

      // Move patient to official sector - map sector name to db sector value
      const sectorMap: Record<string, string> = {
        "Cuidados Especiais": "red",
        "Observação Amarela": "yellow",
        "Observação Azul": "blue",
      };
      const dbSector = sectorMap[request.requested_sector] || request.requested_sector;

      const { error: patientError } = await supabase
        .from("patients")
        .update({
          is_door_patient: false,
          allocation_status: "approved",
          sector: dbSector,
        })
        .eq("id", request.patient_id);

      if (patientError) throw patientError;

      toast({
        title: "Alocação aprovada",
        description: "Paciente movido para o quadro oficial de leitos.",
      });

      return true;
    } catch (error) {
      console.error("Error approving request:", error);
      toast({
        title: "Erro",
        description: "Falha ao aprovar alocação",
        variant: "destructive",
      });
      return false;
    }
  };

  const setDiscussing = async (requestId: string) => {
    if (!user?.id) return false;

    try {
      const { error } = await supabase
        .from("bed_allocation_requests")
        .update({
          status: "discussing",
          reviewed_by: user.id,
          reviewed_at: new Date().toISOString(),
        })
        .eq("id", requestId);

      if (error) throw error;

      // Update patient allocation status
      const request = requests.find(r => r.id === requestId);
      if (request) {
        await supabase
          .from("patients")
          .update({ allocation_status: "discussing" })
          .eq("id", request.patient_id);
      }

      toast({
        title: "Aguardando discussão",
        description: "Médico da porta será notificado.",
      });

      return true;
    } catch (error) {
      console.error("Error setting discussing status:", error);
      toast({
        title: "Erro",
        description: "Falha ao atualizar status",
        variant: "destructive",
      });
      return false;
    }
  };

  const rejectRequest = async (requestId: string, reason?: string) => {
    if (!user?.id) return false;

    try {
      const { error } = await supabase
        .from("bed_allocation_requests")
        .update({
          status: "rejected",
          rejection_reason: reason || null,
          reviewed_by: user.id,
          reviewed_at: new Date().toISOString(),
        })
        .eq("id", requestId);

      if (error) throw error;

      // Update patient allocation status
      const request = requests.find(r => r.id === requestId);
      if (request) {
        await supabase
          .from("patients")
          .update({ allocation_status: "rejected" })
          .eq("id", request.patient_id);
      }

      toast({
        title: "Solicitação negada",
        description: "Médico da porta será notificado.",
      });

      return true;
    } catch (error) {
      console.error("Error rejecting request:", error);
      toast({
        title: "Erro",
        description: "Falha ao negar solicitação",
        variant: "destructive",
      });
      return false;
    }
  };

  return {
    requests,
    pendingCount,
    loading,
    createRequest,
    approveRequest,
    setDiscussing,
    rejectRequest,
    refetch: fetchRequests,
  };
}
