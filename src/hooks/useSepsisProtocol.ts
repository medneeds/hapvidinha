import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useHospital } from "@/contexts/HospitalContext";

export interface ActiveSepsisProtocol {
  id: string;
  patient_id: string | null;
  patient_name: string;
  opening_date: string | null;
  opening_time: string | null;
  created_at: string;
  has_infection: boolean | null;
  has_organic_dysfunction: boolean | null;
  outcome: string | null;
  blood_culture_date: string | null;
  blood_culture_time: string | null;
  antibiotic_prescription_date: string | null;
  antibiotic_prescription_time: string | null;
}

export function useSepsisProtocol(patientId?: string) {
  const [activeProtocol, setActiveProtocol] = useState<ActiveSepsisProtocol | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { currentHospital, currentState } = useHospital();

  const fetchActiveProtocol = useCallback(async () => {
    if (!patientId || !currentHospital || !currentState) return;
    
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('sepsis_protocols')
        .select('id, patient_id, patient_name, opening_date, opening_time, created_at, has_infection, has_organic_dysfunction, outcome, blood_culture_date, blood_culture_time, antibiotic_prescription_date, antibiotic_prescription_time')
        .eq('patient_id', patientId)
        .eq('hospital_unit_id', currentHospital.id)
        .eq('state_id', currentState.id)
        .is('outcome', null)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) throw error;
      setActiveProtocol(data as ActiveSepsisProtocol | null);
    } catch (error) {
      console.error('Error fetching active sepsis protocol:', error);
    } finally {
      setIsLoading(false);
    }
  }, [patientId, currentHospital, currentState]);

  useEffect(() => {
    fetchActiveProtocol();
  }, [fetchActiveProtocol]);

  // Realtime subscription to update banner when protocol changes
  useEffect(() => {
    if (!patientId) return;

    const channel = supabase
      .channel(`sepsis-protocol-${patientId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'sepsis_protocols',
          filter: `patient_id=eq.${patientId}`,
        },
        () => {
          fetchActiveProtocol();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [patientId, fetchActiveProtocol]);

  const isProtocolActive = !!activeProtocol;
  const isProtocolFinalized = activeProtocol?.outcome != null;

  return {
    activeProtocol,
    isProtocolActive,
    isProtocolFinalized,
    isLoading,
    refetch: fetchActiveProtocol,
  };
}
