import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useHospital } from "@/contexts/HospitalContext";
import type { Patient } from "@/types/patient";
import { SepsisProtocolWizardDialog } from "./SepsisProtocolWizardDialog";

interface SepsisProtocolLauncherProps {
  patient: Patient;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/**
 * Abre a ficha do protocolo de sepse de um paciente sob demanda: só consulta o
 * protocolo em aberto quando o menu é acionado (evita uma assinatura em tempo
 * real por cartão) e retoma o protocolo ativo em vez de abrir um novo.
 */
export function SepsisProtocolLauncher({ patient, open, onOpenChange }: SepsisProtocolLauncherProps) {
  const { currentHospital, currentState } = useHospital();
  const [ready, setReady] = useState(false);
  const [protocolId, setProtocolId] = useState<string | null>(null);

  useEffect(() => {
    if (!open) {
      setReady(false);
      return;
    }
    let cancelled = false;
    (async () => {
      let id: string | null = null;
      if (currentHospital && currentState) {
        const { data } = await supabase
          .from("sepsis_protocols")
          .select("id")
          .eq("patient_id", patient.id)
          .eq("hospital_unit_id", currentHospital.id)
          .eq("state_id", currentState.id)
          .is("outcome", null)
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle();
        id = data?.id ?? null;
      }
      if (!cancelled) {
        setProtocolId(id);
        setReady(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [open, patient.id, currentHospital, currentState]);

  if (!open || !ready) return null;

  return (
    <SepsisProtocolWizardDialog
      patient={patient}
      isOpen
      onClose={() => onOpenChange(false)}
      existingProtocolId={protocolId}
    />
  );
}
