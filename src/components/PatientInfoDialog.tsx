import { useEffect, useRef, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Copy, Pencil, Check, X, Sparkles, ImagePlus, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import type { Patient } from "@/types/patient";
import { recognizePatientAdminData, imageFileToDataUrl } from "@/utils/recognizePatientAdminData";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  patient: Patient;
  onApply: (updates: Partial<Patient>) => Promise<void> | void;
  canEdit?: boolean;
}

type Field = keyof Pick<Patient,
  | "birthDate"
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

const FIELDS: { key: Field; label: string; placeholder?: string }[] = [
  { key: "birthDate", label: "Data de nascimento", placeholder: "DD/MM/AAAA" },
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

const AI_FIELDS: Field[] = ["birthDate", "medicalRecordNumber", "attendanceNumber"];

export function PatientInfoDialog({ open, onOpenChange, patient, onApply, canEdit = true }: Props) {
  const { toast } = useToast();
  const [editing, setEditing] = useState(false);
  const [values, setValues] = useState<Record<string, string>>({});
  const [aiText, setAiText] = useState("");
  const [aiImage, setAiImage] = useState<string | null>(null);
  const [recognizing, setRecognizing] = useState(false);
  const [recognized, setRecognized] = useState<Set<Field>>(new Set());
  const fileRef = useRef<HTMLInputElement>(null);

  const loadValues = () => {
    const v: Record<string, string> = {};
    FIELDS.forEach(f => { v[f.key] = (patient[f.key] as string) || ""; });
    return v;
  };

  useEffect(() => {
    if (open) {
      setValues(loadValues());
      setEditing(false);
      setAiText("");
      setAiImage(null);
      setRecognized(new Set());
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, patient.id]);

  const copy = (text: string | null | undefined, label: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    toast({ title: "Copiado", description: `${label} copiado.` });
  };

  const save = async () => {
    const updates: Partial<Patient> = {};
    for (const f of FIELDS) {
      const v = values[f.key]?.trim() || null;
      if (f.key === "birthDate") {
        (updates as any).birthDate = v || "";
      } else {
        (updates as any)[f.key] = v ? v.toUpperCase() : null;
      }
    }
    await onApply(updates);
    toast({ title: "Salvo", description: "Dados administrativos atualizados." });
    setEditing(false);
    setRecognized(new Set());
    onOpenChange(false);
  };

  const attachImage = async (file: File) => {
    try {
      setAiImage(await imageFileToDataUrl(file));
    } catch (e) {
      toast({ title: "Imagem inválida", description: (e as Error).message, variant: "destructive" });
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    const file = Array.from(e.clipboardData.files).find(f => f.type.startsWith("image/"));
    if (file) {
      e.preventDefault();
      void attachImage(file);
    }
  };

  const recognize = async () => {
    if (!aiText.trim() && !aiImage) {
      toast({ title: "Nada para reconhecer", description: "Cole o texto ou o print do sistema." });
      return;
    }
    setRecognizing(true);
    try {
      const result = await recognizePatientAdminData({ text: aiText, image: aiImage });
      const base = editing ? values : loadValues();
      const next = { ...base };
      const found = new Set<Field>();
      for (const key of AI_FIELDS) {
        const v = result[key as keyof typeof result];
        if (v) { next[key] = v; found.add(key); }
      }
      if (found.size === 0) {
        toast({ title: "Nenhum dado encontrado", description: "Não achei data de nascimento, prontuário ou atendimento." });
        return;
      }
      setValues(next);
      setRecognized(found);
      setEditing(true);
      toast({ title: "Dados reconhecidos", description: "Confira os campos destacados e clique em Salvar." });
    } catch (e) {
      toast({ title: "Falha no reconhecimento", description: (e as Error).message, variant: "destructive" });
    } finally {
      setRecognizing(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Informações administrativas</DialogTitle>
          <DialogDescription>Dados complementares do paciente.</DialogDescription>
        </DialogHeader>

        {canEdit && (
          <div className="rounded-lg border border-primary/25 bg-primary/5 p-2.5 space-y-2">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-primary">
              <Sparkles className="h-3.5 w-3.5" />
              Reconhecer com IA
              <span className="font-normal text-muted-foreground">— nascimento, prontuário e atendimento</span>
            </div>
            <Textarea
              value={aiText}
              onChange={(e) => setAiText(e.target.value)}
              onPaste={handlePaste}
              placeholder="Cole aqui o texto ou o print (Ctrl+V) da tela do sistema..."
              className="min-h-[64px] text-xs bg-background"
              disabled={recognizing}
            />
            {aiImage && (
              <div className="relative inline-block">
                <img src={aiImage} alt="Print colado" className="max-h-24 rounded border border-border" />
                <button
                  type="button"
                  onClick={() => setAiImage(null)}
                  className="absolute -top-2 -right-2 h-5 w-5 rounded-full bg-background border border-border text-muted-foreground hover:text-destructive inline-flex items-center justify-center"
                  title="Remover imagem"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            )}
            <div className="flex items-center justify-between gap-2">
              <input
                ref={fileRef}
                type="file"
                accept="image/png,image/jpeg,image/webp"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) void attachImage(f);
                  e.target.value = "";
                }}
              />
              <Button type="button" size="sm" variant="ghost" className="h-7 text-xs" onClick={() => fileRef.current?.click()} disabled={recognizing}>
                <ImagePlus className="h-3.5 w-3.5 mr-1" /> Anexar print
              </Button>
              <Button type="button" size="sm" className="h-7 text-xs" onClick={recognize} disabled={recognizing || (!aiText.trim() && !aiImage)}>
                {recognizing ? <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" /> : <Sparkles className="h-3.5 w-3.5 mr-1" />}
                {recognizing ? "Reconhecendo..." : "Reconhecer"}
              </Button>
            </div>
          </div>
        )}

        <div className="space-y-2">
          {FIELDS.map(({ key, label, placeholder }) => {
            const value = (patient[key] as string) || "";
            const isRecognized = recognized.has(key);
            return (
              <div key={key} className="grid grid-cols-[120px_1fr_auto] items-center gap-2 text-sm">
                <Label className="text-xs text-muted-foreground">{label}</Label>
                {editing ? (
                  <Input
                    value={values[key] || ""}
                    placeholder={placeholder}
                    onChange={(e) => setValues(prev => ({ ...prev, [key]: e.target.value }))}
                    className={cn("h-7 text-xs", isRecognized && "border-primary ring-1 ring-primary/30 bg-primary/5")}
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
              <Button variant="ghost" onClick={() => { setEditing(false); setRecognized(new Set()); setValues(loadValues()); }}>
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
                <Button variant="outline" onClick={() => { setValues(loadValues()); setEditing(true); }}>
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
