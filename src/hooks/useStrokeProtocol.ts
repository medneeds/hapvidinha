import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useHospital } from "@/contexts/HospitalContext";

export interface ActiveStrokeProtocol {
  id: string;
  patient_id: string | null;
  patient_name: string;
  opening_date: string | null;
  opening_time: string | null;
  created_at: string;
  outcome: string | null;
  last_seen_well_date: string | null;
  last_seen_well_time: string | null;
  ct_date: string | null;
  ct_time: string | null;
  thrombolysis_date: string | null;
  thrombolysis_time: string | null;
  conduct: string | null;
  nihss_total: number | null;
}

export function useStrokeProtocol(patientId?: string) {
  const [activeProtocol, setActiveProtocol] = useState<ActiveStrokeProtocol | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { currentHospital, currentState } = useHospital();

  const fetchActiveProtocol = useCallback(async () => {
    if (!patientId || !currentHospital || !currentState) return;
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('stroke_protocols')
        .select('id, patient_id, patient_name, opening_date, opening_time, created_at, outcome, last_seen_well_date, last_seen_well_time, ct_date, ct_time, thrombolysis_date, thrombolysis_time, conduct, nihss_total')
        .eq('patient_id', patientId)
        .eq('hospital_unit_id', currentHospital.id)
        .eq('state_id', currentState.id)
        .is('outcome', null)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) throw error;
      setActiveProtocol(data as ActiveStrokeProtocol | null);
    } catch (error) {
      console.error('Error fetching active stroke protocol:', error);
    } finally {
      setIsLoading(false);
    }
  }, [patientId, currentHospital, currentState]);

  useEffect(() => { fetchActiveProtocol(); }, [fetchActiveProtocol]);

  useEffect(() => {
    if (!patientId) return;
    const channel = supabase
      .channel(`stroke-protocol-${patientId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'stroke_protocols', filter: `patient_id=eq.${patientId}` }, () => fetchActiveProtocol())
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
