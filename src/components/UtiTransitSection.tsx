import { useEffect, useMemo, useState } from "react";
import { ArrowRightLeft, BedDouble, ChevronDown, Clock, Loader2, MessageSquare, UserPlus } from "lucide-react";
import type { Patient } from "@/types/patient";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { getPatientAgeDisplay } from "@/utils/ageDisplay";
import { formatTps } from "@/utils/stayTime";
import { AdminIdentifiers } from "@/components/patient-card/AdminIdentifiers";
import type { UtiUnit } from "@/utils/utiTransfer";
import {
  transitForBed,
  transitForUnitSection,
  transitWaitMinutes,
  unitOfUtiBed,
  vacantBedsOfUnit,
  type TransitPatient,
} from "@/utils/utiTransit";

type AllocateFn = (transitId: string, bedId: string) => Promise<{ data: { target_bed?: string; unit?: string } | null; error: { message: string } | null }>;

const UNITS: UtiUnit[] = ["UTI 1", "UTI 2"];

function useNowTick(ms = 60000) {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = window.setInterval(() => setNow(new Date()), ms);
    return () => window.clearInterval(id);
  }, [ms]);
  return now;
}

function useCanAllocate() {
  const { role } = useAuth();
  return role === "medico" || role === "admin";
}

/** Same bar as the emergency "aguardando leito" flow: status • destination • waiting time. */
function TransitStatusBar({ patient, now }: { patient: TransitPatient; now: Date }) {
  const discussing = patient.allocationStatus === "discussing";
  const Icon = discussing ? MessageSquare : Clock;
  const elapsed = formatTps(transitWaitMinutes(patient.transitStartedAt, now));
  return (
    <div className={cn("allocation-status-bar py-1 px-3 flex items-center justify-center gap-2 rounded-t-lg", patient.transitTargetUnit === "UTI 2" ? "sector-yellow" : "sector-blue")}>
      <Icon className={cn("h-3.5 w-3.5 relative z-10", discussing ? "icon-discussing" : "icon-pending")} />
      <span className={cn("text-xs font-semibold relative z-10 uppercase", discussing ? "status-discussing" : "status-pending")}>
        {discussing ? "EM DISCUSSÃO" : "AGUARDANDO LEITO"}
      </span>
      <span className="separator relative z-10">•</span>
      <span className="text-xs font-semibold relative z-10 status-destination uppercase">PARA: {patient.transitTargetUnit}</span>
      <span className="separator relative z-10">•</span>
      <span className="text-xs font-semibold relative z-10 status-time uppercase">HÁ {elapsed.toUpperCase()}</span>
    </div>
  );
}

const COLUMNS: { label: string; key: keyof Patient }[] = [
  { label: "Hipóteses / Diagnósticos", key: "diagnoses" },
  { label: "Antecedentes / Comorbidades", key: "medicalHistory" },
  { label: "Exames", key: "relevantExams" },
  { label: "Plano Terapêutico", key: "utiDailyConducts" },
  { label: "Programações / Pendências", key: "pendencies" },
];

