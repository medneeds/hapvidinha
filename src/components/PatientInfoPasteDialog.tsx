import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Sparkles, Check } from "lucide-react";
import type { Patient } from "@/types/patient";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onApply: (updates: Partial<Patient>) => Promise<void> | void;
}

const FIELD_LABELS: Record<string, string> = {
  name: "Nome",
  age: "Idade",
  birthDate: "Nascimento",
  cpf: "CPF",
  motherName: "Mãe",
  insuranceCompany: "Convênio",
  insurancePlan: "Plano Convênio",
  insurancePlanType: "Plano",
  insuranceCardNumber: "Carteira",
  insuranceDuration: "Tempo Plano",
  medicalRecordNumber: "Prontuário",
  attendanceNumber: "Atendimento",
};

export function PatientInfoPasteDialog({ open, onOpenChange, onApply }: Props) {
  const { toast } = useToast();
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [extracted, setExtracted] = useState<Record<string, string> | null>(null);

  const reset = () => {
    setText("");
    setExtracted(null);
    setLoading(false);
  };

  const handleClose = (v: boolean) => {
    if (!v) reset();
    onOpenChange(v);
  };

  const processText = async (raw: string) => {
    if (!raw || raw.trim().length < 5) return;
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("extract-patient-info", {
        body: { text: raw },
      });
      if (error) throw error;
      const result = (data as any)?.data || {};
      if (Object.keys(result).length === 0) {
        toast({ title: "Nada reconhecido", description: "A IA não identificou dados estruturados.", variant: "destructive" });
        setExtracted(null);
      } else {
        setExtracted(result);
      }
    } catch (e: any) {
      toast({ title: "Erro na extração", description: e?.message || "Falha ao chamar IA.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handlePaste: React.ClipboardEventHandler<HTMLTextAreaElement> = (e) => {
    const pasted = e.clipboardData.getData("text");
    if (pasted && pasted.trim().length >= 5) {
      // small delay to let textarea update
      setTimeout(() => processText(pasted), 50);
    }
  };

  const apply = async () => {
    if (!extracted) return;
    const updates: Partial<Patient> = {};
    for (const k of Object.keys(extracted)) {
      const v = extracted[k];
      if (v && typeof v === "string" && v.trim()) {
        (updates as any)[k] = v.trim();
      }
    }
    await onApply(updates);
    toast({ title: "Dados aplicados", description: `${Object.keys(updates).length} campos preenchidos.` });
    reset();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary" />
            Importar dados do paciente (IA)
          </DialogTitle>
          <DialogDescription>
            Cole abaixo o texto copiado do Samweb (Ctrl+V). A IA reconhecerá automaticamente nome, prontuário, atendimento, convênio e demais dados.
          </DialogDescription>
        </DialogHeader>

        <Textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          onPaste={handlePaste}
          placeholder="Cole aqui (Ctrl+V) o bloco de informações do paciente..."
          className="min-h-[160px] font-mono text-xs"
          autoFocus
        />

        {loading && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" /> Analisando com IA...
          </div>
        )}

        {extracted && !loading && (
          <div className="border rounded-md p-3 max-h-64 overflow-y-auto space-y-1">
            <div className="text-xs font-semibold text-muted-foreground mb-2">Campos reconhecidos:</div>
            {Object.entries(extracted).map(([k, v]) => (
              <div key={k} className="flex justify-between text-xs gap-2">
                <span className="font-medium text-muted-foreground">{FIELD_LABELS[k] || k}:</span>
                <span className="text-foreground text-right break-all">{v}</span>
              </div>
            ))}
          </div>
        )}

        <DialogFooter>
          <Button variant="ghost" onClick={() => handleClose(false)}>Cancelar</Button>
          <Button onClick={apply} disabled={!extracted || loading}>
            <Check className="h-4 w-4 mr-1" /> Aplicar dados
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
