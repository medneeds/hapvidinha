import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useHospital } from "@/contexts/HospitalContext";
import { useDepartment } from "@/contexts/DepartmentContext";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";
import { getNextBedNumber } from "@/utils/bedNaming";

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
    medical_history: string | null;
    relevant_exams: string | null;
    pendencies: string | null;
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
          patient:patients(id, name, age, diagnoses, medical_history, relevant_exams, pendencies, admission_history, bed_number, sector)
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
      // Hidrata campos do painel a partir do paciente
      const { data: pat } = await supabase
        .from("patients")
        .select("name, diagnoses, sector")
        .eq("id", patientId)
        .maybeSingle();

      const accommodation = /UTI/i.test(requestedSector)
        ? "UTI"
        : /APT|APARTAMENTO/i.test(requestedSector)
        ? "APT"
        : "ENFERM";

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
          patient_name: pat?.name?.toUpperCase() || null,
          requesting_sector: pat?.sector || null,
          diagnosis: pat?.diagnoses?.toUpperCase() || null,
          accommodation_type: accommodation,
          hotelaria_requested_at: new Date().toISOString(),
        } as any)
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

  /**
   * Approve a Door allocation request.
   * @param requestId
   * @param overrideBedNumber If provided, allocates the patient to this exact bed (must already
   *        be free or be a vacant placeholder in the requested sector). When omitted, falls back
   *        to legacy auto-pick (lowest vacant → next regular → EXTRA).
   * @param overrideVacantPlaceholderId When the chosen bed corresponds to an existing vacant
   *        placeholder row, pass its id so it can be removed before the move.
   */
  const approveRequest = async (
    requestId: string,
    overrideBedNumber?: string,
    overrideVacantPlaceholderId?: string,
  ) => {
    if (!user?.id || !currentHospital?.id) return false;

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

      // Map sector name to db sector value
      const sectorMap: Record<string, string> = {
        "Cuidados Especiais": "red",
        "Observação Amarela": "yellow",
        "Observação Azul": "blue",
      };
      const dbSector = sectorMap[request.requested_sector] || request.requested_sector;

      // Look for existing beds in the destination sector
      const { data: existingPatients } = await supabase
        .from("patients")
        .select("id, bed_number, display_order, is_vacant")
        .eq("hospital_unit_id", currentHospital.id)
        .eq("department", currentDepartment)
        .eq("sector", dbSector);

      let maxDisplayOrder = 0;
      const occupiedBedNumbers: string[] = [];
      const vacantBeds: { id: string; bed_number: string; display_order: number | null }[] = [];
      if (existingPatients) {
        existingPatients.forEach((p: any) => {
          if (p.is_vacant) {
            vacantBeds.push({ id: p.id, bed_number: p.bed_number, display_order: p.display_order });
          } else {
            occupiedBedNumbers.push(p.bed_number);
          }
          if (p.display_order && p.display_order > maxDisplayOrder) {
            maxDisplayOrder = p.display_order;
          }
        });
      }

      let newBedNumber: string;
      let newDisplayOrder: number;
      let vacantTarget: { id: string; bed_number: string; display_order: number | null } | undefined;

      if (overrideBedNumber) {
        // Caller picked a specific bed via the popup. Validate it's not occupied.
        if (occupiedBedNumbers.includes(overrideBedNumber)) {
          throw new Error(`Leito ${overrideBedNumber} já está ocupado`);
        }
        newBedNumber = overrideBedNumber;
        vacantTarget =
          vacantBeds.find((v) => v.id === overrideVacantPlaceholderId) ||
          vacantBeds.find((v) => v.bed_number === overrideBedNumber);
        newDisplayOrder = vacantTarget?.display_order ?? maxDisplayOrder + 1;
      } else {
        // Legacy auto-pick: lowest vacant → next regular → EXTRA
        const sortedVacant = [...vacantBeds].sort((a, b) =>
          a.bed_number.localeCompare(b.bed_number, undefined, { numeric: true })
        );
        vacantTarget = sortedVacant[0];
        newBedNumber = vacantTarget
          ? vacantTarget.bed_number
          : getNextBedNumber(dbSector, occupiedBedNumbers, currentDepartment);
        newDisplayOrder = vacantTarget?.display_order ?? maxDisplayOrder + 1;
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

      // If reusing a vacant slot, remove the vacant placeholder row first to free its bed_number
      if (vacantTarget) {
        const { error: deleteVacantError } = await supabase
          .from("patients")
          .delete()
          .eq("id", vacantTarget.id);
        if (deleteVacantError) throw deleteVacantError;
      }

      // Move patient to official sector with the chosen bed number
      const { error: patientError } = await supabase
        .from("patients")
        .update({
          is_door_patient: false,
          allocation_status: "approved",
          sector: dbSector,
          bed_number: newBedNumber,
          display_order: newDisplayOrder,
          is_vacant: false,
        })
        .eq("id", request.patient_id);

      if (patientError) throw patientError;

      toast({
        title: "✓ Alocação aprovada",
        description: `Paciente alocado no leito ${newBedNumber} - ${request.requested_sector}.`,
      });

      // Trigger immediate refetch to update UI
      await fetchRequests();

      return true;
    } catch (error: any) {
      console.error("Error approving request:", error);
      toast({
        title: "Erro",
        description: error?.message || "Falha ao aprovar alocação",
        variant: "destructive",
      });
      return false;
    }
  };

  const setDiscussing = async (requestId: string) => {
    if (!user?.id) return false;

    try {
      // First try to find in local state, otherwise fetch from database
      let request = requests.find(r => r.id === requestId);
      
      if (!request) {
        const { data, error: fetchError } = await supabase
          .from("bed_allocation_requests")
          .select("*")
          .eq("id", requestId)
          .single();
        
        if (fetchError || !data) {
          throw new Error("Solicitação não encontrada");
        }
        request = data as unknown as BedAllocationRequest;
      }

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
      await supabase
        .from("patients")
        .update({ allocation_status: "discussing" })
        .eq("id", request.patient_id);

      toast({
        title: "Em discussão",
        description: "Médico da porta será notificado sobre a discussão do caso.",
      });

      // Trigger immediate refetch
      await fetchRequests();

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
      // First try to find in local state, otherwise fetch from database
      let request = requests.find(r => r.id === requestId);
      
      if (!request) {
        const { data, error: fetchError } = await supabase
          .from("bed_allocation_requests")
          .select("*")
          .eq("id", requestId)
          .single();
        
        if (fetchError || !data) {
          throw new Error("Solicitação não encontrada");
        }
        request = data as unknown as BedAllocationRequest;
      }

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
      await supabase
        .from("patients")
        .update({ allocation_status: "rejected" })
        .eq("id", request.patient_id);

      toast({
        title: "Solicitação negada",
        description: "Médico da porta será notificado sobre a negação.",
      });

      // Trigger immediate refetch
      await fetchRequests();

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
