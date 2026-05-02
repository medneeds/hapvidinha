import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useHospital } from "@/contexts/HospitalContext";

export interface ActiveChestPainProtocol {
  id: string;
  patient_id: string | null;
  patient_name: string;
  opening_date: string | null;
  opening_time: string | null;
  created_at: string;
  outcome: string | null;
  pain_onset_date: string | null;
  pain_onset_time: string | null;
  ecg_date: string | null;
  ecg_time: string | null;
  is_stemi: boolean | null;
  heart_total: number | null;
  heart_risk_level: string | null;
  balloon_date: string | null;
  balloon_time: string | null;
}

export function useChestPainProtocol(patientId?: string) {
  const [activeProtocol, setActiveProtocol] = useState<ActiveChestPainProtocol | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { currentHospital, currentState } = useHospital();

  const fetchActiveProtocol = useCallback(async () => {
    if (!patientId || !currentHospital || !currentState) return;
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('chest_pain_protocols')
        .select('id, patient_id, patient_name, opening_date, opening_time, created_at, outcome, pain_onset_date, pain_onset_time, ecg_date, ecg_time, is_stemi, heart_total, heart_risk_level, balloon_date, balloon_time')
        .eq('patient_id', patientId)
        .eq('hospital_unit_id', currentHospital.id)
        .eq('state_id', currentState.id)
        .is('outcome', null)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) throw error;
      setActiveProtocol(data as ActiveChestPainProtocol | null);
    } catch (error) {
      console.error('Error fetching active chest pain protocol:', error);
    } finally {
      setIsLoading(false);
    }
  }, [patientId, currentHospital, currentState]);

  useEffect(() => { fetchActiveProtocol(); }, [fetchActiveProtocol]);

  useEffect(() => {
    if (!patientId) return;
    const channel = supabase
      .channel(`chest-pain-protocol-${patientId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'chest_pain_protocols', filter: `patient_id=eq.${patientId}` }, () => fetchActiveProtocol())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [patientId, fetchActiveProtocol]);

  return {
    activeProtocol,
    isProtocolActive: !!activeProtocol,
    isProtocolFinalized: activeProtocol?.outcome != null,
    isLoading,
    refetch: fetchActiveProtocol,
  };
}
