import { useEffect, useMemo, useState, type ReactNode } from "react";
import { Droplet, Loader2, Printer } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { useHospital } from "@/contexts/HospitalContext";
import { useDepartment } from "@/contexts/DepartmentContext";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import type { Patient } from "@/types/patient";
import {
  HEMO_DOCS,
  buildDefaultHemoForm,
  buildHemoFieldValues,
  hemoHistorySummary,
  validateHemoForm,
  type HemoForm,
  type YesNo,
} from "@/utils/hemoRequest";
import { generateHemoPdf } from "@/utils/hemoPdf";

interface HemoRequestDialogProps {
  patient: Patient;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const isoToBR = (iso: string) => {
  const m = iso.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  return m ? `${m[3]}/${m[2]}/${m[1]}` : "";
};
const brToIso = (br: string) => {
  const m = br.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  return m ? `${m[3]}-${m[2]}-${m[1]}` : "";
};

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="space-y-2.5">
      <h3 className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">{title}</h3>
      {children}
    </section>
  );
}

function Field({ label, required, className, children }: { label: string; required?: boolean; className?: string; children: ReactNode }) {
  return (
    <div className={cn("space-y-1", className)}>
      <Label className="text-xs font-medium">
        {label}
        {required && <span className="text-destructive"> *</span>}
      </Label>
      {children}
    </div>
  );
}