function TransitPatientCard({
  patient,
  now,
  canAllocate,
  onAllocate,
  onToggleDiscussing,
}: {
  patient: TransitPatient;
  now: Date;
  canAllocate: boolean;
  onAllocate: () => void;
  onToggleDiscussing: () => void;
}) {
  const [open, setOpen] = useState(false);
  const { toast } = useToast();
  const age = getPatientAgeDisplay(patient);
  const origin = patient.utiOriginSector?.[0];
  const copy = (text: string, label: string) => {
    navigator.clipboard?.writeText(text);
    toast({ title: `${label} copiado` });
  };

  return (
    <div className="border border-border/60 rounded-lg shadow-md overflow-hidden bg-card patient-card-glass" data-transit-id={patient.id}>
      <TransitStatusBar patient={patient} now={now} />
      <Collapsible open={open} onOpenChange={setOpen}>
        <div className="p-2 flex flex-col md:flex-row md:items-center gap-2">
          <div className="flex items-start gap-2 flex-1 min-w-0">
            <div className="shrink-0 px-1.5 py-0.5 rounded border border-border bg-muted/40">
              <span className="text-xs font-bold text-muted-foreground w-8 text-center inline-block">{patient.bedNumber}</span>
            </div>
            <div className="min-w-0 flex-1 space-y-0.5">
              <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
                <span className="text-xs md:text-sm font-semibold break-words">{patient.name}</span>
                {patient.birthDate && <span className="text-[11px] text-muted-foreground tabular-nums">DN {patient.birthDate}</span>}
                {age && <span className="text-[11px] font-medium text-muted-foreground">{age}</span>}
                <AdminIdentifiers patient={patient} onCopy={copy} />
              </div>
              {origin && <p className="text-[11px] text-muted-foreground uppercase">DE: {origin}</p>}
            </div>
          </div>
          <div className="flex items-center gap-1.5 shrink-0 self-end md:self-auto">
            {canAllocate && (
              <>
                <Button variant="outline" size="sm" className="h-7 text-xs gap-1.5" onClick={onToggleDiscussing}>
                  <MessageSquare className="h-3.5 w-3.5" />
                  {patient.allocationStatus === "discussing" ? "Voltar a aguardar" : "Em discussão"}
                </Button>
                <Button size="sm" className="h-7 text-xs gap-1.5" onClick={onAllocate}>
                  <BedDouble className="h-3.5 w-3.5" />
                  Alocar em leito
                </Button>
              </>
            )}
            <CollapsibleTrigger asChild>
              <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground" title={open ? "Recolher" : "Ver dados clínicos"}>
                <ChevronDown className={cn("h-4 w-4 transition-transform", open && "rotate-180")} />
              </Button>
            </CollapsibleTrigger>
          </div>
        </div>
        <CollapsibleContent>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-2 px-2 pb-2">
            {COLUMNS.map((c) => {
              const items = (patient[c.key] as string[] | undefined) || [];
              return (
                <div key={c.label} className="rounded-md border border-border/50 bg-muted/20 p-1.5">
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground mb-1">{c.label}</p>
                  {items.length === 0 ? (
                    <p className="text-[11px] text-muted-foreground/60 italic">—</p>
                  ) : (
                    <ul className="space-y-0.5">
                      {items.map((it, i) => (
                        <li key={i} className="text-[11px] leading-snug break-words">• {it}</li>
                      ))}
                    </ul>
                  )}
                </div>
              );
            })}
          </div>
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
}

/** Pick a vacant bed for a waiting patient (the indicated UTI first; the other UTI is allowed). */
function PickBedDialog({
  patient,
  beds,
  onClose,
  allocate,
  onAllocated,
}: {
  patient: TransitPatient | null;
  beds: Patient[];
  onClose: () => void;
  allocate: AllocateFn;
  onAllocated?: () => void;
}) {
  const { toast } = useToast();
  const [unit, setUnit] = useState<UtiUnit>("UTI 1");
  const [selected, setSelected] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (patient) {
      setUnit(patient.transitTargetUnit);
      setSelected(null);
    }
  }, [patient]);

  const vacant = useMemo(() => vacantBedsOfUnit(beds, unit), [beds, unit]);
  const bed = vacant.find((b) => b.id === selected) || null;

  const confirm = async () => {
    if (!patient || !bed) return;
    setBusy(true);
    const { error } = await allocate(patient.id, bed.id);
    setBusy(false);
    if (error) {
      toast({ title: "Alocação não realizada", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: "Paciente alocado", description: `${patient.name} agora está em ${unit} – leito ${bed.bedNumber}.` });
    onAllocated?.();
    onClose();
  };

  return (
    <Dialog open={!!patient} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <BedDouble className="h-5 w-5 text-primary" />
            Alocar em leito
          </DialogTitle>
          <DialogDescription>
            {patient?.name} — indicado para {patient?.transitTargetUnit}. Escolha o leito vago.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-2">
            {UNITS.map((u) => (
              <Button key={u} type="button" variant={unit === u ? "default" : "outline"} onClick={() => { setUnit(u); setSelected(null); }}>
                {u}
              </Button>
            ))}
          </div>
          {vacant.length === 0 ? (
            <p className="text-sm text-muted-foreground rounded-md border border-dashed border-border p-3">
              Não há leito vago na {unit} no momento. O paciente continua em trânsito.
            </p>
          ) : (
            <div className="grid grid-cols-5 gap-2">
              {vacant.map((b) => (
                <button
                  key={b.id}
                  type="button"
                  onClick={() => setSelected(b.id)}
                  className={cn(
                    "rounded-md border px-2 py-2 text-sm font-bold tabular-nums transition-colors",
                    selected === b.id ? "border-primary bg-primary/10 text-primary" : "border-border text-foreground hover:border-primary/50 hover:bg-primary/5"
                  )}
                >
                  {b.bedNumber}
                </button>
              ))}
            </div>
          )}
          <p className="text-[11px] text-muted-foreground">
            Os dados clínicos vão junto. Admissão na UTI = hoje (DIH 0).
          </p>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={busy}>Cancelar</Button>
          <Button onClick={confirm} disabled={!bed || busy}>
            {busy ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <ArrowRightLeft className="h-4 w-4 mr-2" />}
            {bed ? `Alocar em ${unit} – ${bed.bedNumber}` : "Escolha um leito"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

interface UtiTransitSectionProps {
  unit: UtiUnit;
  transitPatients: TransitPatient[];
  utiBeds: Patient[];
  allocate: AllocateFn;
  setDiscussing: (id: string, discussing: boolean) => Promise<{ error: unknown }>;
  onAllocated?: () => void;
}

/** "Em trânsito · Aguardando alocação" — waiting patients indicated for this UTI. */
export function UtiTransitSection({ unit, transitPatients, utiBeds, allocate, setDiscussing, onAllocated }: UtiTransitSectionProps) {
  const list = useMemo(() => transitForUnitSection(transitPatients, unit), [transitPatients, unit]);
  const [open, setOpen] = useState(list.length > 0);
  const [picking, setPicking] = useState<TransitPatient | null>(null);
  const canAllocate = useCanAllocate();
  const now = useNowTick();

  useEffect(() => {
    setOpen(list.length > 0);
  }, [list.length]);

  return (
    <Collapsible open={open} onOpenChange={setOpen} className="space-y-2 print:hidden">
      <div className="bg-slate-50/80 dark:bg-slate-900/40 border-l-2 border-l-amber-500/70 rounded-xl p-1.5 md:p-2 border border-border/50 shadow-md min-h-[44px] md:min-h-[48px] flex items-center">
        <div className="flex items-center justify-between w-full gap-2">
          <CollapsibleTrigger asChild>
            <button className="flex items-center gap-1.5 md:gap-2 hover:opacity-80 transition-opacity flex-1 min-w-0 text-left">
              <ChevronDown className={cn("h-4 w-4 md:h-5 md:w-5 shrink-0 transition-transform text-slate-500 dark:text-slate-400", !open && "-rotate-90")} />
              <h2 className="text-sm md:text-lg font-bold uppercase leading-tight text-slate-700 dark:text-slate-200">
                Em trânsito <span className="font-medium text-muted-foreground">· Aguardando alocação</span>
              </h2>
            </button>
          </CollapsibleTrigger>
          <div className="flex items-center justify-center h-9 w-9 rounded-lg border border-slate-300/60 bg-white dark:bg-slate-800/60 shrink-0">
            <p className="text-base font-bold text-slate-700 dark:text-slate-200">{list.length}</p>
          </div>
        </div>
      </div>
      <CollapsibleContent className="space-y-2">
        {list.length === 0 ? (
          <p className="text-sm text-muted-foreground rounded-lg border border-dashed border-border p-3 text-center">
            Nenhum paciente em trânsito para a {unit}.
          </p>
        ) : (
          list.map((p) => (
            <TransitPatientCard
              key={p.id}
              patient={p}
              now={now}
              canAllocate={canAllocate}
              onAllocate={() => setPicking(p)}
              onToggleDiscussing={() => setDiscussing(p.id, p.allocationStatus !== "discussing")}
            />
          ))
        )}
      </CollapsibleContent>
      <PickBedDialog patient={picking} beds={utiBeds} onClose={() => setPicking(null)} allocate={allocate} onAllocated={onAllocated} />
    </Collapsible>
  );
}

/** Button on a vacant UTI bed: the UTI picks which waiting patient goes into this bed. */
export function ReceiveTransitButton({
  bed,
  transitPatients,
  allocate,
  onAllocated,
}: {
  bed: Patient;
  transitPatients: TransitPatient[];
  allocate: AllocateFn;
  onAllocated?: () => void;
}) {
  const canAllocate = useCanAllocate();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const now = useNowTick();
  const unit = unitOfUtiBed(bed.sector);
  const options = useMemo(() => transitForBed(transitPatients, unit), [transitPatients, unit]);

  if (!canAllocate || options.length === 0) return null;
  const chosen = options.find((p) => p.id === selected) || null;

  const confirm = async () => {
    if (!chosen) return;
    setBusy(true);
    const { error } = await allocate(chosen.id, bed.id);
    setBusy(false);
    if (error) {
      toast({ title: "Alocação não realizada", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: "Paciente alocado", description: `${chosen.name} agora está em ${unit} – leito ${bed.bedNumber}.` });
    setOpen(false);
    onAllocated?.();
  };

  return (
    <>
      <Button variant="outline" size="sm" className="h-7 text-xs gap-1.5 border-amber-500/50 text-amber-700 dark:text-amber-300 hover:bg-amber-50 dark:hover:bg-amber-950/30" onClick={() => { setSelected(null); setOpen(true); }}>
        <UserPlus className="h-3.5 w-3.5" />
        Receber em trânsito ({options.length})
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <BedDouble className="h-5 w-5 text-primary" />
              Receber no leito {bed.bedNumber} · {unit}
            </DialogTitle>
            <DialogDescription>Escolha o paciente em trânsito que vai ocupar este leito.</DialogDescription>
          </DialogHeader>
          <div className="space-y-2 max-h-[50vh] overflow-y-auto">
            {options.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => setSelected(p.id)}
                className={cn(
                  "w-full text-left rounded-md border px-3 py-2 transition-colors",
                  selected === p.id ? "border-primary bg-primary/10" : "border-border hover:border-primary/50 hover:bg-primary/5"
                )}
              >
                <div className="flex items-baseline justify-between gap-2">
                  <span className="text-sm font-semibold break-words">{p.name}</span>
                  <span className="text-[11px] text-muted-foreground shrink-0 tabular-nums">há {formatTps(transitWaitMinutes(p.transitStartedAt, now))}</span>
                </div>
                <p className="text-[11px] text-muted-foreground uppercase">
                  Indicado para {p.transitTargetUnit}{p.utiOriginSector?.[0] ? ` · de ${p.utiOriginSector[0]}` : ""}
                </p>
              </button>
            ))}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)} disabled={busy}>Cancelar</Button>
            <Button onClick={confirm} disabled={!chosen || busy}>
              {busy ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <ArrowRightLeft className="h-4 w-4 mr-2" />}
              {chosen ? `Alocar no leito ${bed.bedNumber}` : "Escolha um paciente"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
