import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import { Check, ChevronRight, Droplet, FileText, History, Loader2, Printer } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { useHospital } from "@/contexts/HospitalContext";
import { useDepartment } from "@/contexts/DepartmentContext";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import type { Patient } from "@/types/patient";
import {
  HEMO_DOCS,
  HEMO_HISTORY_PREFIX,
  buildDefaultHemoForm,
  buildHemoFieldValues,
  hemoHistorySummary,
  isSamePatientHemoRecord,
  parseHemoHistory,
  validateHemoForm,
  type HemoDocKey,
  type HemoForm,
  type HemoHistoryEntry,
  type YesNo,
} from "@/utils/hemoRequest";
import { generateHemoDocPdf, generateHemoPdf } from "@/utils/hemoPdf";
import { HEMO_PRINT_LOADING_HTML, buildHemoPrintHtml, renderPdfPages, type HemoPrintDoc } from "@/utils/hemoPrint";

interface HemoRequestDialogProps {
  patient: Patient;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface HistoryItem extends HemoHistoryEntry {
  id: string;
  createdAt: string;
  author: string;
  bed: string;
  department: string;
}

interface Progress {
  keys: HemoDocKey[];
  index: number;
  finished: boolean;
}

const isoToBR = (iso: string) => {
  const m = iso.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  return m ? `${m[3]}/${m[2]}/${m[1]}` : "";
};
const brToIso = (br: string) => {
  const m = br.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  return m ? `${m[3]}-${m[2]}-${m[1]}` : "";
};
const formatStamp = (iso: string) => {
  const d = new Date(iso);
  return isNaN(d.getTime()) ? "" : d.toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" });
};

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="space-y-2.5">
      <h3 className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">{title}</h3>
      {children}
    </section>
  );
}

