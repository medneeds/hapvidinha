import { useEffect, useMemo, useState } from "react";
import { Patient } from "@/types/patient";
import { supabase } from "@/integrations/supabase/client";
import { useHospital } from "@/contexts/HospitalContext";
import { useToast } from "@/hooks/use-toast";
import { isWithinFixedRange } from "@/utils/bedCapacityStore";
import {
  buildUtiOriginLabel,
  getVacantUtiBeds,
  type UtiBedRow,
  type UtiUnit,
} from "@/utils/utiTransfer";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { BedDouble, Loader2, ArrowRight } from "lucide-react";

interface TransferToUtiDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  patient: Patient;
  department: string;
  onTransferred?: () => void;
}

const UNITS: UtiUnit[] = ["UTI 1", "UTI 2"];

export function TransferToUtiDialog({ open, onOpenChange, patient, department, onTransferred }: TransferToUtiDialogProps) {
  const { currentHospital, currentState } = useHospital();
  const { toast } = useToast();
  const [unit, setUnit] = useState<UtiUnit>("UTI 1");
  const [rows, setRows] = useState<UtiBedRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!open || !currentHospital || !currentState) return;
    setLoading(true);
    supabase
      .from("patients")
      .select("id, bed_number, sector, is_vacant, bed_status")
      .eq("department", "UTI")
      .eq("hospital_unit_id", currentHospital.id)
      .eq("state_id", currentState.id)
      .then(({ data, error }) => {
        if (error) {
          toast({ title: "Erro ao carregar leitos da UTI", description: error.message, variant: "destructive" });
          setRows([]);
        } else {
          setRows((data || []) as UtiBedRow[]);
        }
        setLoading(false);
      });
  }, [open, currentHospital, currentState, toast]);

  const vacantCount = useMemo(() => getVacantUtiBeds(rows, unit).length, [rows, unit]);
  const originLabel = buildUtiOriginLabel(department, patient.sector, patient.bedNumber);

  const carried = [
    { label: "Hipóteses / Diagnósticos", count: patient.diagnoses?.length || 0 },
    { label: "Antecedentes / Comorbidades", count: patient.medicalHistory?.length || 0 },
    { label: "Exames", count: patient.relevantExams?.length || 0 },
    { label: "Plano Terapêutico", count: patient.utiDailyConducts?.length || 0 },
    { label: "Programações / Pendências", count: patient.pendencies?.length || 0 },
  ];

  const handleConfirm = async () => {
    setSubmitting(true);
    // Fixed UE slots (V/A/Z within the configured capacity) stay as vacant beds; extra beds are removed.
    const deleteSource = !isWithinFixedRange(department, patient.sector, patient.bedNumber);
    const { error } = await supabase.rpc("send_patient_to_uti_transit", {
      p_source_id: patient.id,
      p_target_unit: unit,
      p_origin_label: originLabel,
      p_delete_source: deleteSource,
      p_snapshot: patient as any,
    });
    setSubmitting(false);
    if (error) {
      toast({ title: "Transferência não realizada", description: error.message, variant: "destructive" });
      return;
    }
    toast({
      title: "Paciente enviado para a UTI",
      description: `${patient.name} está em trânsito, aguardando a ${unit} escolher o leito.`,
    });
    onOpenChange(false);
    onTransferred?.();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <BedDouble className="h-5 w-5 text-primary" />
            Transferir para UTI
          </DialogTitle>
          <DialogDescription>
            {patient.name} sai de {originLabel} e leva os dados clínicos. A UTI decide o leito.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-2">
            {UNITS.map((u) => (
              <Button
                key={u}
                type="button"
                variant={unit === u ? "default" : "outline"}
                onClick={() => setUnit(u)}
              >
                {u}
              </Button>
            ))}
          </div>

          <p className="text-xs text-muted-foreground">
            {loading ? (
              <span className="inline-flex items-center gap-2"><Loader2 className="h-3.5 w-3.5 animate-spin" /> Conferindo leitos…</span>
            ) : vacantCount > 0 ? (
              <>A {unit} tem <span className="font-semibold text-foreground tabular-nums">{vacantCount}</span> leito(s) vago(s) agora.</>
            ) : (
              <>A {unit} está sem leito vago agora. O paciente aguarda em trânsito até a liberação.</>
            )}
          </p>

          <div className="rounded-md border border-border bg-muted/30 p-3 space-y-1.5">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">O que vai junto</p>
            <ul className="text-xs text-foreground space-y-0.5">
              <li>Nome, data de nascimento, idade, história admissional e dados administrativos</li>
              {carried.map((c) => (
                <li key={c.label}>{c.label}: <span className="font-semibold tabular-nums">{c.count}</span></li>
              ))}
            </ul>
            <p className="text-[11px] text-muted-foreground pt-1">
              O leito {patient.bedNumber} é liberado agora. O paciente fica em "Em trânsito · Aguardando alocação" na {unit}, e a UTI escolhe o leito. Setor de origem: "{originLabel}".
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={submitting}>Cancelar</Button>
          <Button onClick={handleConfirm} disabled={submitting}>
            {submitting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <ArrowRight className="h-4 w-4 mr-2" />}
            Enviar para {unit}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
