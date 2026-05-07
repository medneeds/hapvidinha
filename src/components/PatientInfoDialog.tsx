import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Copy, Pencil, Check, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { Patient } from "@/types/patient";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  patient: Patient;
  onApply: (updates: Partial<Patient>) => Promise<void> | void;
  canEdit?: boolean;
}

type Field = keyof Pick<Patient,
  | "medicalRecordNumber"
  | "attendanceNumber"
  | "cpf"
  | "motherName"
  | "insuranceCompany"
  | "insurancePlan"
  | "insurancePlanType"
  | "insuranceCardNumber"
  | "insuranceDuration"
>;

const FIELDS: { key: Field; label: string }[] = [
  { key: "medicalRecordNumber", label: "Prontuário" },
  { key: "attendanceNumber", label: "Atendimento" },
  { key: "cpf", label: "CPF" },
  { key: "motherName", label: "Mãe" },
  { key: "insuranceCompany", label: "Convênio" },
  { key: "insurancePlan", label: "Plano Convênio" },
  { key: "insurancePlanType", label: "Plano" },
  { key: "insuranceCardNumber", label: "Carteira" },
  { key: "insuranceDuration", label: "Tempo Plano" },
];

export function PatientInfoDialog({ open, onOpenChange, patient, onApply, canEdit = true }: Props) {
  const { toast } = useToast();
  const [editing, setEditing] = useState(false);
  const [values, setValues] = useState<Record<string, string>>({});

  useEffect(() => {
    if (open) {
      const v: Record<string, string> = {};
      FIELDS.forEach(f => { v[f.key] = (patient[f.key] as string) || ""; });
      setValues(v);
      setEditing(false);
    }
  }, [open, patient]);

  const copy = (text: string | null | undefined, label: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    toast({ title: "Copiado", description: `${label} copiado.` });
  };

  const save = async () => {
    const updates: Partial<Patient> = {};
    for (const f of FIELDS) {
      const v = values[f.key]?.trim() || null;
      (updates as any)[f.key] = v;
    }
    await onApply(updates);
    toast({ title: "Salvo", description: "Dados administrativos atualizados." });
    setEditing(false);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Informações administrativas</DialogTitle>
          <DialogDescription>Dados complementares do paciente.</DialogDescription>
        </DialogHeader>

        <div className="space-y-2">
          {FIELDS.map(({ key, label }) => {
            const value = (patient[key] as string) || "";
            return (
              <div key={key} className="grid grid-cols-[120px_1fr_auto] items-center gap-2 text-sm">
                <Label className="text-xs text-muted-foreground">{label}</Label>
                {editing ? (
                  <Input
                    value={values[key] || ""}
                    onChange={(e) => setValues(prev => ({ ...prev, [key]: e.target.value }))}
                    className="h-7 text-xs"
                  />
                ) : (
                  <span className="text-xs truncate" title={value}>{value || <span className="text-muted-foreground">—</span>}</span>
                )}
                {!editing && value && (
                  <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => copy(value, label)}>
                    <Copy className="h-3 w-3" />
                  </Button>
                )}
                {(editing || !value) && <span />}
              </div>
            );
          })}
        </div>

        <DialogFooter>
          {editing ? (
            <>
              <Button variant="ghost" onClick={() => setEditing(false)}>
                <X className="h-4 w-4 mr-1" /> Cancelar
              </Button>
              <Button onClick={save}>
                <Check className="h-4 w-4 mr-1" /> Salvar
              </Button>
            </>
          ) : (
            <>
              <Button variant="ghost" onClick={() => onOpenChange(false)}>Fechar</Button>
              {canEdit && (
                <Button variant="outline" onClick={() => setEditing(true)}>
                  <Pencil className="h-4 w-4 mr-1" /> Editar
                </Button>
              )}
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