/** Small segmented choice; clicking the selected option clears it (no field is mandatory). */
function Choice<T extends string>({ value, options, onChange }: { value: T | ""; options: { value: T; label: string }[]; onChange: (v: T | "") => void }) {
  return (
    <div className="inline-flex flex-wrap gap-1">
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          onClick={() => onChange(value === o.value ? "" : o.value)}
          className={cn(
            "h-8 rounded-md border px-3 text-xs font-medium transition-colors",
            value === o.value ? "border-primary bg-primary text-primary-foreground" : "border-border bg-background hover:bg-muted"
          )}
          aria-pressed={value === o.value}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

const YES_NO: { value: Exclude<YesNo, "">; label: string }[] = [
  { value: "sim", label: "Sim" },
  { value: "nao", label: "Não" },
];

export function HemoRequestDialog({ patient, open, onOpenChange }: HemoRequestDialogProps) {
  const { toast } = useToast();
  const { user } = useAuth();
  const { currentHospital, currentState } = useHospital();
  const { currentDepartment } = useDepartment();
  const [form, setForm] = useState<HemoForm>(() => buildDefaultHemoForm(patient, { department: currentDepartment }));
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);

  // Fresh form each time it opens, with the logged-in doctor's name.
  useEffect(() => {
    if (!open) return;
    setErrors([]);
    setForm(buildDefaultHemoForm(patient, { department: currentDepartment }));
    if (!user?.id) return;
    let active = true;
    supabase
      .from("profiles")
      .select("full_name")
      .eq("id", user.id)
      .maybeSingle()
      .then(({ data }) => {
        const name = (data?.full_name || "").trim().toUpperCase();
        if (active && name) setForm((f) => (f.medico ? f : { ...f, medico: name }));
      });
    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const set = <K extends keyof HemoForm>(key: K, value: HemoForm[K]) => setForm((f) => ({ ...f, [key]: value }));
  const text = (key: keyof HemoForm) => ({
    value: form[key] as string,
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => set(key, e.target.value.toUpperCase() as never),
  });
  const qty = (key: "qtdHemacias" | "qtdPlaquetas" | "qtdPlasma") => ({
    value: form[key],
    inputMode: "numeric" as const,
    maxLength: 2,
    placeholder: "—",
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => set(key, e.target.value.replace(/\D/g, "").slice(0, 2)),
  });

  const selectedCount = useMemo(() => HEMO_DOCS.filter((d) => form.docs[d.key]).length, [form.docs]);
  const isMale = form.sexo === "M";

  const handleGenerate = async () => {
    const problems = validateHemoForm(form);
    setErrors(problems);
    if (problems.length) return;

    // Open the tab now, while the click still counts — browsers block it after waiting.
    const tab = window.open("", "_blank");
    setSubmitting(true);
    try {
      const bytes = await generateHemoPdf(buildHemoFieldValues(form), form.docs);
      const blob = new Blob([bytes as BlobPart], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      if (tab) tab.location.href = url;
      else {
        const a = document.createElement("a");
        a.href = url;
        a.download = `SOLICITACAO_HEMOCOMPONENTES_${form.nome.replace(/\s+/g, "_")}.pdf`;
        document.body.appendChild(a);
        a.click();
        a.remove();
      }
      setTimeout(() => URL.revokeObjectURL(url), 120_000);

      if (currentHospital?.id && currentState?.id) {
        const { error } = await (supabase.from as any)("medical_reports").insert({
          patient_id: patient.id,
          patient_name: patient.name,
          patient_age: patient.age || null,
          patient_bed: patient.bedNumber,
          patient_sector: patient.sector,
          report_content: hemoHistorySummary(form),
          created_by: user?.id || null,
          created_by_email: user?.email || null,
          hospital_unit_id: currentHospital.id,
          state_id: currentState.id,
          department: currentDepartment,
        });
        if (error) console.error("Erro ao registrar solicitação de hemocomponentes:", error);
      }
      toast({ title: "Documentos gerados", description: `${selectedCount} documento(s) prontos para imprimir. Solicitação registrada no histórico.` });
      onOpenChange(false);
    } catch (e: any) {
      tab?.close();
      toast({ title: "Não foi possível gerar os documentos", description: e?.message || "Tente novamente.", variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[92vh] overflow-y-auto p-4 sm:p-6">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Droplet className="h-5 w-5 text-critical" />
            Solicitar Hemocomponentes
          </DialogTitle>
          <DialogDescription>
            Os dados do paciente já vêm preenchidos. Complete o que precisar — campos vazios saem em branco nos documentos.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5">
          <Section title="Documentos">
            <div className="grid gap-1.5 sm:grid-cols-2">
              {HEMO_DOCS.map((d) => (
                <label key={d.key} className="flex cursor-pointer items-start gap-2 rounded-md border border-border p-2 hover:bg-muted/50">
                  <Checkbox
                    checked={form.docs[d.key]}
                    onCheckedChange={(c) => set("docs", { ...form.docs, [d.key]: c === true })}
                    className="mt-0.5"
                  />
                  <span className="leading-tight">
                    <span className="block text-xs font-medium">{d.title}</span>
                    <span className="block text-[11px] text-muted-foreground">{d.detail}</span>
                  </span>
                </label>
              ))}
            </div>
          </Section>

          <Section title="Paciente">
            <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
              <Field label="Nome" required className="col-span-2 sm:col-span-4"><Input {...text("nome")} /></Field>
              <Field label="Prontuário" required><Input {...text("prontuario")} /></Field>
              <Field label="Atendimento" required><Input {...text("atendimento")} /></Field>
              <Field label="Leito"><Input {...text("leito")} /></Field>
              <Field label="Setor"><Input {...text("setor")} /></Field>
              <Field label="Data de nascimento">
                <Input type="date" value={brToIso(form.birthDate)} onChange={(e) => set("birthDate", isoToBR(e.target.value))} />
              </Field>
              <Field label="Idade"><Input {...text("idade")} /></Field>
              <Field label="Peso"><Input {...text("peso")} placeholder="Ex.: 62 KG" /></Field>
              <Field label="Sexo">
                <Choice value={form.sexo} options={[{ value: "F", label: "Fem." }, { value: "M", label: "Masc." }]} onChange={(v) => set("sexo", v)} />
              </Field>
              <Field label="Médico" className="col-span-2 sm:col-span-4"><Input {...text("medico")} /></Field>
            </div>
          </Section>

          <Section title="Hemocomponentes (quantidade)">
            <div className="grid grid-cols-3 gap-2.5">
              <Field label="Conc. de hemácias"><Input {...qty("qtdHemacias")} className="text-center" /></Field>
              <Field label="Conc. de plaquetas"><Input {...qty("qtdPlaquetas")} className="text-center" /></Field>
              <Field label="Conc. de plasma"><Input {...qty("qtdPlasma")} className="text-center" /></Field>
              <Field label="Outros (só na Solicitação)" className="col-span-3"><Input {...text("outrosHemocomponentes")} placeholder="Ex.: 10 UNIDADES DE CRIOPRECIPITADO" /></Field>
            </div>
          </Section>

          <Section title="Dados clínicos">
            <div className="grid grid-cols-2 gap-2.5">
              <Field label="Grupo sanguíneo">
                <Choice value={form.grupo as "A" | "B" | "AB" | "O" | ""} options={["A", "B", "AB", "O"].map((g) => ({ value: g as "A", label: g }))} onChange={(v) => set("grupo", v)} />
              </Field>
              <Field label="Fator RH">
                <Choice value={form.fatorRh as "POSITIVO" | "NEGATIVO" | ""} options={[{ value: "POSITIVO", label: "Positivo" }, { value: "NEGATIVO", label: "Negativo" }]} onChange={(v) => set("fatorRh", v)} />
              </Field>
              <Field label="Diagnóstico" className="col-span-2"><Input {...text("diagnostico")} /></Field>
              <Field label="Indicação da transfusão" className="col-span-2"><Input {...text("indicacao")} /></Field>
              <Field label="Dados clínicos" className="col-span-2"><Input {...text("dadosClinicos")} /></Field>
              <Field label="Hb ou Ht"><Input {...text("hbHt")} /></Field>
              <Field label="Nº de plaquetas"><Input {...text("plaquetas")} /></Field>
              <Field label="Medicamento em uso" className="col-span-2"><Input {...text("medicamentos")} /></Field>
            </div>
          </Section>

          <Section title="Histórico transfusional">
            <div className="grid grid-cols-2 gap-2.5">
              <Field label="Transfusões prévias?"><Choice value={form.transfPrevias} options={YES_NO} onChange={(v) => set("transfPrevias", v)} /></Field>
              <Field label="Teve reação transfusional?"><Choice value={form.reacao} options={YES_NO} onChange={(v) => set("reacao", v)} /></Field>
              <Field label="Qual tipo?" className="col-span-2"><Input {...text("qualTipo")} /></Field>
              {!isMale && (
                <>
                  <Field label="Está gestante?"><Choice value={form.gestante} options={YES_NO} onChange={(v) => set("gestante", v)} /></Field>
                  <Field label="Gestações anteriores?"><Choice value={form.gestacoes} options={YES_NO} onChange={(v) => set("gestacoes", v)} /></Field>
                </>
              )}
            </div>
          </Section>

          <Section title="Tipo de transfusão">
            <Choice
              value={form.tipo}
              options={[
                { value: "programada", label: "Programada" },
                { value: "naoUrgente", label: "Não urgente (24h)" },
                { value: "urgente", label: "Urgente (3h)" },
                { value: "extrema", label: "Extrema urgência" },
              ]}
              onChange={(v) => set("tipo", v)}
            />
            {form.tipo === "programada" && (
              <div className="grid grid-cols-2 gap-2.5 pt-1">
                <Field label="Dia"><Input type="date" value={brToIso(form.progData)} onChange={(e) => set("progData", isoToBR(e.target.value))} /></Field>
                <Field label="Hora"><Input type="time" value={form.progHora} onChange={(e) => set("progHora", e.target.value)} /></Field>
              </div>
            )}
          </Section>

          <Section title="Data da solicitação">
            <div className="grid grid-cols-2 gap-2.5">
              <Field label="Data"><Input type="date" value={brToIso(form.data)} onChange={(e) => set("data", isoToBR(e.target.value))} /></Field>
              <Field label="Hora"><Input type="time" value={form.hora} onChange={(e) => set("hora", e.target.value)} /></Field>
            </div>
          </Section>

          {form.docs.termo && (
            <Section title="Termo de esclarecimento">
              <Choice
                value={form.consentimento}
                options={[
                  { value: "aceito", label: "Aceito" },
                  { value: "naoAceito", label: "Não aceito" },
                  { value: "naoObtido", label: "Não obtido" },
                ]}
                onChange={(v) => set("consentimento", v)}
              />
              <p className="text-[11px] text-muted-foreground">Deixe sem marcar para o paciente assinalar no papel.</p>
            </Section>
          )}

          {errors.length > 0 && (
            <div className="rounded-md border border-destructive/40 bg-destructive/10 p-2.5 text-xs text-destructive" role="alert">
              {errors.map((e) => (
                <p key={e}>{e}</p>
              ))}
            </div>
          )}
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={submitting}>Cancelar</Button>
          <Button onClick={handleGenerate} disabled={submitting || selectedCount === 0}>
            {submitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Printer className="mr-2 h-4 w-4" />}
            Gerar {selectedCount} documento{selectedCount === 1 ? "" : "s"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