function Field({ label, required, className, group, children }: { label: string; required?: boolean; className?: string; group?: boolean; children: ReactNode }) {
  const caption = (
    <span className="block text-xs font-medium leading-none">
      {label}
      {required && <span className="text-destructive"> *</span>}
    </span>
  );
  // Inputs sit inside a <label> (click/screen-reader association); button groups use a labelled group instead.
  if (group) {
    return (
      <div role="group" aria-label={label} className={cn("space-y-1.5", className)}>
        {caption}
        <div>{children}</div>
      </div>
    );
  }
  return (
    <label className={cn("block space-y-1.5", className)}>
      {caption}
      {children}
    </label>
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

const docTitle = (key: HemoDocKey) => HEMO_DOCS.find((d) => d.key === key)?.title || key;

/** Overlay shown while each document is filled and turned into its print page. */
function GeneratingOverlay({ progress }: { progress: Progress }) {
  const total = progress.keys.length;
  const done = progress.finished ? total : progress.index;
  const pct = Math.round(((progress.finished ? total : progress.index + 0.5) / total) * 100);
  return (
    <div
      className="absolute inset-0 z-20 flex items-center justify-center bg-background/90 backdrop-blur-sm motion-safe:animate-in motion-safe:fade-in-0"
      role="status"
      aria-live="polite"
    >
      <div className="w-full max-w-sm space-y-5 px-6">
        <div className="flex flex-col items-center gap-3 text-center">
          <div className="relative h-16 w-16">
            {!progress.finished && <span className="absolute inset-0 rounded-full bg-critical/15 motion-safe:animate-ping [animation-duration:1.8s]" />}
            <span
              className={cn(
                "relative flex h-16 w-16 items-center justify-center rounded-full ring-1 transition-colors duration-300",
                progress.finished ? "bg-critical text-critical-foreground ring-critical" : "bg-critical/10 text-critical ring-critical/30"
              )}
            >
              {progress.finished ? (
                <Check className="h-7 w-7 motion-safe:animate-in motion-safe:zoom-in-50" />
              ) : (
                <Droplet className="h-7 w-7 motion-safe:animate-pulse" fill="currentColor" />
              )}
            </span>
          </div>
          <div className="space-y-0.5">
            <p className="text-sm font-semibold">{progress.finished ? "Documentos prontos" : "Gerando documentos"}</p>
            <p className="min-h-[1rem] text-xs text-muted-foreground">
              {progress.finished ? "Abrindo a janela de impressão…" : `${done + 1} de ${total} · ${docTitle(progress.keys[progress.index])}`}
            </p>
          </div>
        </div>

        <div className="h-1.5 overflow-hidden rounded-full bg-muted">
          <div className="h-full rounded-full bg-critical transition-[width] duration-500 ease-out" style={{ width: `${pct}%` }} />
        </div>

        <ul className="space-y-1.5">
          {progress.keys.map((key, i) => {
            const state = progress.finished || i < progress.index ? "done" : i === progress.index ? "active" : "pending";
            return (
              <li key={key} className={cn("flex items-center gap-2 text-xs transition-colors", state === "pending" ? "text-muted-foreground/70" : "text-foreground")}>
                <span className="flex h-4 w-4 shrink-0 items-center justify-center">
                  {state === "done" && <Check className="h-3.5 w-3.5 text-critical motion-safe:animate-in motion-safe:zoom-in-50" />}
                  {state === "active" && <Loader2 className="h-3.5 w-3.5 animate-spin text-critical" />}
                  {state === "pending" && <span className="h-2 w-2 rounded-full border border-muted-foreground/50" />}
                </span>
                <span className={cn("truncate", state === "active" && "font-medium")}>{docTitle(key)}</span>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}

function HistoryCard({ item, latest }: { item: HistoryItem; latest: boolean }) {
  const urgent = /URG/.test(item.tipo);
  return (
    <article className={cn("space-y-2 rounded-lg border p-3", latest ? "border-critical/40 bg-critical/5" : "border-border")}>
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-sm font-semibold tabular-nums">{formatStamp(item.createdAt) || item.data}</span>
        {latest && <span className="rounded-full bg-critical px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-critical-foreground">Mais recente</span>}
        {item.tipo && (
          <span
            className={cn(
              "ml-auto rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide",
              urgent ? "border-critical/40 text-critical" : "border-border text-muted-foreground"
            )}
          >
            {item.tipo}
          </span>
        )}
      </div>
      <dl className="grid gap-x-3 gap-y-1 text-xs sm:grid-cols-[auto_1fr]">
        {item.hemocomponentes && (
          <>
            <dt className="text-muted-foreground">Hemocomponentes</dt>
            <dd className="font-medium">{item.hemocomponentes}</dd>
          </>
        )}
        {item.indicacao && (
          <>
            <dt className="text-muted-foreground">Indicação</dt>
            <dd>{item.indicacao}</dd>
          </>
        )}
        {item.hbHt && (
          <>
            <dt className="text-muted-foreground">Hb/Ht</dt>
            <dd>{item.hbHt}</dd>
          </>
        )}
      </dl>
      {item.documentos.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {item.documentos.map((d) => (
            <span key={d} className="inline-flex items-center gap-1 rounded-md bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground">
              <FileText className="h-3 w-3" />
              {d}
            </span>
          ))}
        </div>
      )}
      <p className="text-[11px] text-muted-foreground">
        {[item.author && `Por ${item.author}`, item.bed && `Leito ${item.bed}`, item.department].filter(Boolean).join(" · ")}
      </p>
    </article>
  );
}

export function HemoRequestDialog({ patient, open, onOpenChange }: HemoRequestDialogProps) {
  const { toast } = useToast();
  const { user } = useAuth();
  const { currentHospital, currentState } = useHospital();
  const { currentDepartment } = useDepartment();
  const [form, setForm] = useState<HemoForm>(() => buildDefaultHemoForm(patient, { department: currentDepartment }));
  const [progress, setProgress] = useState<Progress | null>(null);
  const [errors, setErrors] = useState<string[]>([]);
  const [tab, setTab] = useState<"nova" | "historico">("nova");
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const submitting = progress !== null;

  const loadHistory = useCallback(async () => {
    const name = (patient.name || "").trim();
    if (!currentHospital?.id || !name) {
      setHistory([]);
      return;
    }
    setHistoryLoading(true);
    try {
      const { data, error } = await (supabase.from as any)("medical_reports")
        .select("id, created_at, created_by, created_by_email, patient_name, patient_bed, department, report_content")
        .eq("hospital_unit_id", currentHospital.id)
        .ilike("patient_name", name)
        .like("report_content", `${HEMO_HISTORY_PREFIX}%`)
        .order("created_at", { ascending: false })
        .limit(50);
      if (error) throw error;
      const rows = ((data || []) as any[]).filter((r) => isSamePatientHemoRecord(r, patient));
      const ids = [...new Set(rows.map((r) => r.created_by).filter(Boolean))] as string[];
      const names: Record<string, string> = {};
      if (ids.length) {
        const { data: profiles } = await supabase.from("profiles").select("id, full_name").in("id", ids);
        (profiles || []).forEach((p: any) => {
          if (p.full_name) names[p.id] = String(p.full_name).toUpperCase();
        });
      }
      setHistory(
        rows.map((r) => ({
          ...parseHemoHistory(r.report_content),
          id: r.id,
          createdAt: r.created_at,
          author: names[r.created_by] || r.created_by_email || "",
          bed: r.patient_bed || "",
          department: r.department || "",
        }))
      );
    } catch (e) {
      console.error("Erro ao carregar histórico de hemocomponentes:", e);
    } finally {
      setHistoryLoading(false);
    }
  }, [currentHospital?.id, patient]);

  // Fresh form each time it opens, with the logged-in doctor's name, and the patient's request history.
  useEffect(() => {
    if (!open) return;
    setErrors([]);
    setTab("nova");
    setProgress(null);
    setForm(buildDefaultHemoForm(patient, { department: currentDepartment }));
    loadHistory();
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

  const selectedKeys = useMemo(() => HEMO_DOCS.filter((d) => form.docs[d.key]).map((d) => d.key), [form.docs]);
  const selectedCount = selectedKeys.length;
  const isMale = form.sexo === "M";
  const latest = history[0];

  const saveToHistory = async () => {
    if (!currentHospital?.id || !currentState?.id) return;
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
  };

  const handleGenerate = async () => {
    const problems = validateHemoForm(form);
    setErrors(problems);
    if (problems.length) return;

    // Open the print window now, while the click still counts — browsers block it after waiting.
    const win = window.open("", "_blank");
    if (win) {
      try {
        win.document.open();
        win.document.write(HEMO_PRINT_LOADING_HTML);
        win.document.close();
      } catch {
        /* window still usable */
      }
    }

    const keys = [...selectedKeys];
    setProgress({ keys, index: 0, finished: false });
    try {
      const values = buildHemoFieldValues(form);
      if (win) {
        const docs: HemoPrintDoc[] = [];
        for (let i = 0; i < keys.length; i++) {
          setProgress({ keys, index: i, finished: false });
          const meta = HEMO_DOCS.find((d) => d.key === keys[i])!;
          const bytes = await generateHemoDocPdf(values, keys[i]);
          docs.push({ key: meta.key, title: meta.title, detail: meta.detail, pages: await renderPdfPages(bytes) });
        }
        const html = buildHemoPrintHtml(docs, { patientName: form.nome.trim() || patient.name, issuedAt: `${form.data} ${form.hora}`.trim() });
        const url = URL.createObjectURL(new Blob([html], { type: "text/html" }));
        win.location.replace(`${url}#/${keys[0]}`);
        setTimeout(() => URL.revokeObjectURL(url), 10 * 60_000);
      } else {
        // Pop-ups blocked: download one PDF with every selected document.
        const bytes = await generateHemoPdf(values, form.docs);
        const url = URL.createObjectURL(new Blob([bytes as BlobPart], { type: "application/pdf" }));
        const a = document.createElement("a");
        a.href = url;
        a.download = `SOLICITACAO_HEMOCOMPONENTES_${form.nome.replace(/\s+/g, "_")}.pdf`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        setTimeout(() => URL.revokeObjectURL(url), 120_000);
      }

      setProgress({ keys, index: keys.length - 1, finished: true });
      await saveToHistory();
      await new Promise((r) => setTimeout(r, 650));
      toast({
        title: "Documentos gerados",
        description: win
          ? `${keys.length} documento(s) abertos em abas na janela de impressão. Solicitação registrada no histórico.`
          : "O navegador bloqueou a janela de impressão; o PDF foi baixado. Solicitação registrada no histórico.",
      });
      onOpenChange(false);
    } catch (e: any) {
      console.error("Erro ao gerar documentos de hemocomponentes:", e);
      win?.close();
      toast({ title: "Não foi possível gerar os documentos", description: e?.message || "Tente novamente.", variant: "destructive" });
    } finally {
      setProgress(null);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !submitting && onOpenChange(o)}>
      <DialogContent className="flex max-h-[92vh] max-w-2xl flex-col gap-3 overflow-hidden p-4 sm:p-6">
        {progress && <GeneratingOverlay progress={progress} />}

        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Droplet className="h-5 w-5 text-critical" />
            Solicitar Hemocomponentes
          </DialogTitle>
          <DialogDescription>
            Os dados do paciente já vêm preenchidos. Complete o que precisar — campos vazios saem em branco nos documentos.
          </DialogDescription>
        </DialogHeader>

        <Tabs value={tab} onValueChange={(v) => setTab(v as "nova" | "historico")} className="flex min-h-0 flex-1 flex-col">
          <TabsList className="grid h-9 w-full grid-cols-2">
            <TabsTrigger value="nova" className="gap-1.5 text-xs">
              <Printer className="h-3.5 w-3.5" />
              Nova solicitação
            </TabsTrigger>
            <TabsTrigger value="historico" className="gap-1.5 text-xs">
              <History className="h-3.5 w-3.5" />
              Histórico
              {history.length > 0 && (
                <span className="min-w-[1.25rem] rounded-full bg-critical px-1.5 text-[10px] font-semibold leading-4 text-critical-foreground tabular-nums">
                  {history.length}
                </span>
              )}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="nova" className="-mx-4 mt-3 min-h-0 flex-1 overflow-y-auto px-4 sm:-mx-6 sm:px-6">
            <div className="space-y-5 pb-1">
              {latest && (
                <button
                  type="button"
                  onClick={() => setTab("historico")}
                  className="flex w-full items-center gap-2.5 rounded-lg border border-critical/30 bg-critical/5 px-3 py-2 text-left transition-colors hover:bg-critical/10"
                >
                  <History className="h-4 w-4 shrink-0 text-critical" />
                  <span className="min-w-0 flex-1 text-xs leading-snug">
                    <span className="font-semibold">Última solicitação: {formatStamp(latest.createdAt) || latest.data}</span>
                    {latest.hemocomponentes && <span className="block truncate text-muted-foreground">{latest.hemocomponentes}</span>}
                  </span>
                  <span className="flex shrink-0 items-center text-[11px] font-medium text-critical">
                    Ver histórico
                    <ChevronRight className="h-3.5 w-3.5" />
                  </span>
                </button>
              )}

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
                <p className="text-[11px] text-muted-foreground">Cada documento abre em sua própria aba na janela de impressão.</p>
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
                  <Field label="Sexo" group>
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
                  <Field label="Grupo sanguíneo" group>
                    <Choice value={form.grupo as "A" | "B" | "AB" | "O" | ""} options={["A", "B", "AB", "O"].map((g) => ({ value: g as "A", label: g }))} onChange={(v) => set("grupo", v)} />
                  </Field>
                  <Field label="Fator RH" group>
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
                  <Field label="Transfusões prévias?" group><Choice value={form.transfPrevias} options={YES_NO} onChange={(v) => set("transfPrevias", v)} /></Field>
                  <Field label="Teve reação transfusional?" group><Choice value={form.reacao} options={YES_NO} onChange={(v) => set("reacao", v)} /></Field>
                  <Field label="Qual tipo?" className="col-span-2"><Input {...text("qualTipo")} /></Field>
                  {!isMale && (
                    <>
                      <Field label="Está gestante?" group><Choice value={form.gestante} options={YES_NO} onChange={(v) => set("gestante", v)} /></Field>
                      <Field label="Gestações anteriores?" group><Choice value={form.gestacoes} options={YES_NO} onChange={(v) => set("gestacoes", v)} /></Field>
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
          </TabsContent>

          <TabsContent value="historico" className="-mx-4 mt-3 min-h-0 flex-1 overflow-y-auto px-4 sm:-mx-6 sm:px-6">
            {historyLoading && history.length === 0 ? (
              <div className="space-y-2">
                {[0, 1].map((i) => (
                  <div key={i} className="h-24 animate-pulse rounded-lg bg-muted" />
                ))}
              </div>
            ) : history.length === 0 ? (
              <div className="flex flex-col items-center gap-2 py-12 text-center">
                <History className="h-8 w-8 text-muted-foreground/50" />
                <p className="text-sm text-muted-foreground">Nenhuma solicitação anterior para este paciente.</p>
              </div>
            ) : (
              <div className="space-y-2 pb-1">
                <p className="text-[11px] text-muted-foreground">
                  {history.length} solicitaç{history.length === 1 ? "ão" : "ões"} deste paciente, da mais recente para a mais antiga.
                </p>
                {history.map((item, i) => (
                  <HistoryCard key={item.id} item={item} latest={i === 0} />
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>

        {tab === "nova" ? (
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => onOpenChange(false)} disabled={submitting}>Cancelar</Button>
            <Button onClick={handleGenerate} disabled={submitting || selectedCount === 0}>
              {submitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Printer className="mr-2 h-4 w-4" />}
              Gerar {selectedCount} documento{selectedCount === 1 ? "" : "s"}
            </Button>
          </DialogFooter>
        ) : (
          <DialogFooter>
            <Button onClick={() => setTab("nova")}>
              <Printer className="mr-2 h-4 w-4" />
              Nova solicitação
            </Button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
}
