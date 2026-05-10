import { useEffect, useMemo, useState } from "react";
import {
  BedDouble,
  Plus,
  Filter,
  ArrowRight,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Sparkles,
  Lock,
  Unlock,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";
import {
  useManagedBeds,
  BED_STATUS_LABELS,
  BED_STATUS_COLORS,
  type BedStatus,
  type ManagedBed,
} from "@/hooks/useManagedBeds";
import {
  useBedRequests,
  REQUEST_TYPE_LABELS,
  PRIORITY_LABELS,
  type BedRequestType,
  type BedRequestPriority,
} from "@/hooks/useBedRequests";
import { toast } from "sonner";
import { BedPageHeader } from "@/components/bed-panel/BedPageHeader";

const ALL_STATUSES: BedStatus[] = [
  "available",
  "reserved",
  "occupied",
  "medical_discharge",
  "admin_discharge",
  "vacated_dirty",
  "cleaning_in_progress",
  "cleaning_done",
  "blocked",
];

// Suggested next status by current status (canonical cycle)
const NEXT_STATUS: Partial<Record<BedStatus, BedStatus[]>> = {
  occupied: ["medical_discharge"],
  medical_discharge: ["admin_discharge"],
  admin_discharge: ["vacated_dirty"],
  vacated_dirty: ["cleaning_in_progress"],
  cleaning_in_progress: ["cleaning_done"],
  cleaning_done: ["available"],
  available: ["reserved", "occupied"],
  reserved: ["occupied"],
  blocked: ["available"],
};

function formatElapsed(iso: string) {
  const ms = Date.now() - new Date(iso).getTime();
  const m = Math.max(0, Math.floor(ms / 60000));
  if (m < 60) return `${m}min`;
  const h = Math.floor(m / 60);
  const r = m % 60;
  return `${h}h${r ? ` ${r}min` : ""}`;
}

function elapsedMinutes(iso: string) {
  return Math.max(0, Math.floor((Date.now() - new Date(iso).getTime()) / 60000));
}

function BedTile({
  bed,
  onClick,
}: {
  bed: ManagedBed;
  onClick: () => void;
}) {
  const [, setTick] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setTick((x) => x + 1), 30000);
    return () => clearInterval(t);
  }, []);
  const elapsed = elapsedMinutes(bed.status_changed_at);
  const operational: BedStatus[] = [
    "medical_discharge",
    "admin_discharge",
    "vacated_dirty",
    "cleaning_in_progress",
  ];
  const slaWarning = operational.includes(bed.current_status) && elapsed >= 60;
  const slaCritical = operational.includes(bed.current_status) && elapsed >= 120;
  const isAvailable = bed.current_status === "available";

  return (
    <TooltipProvider delayDuration={300}>
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            onClick={onClick}
            className={cn(
              "group text-left p-3 rounded-lg border transition-all duration-200 ease-in-out hover:shadow-md hover:scale-[1.02]",
              BED_STATUS_COLORS[bed.current_status],
              slaCritical && "ring-[2px] ring-red-500 animate-pulse",
              slaWarning && !slaCritical && "ring-[2px] ring-amber-500"
            )}
          >
            <div className="flex items-start justify-between gap-2">
              <div className="text-[10px] uppercase tracking-wider opacity-70 truncate">
                {bed.sector}
              </div>
              <BedDouble className="h-4 w-4 opacity-60 flex-shrink-0" />
            </div>
            <div className="mt-1 text-base font-mono font-bold text-center leading-tight">
              {bed.bed_number}
            </div>
            <div className="mt-1 text-[10px] font-semibold uppercase text-center opacity-80 truncate">
              {BED_STATUS_LABELS[bed.current_status]}
            </div>
            {bed.current_patient_name && (
              <div className="mt-1 text-[10px] opacity-80 truncate text-center">
                {bed.current_patient_name}
              </div>
            )}
            <div className={cn(
              "mt-2 flex items-center justify-center gap-1 text-xs font-mono tabular-nums",
              isAvailable ? "text-muted-foreground" : "opacity-80"
            )}>
              <Clock className="h-3 w-3" />
              {formatElapsed(bed.status_changed_at)}
              {slaCritical && (
                <AlertTriangle className="h-3 w-3 text-red-600 ml-0.5" />
              )}
            </div>
          </button>
        </TooltipTrigger>
        <TooltipContent side="top" className="text-xs">
          <div className="font-semibold uppercase tracking-wide">
            {BED_STATUS_LABELS[bed.current_status]}
          </div>
          {bed.current_patient_name && (
            <div className="text-[11px] opacity-90 uppercase mt-0.5">
              {bed.current_patient_name}
            </div>
          )}
          <div className="text-[11px] opacity-70 font-mono mt-0.5">
            há {formatElapsed(bed.status_changed_at)}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

function NewRequestForm({ onClose }: { onClose: () => void }) {
  const { createRequest } = useBedRequests();
  const [requestType, setRequestType] = useState<BedRequestType>("enfermaria");
  const [priority, setPriority] = useState<BedRequestPriority>("normal");
  const [patientName, setPatientName] = useState("");
  const [patientAge, setPatientAge] = useState("");
  const [originSector, setOriginSector] = useState("");
  const [destSector, setDestSector] = useState("");
  const [destBed, setDestBed] = useState("");
  const [summary, setSummary] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!patientName.trim()) {
      toast.error("Informe o nome do paciente");
      return;
    }
    setSubmitting(true);
    const ok = await createRequest({
      request_type: requestType,
      priority,
      patient_name: patientName,
      patient_age: patientAge,
      origin_sector: originSector,
      destination_sector: destSector,
      destination_bed: destBed,
      clinical_summary: summary,
    });
    setSubmitting(false);
    if (ok) onClose();
  };

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="text-xs font-semibold uppercase">Tipo</label>
          <Select value={requestType} onValueChange={(v) => setRequestType(v as BedRequestType)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="enfermaria">Enfermaria</SelectItem>
              <SelectItem value="uti">UTI</SelectItem>
              <SelectItem value="transporte">Transporte / Condutor</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <label className="text-xs font-semibold uppercase">Prioridade</label>
          <Select value={priority} onValueChange={(v) => setPriority(v as BedRequestPriority)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="low">Baixa</SelectItem>
              <SelectItem value="normal">Normal</SelectItem>
              <SelectItem value="high">Alta</SelectItem>
              <SelectItem value="urgent">Urgente</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      <div>
        <label className="text-xs font-semibold uppercase">Paciente</label>
        <Input value={patientName} onChange={(e) => setPatientName(e.target.value.toUpperCase())} placeholder="NOME COMPLETO" />
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="text-xs font-semibold uppercase">Idade</label>
          <Input value={patientAge} onChange={(e) => setPatientAge(e.target.value)} placeholder="Ex.: 67A" />
        </div>
        <div>
          <label className="text-xs font-semibold uppercase">Setor de origem</label>
          <Input value={originSector} onChange={(e) => setOriginSector(e.target.value.toUpperCase())} placeholder="EX.: OBSERVAÇÃO" />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="text-xs font-semibold uppercase">Setor destino</label>
          <Input value={destSector} onChange={(e) => setDestSector(e.target.value.toUpperCase())} placeholder="EX.: UTI 1" />
        </div>
        <div>
          <label className="text-xs font-semibold uppercase">Leito (opcional)</label>
          <Input value={destBed} onChange={(e) => setDestBed(e.target.value.toUpperCase())} placeholder="EX.: U03" />
        </div>
      </div>
      <div>
        <label className="text-xs font-semibold uppercase">Resumo clínico</label>
        <Input value={summary} onChange={(e) => setSummary(e.target.value.toUpperCase())} placeholder="QUADRO E JUSTIFICATIVA" />
      </div>
      <div className="flex justify-end gap-2 pt-2">
        <Button variant="outline" onClick={onClose}>Cancelar</Button>
        <Button onClick={handleSubmit} disabled={submitting}>
          {submitting ? "Enviando..." : "Criar solicitação"}
        </Button>
      </div>
    </div>
  );
}

export default function BedManagementPage() {
  const { beds, loading, updateBedStatus } = useManagedBeds();
  const { requests, updateRequestStatus } = useBedRequests();
  const [statusFilter, setStatusFilter] = useState<BedStatus | "all">("all");
  const [sectorFilter, setSectorFilter] = useState<string>("all");
  const [selectedBed, setSelectedBed] = useState<ManagedBed | null>(null);
  const [requestSheetOpen, setRequestSheetOpen] = useState(false);

  const sectors = useMemo(
    () => Array.from(new Set(beds.map((b) => b.sector))).sort(),
    [beds]
  );

  const filtered = useMemo(
    () =>
      beds.filter(
        (b) =>
          (statusFilter === "all" || b.current_status === statusFilter) &&
          (sectorFilter === "all" || b.sector === sectorFilter)
      ),
    [beds, statusFilter, sectorFilter]
  );

  const counters = useMemo(() => {
    const c: Record<string, number> = { total: beds.length };
    for (const s of ALL_STATUSES) c[s] = 0;
    for (const b of beds) c[b.current_status] = (c[b.current_status] || 0) + 1;
    return c;
  }, [beds]);

  const pendingRequests = requests.filter(
    (r) => r.status === "pending" || r.status === "accepted" || r.status === "in_progress"
  );

  const handleAdvance = async (next: BedStatus) => {
    if (!selectedBed) return;
    const extra: Partial<ManagedBed> = {};
    if (next === "available" || next === "vacated_dirty" || next === "cleaning_in_progress") {
      extra.current_patient_name = null;
      extra.current_patient_id = null;
    }
    const ok = await updateBedStatus(selectedBed.id, next, extra);
    if (ok) {
      toast.success(`Leito ${selectedBed.bed_number}${" → "}${BED_STATUS_LABELS[next]}`);
      setSelectedBed(null);
    }
  };

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-10 py-6 space-y-6 max-w-[1600px]">
      <BedPageHeader
        icon={BedDouble}
        title="Mapa de Leitos"
        subtitle="Ciclo operacional do leito em tempo real, solicitações e KPIs"
        badge="Operacional"
        accent="blue"
        actions={
          <>
            <Link to="/leitos/cadastro">
              <Button variant="outline" size="sm">
                <Plus className="h-4 w-4 mr-1" /> Cadastro de leitos
              </Button>
            </Link>
            <Link to="/leitos/painel">
              <Button variant="outline" size="sm">
                <Sparkles className="h-4 w-4 mr-1" /> Painel de solicitações
              </Button>
            </Link>
            <Button size="sm" onClick={() => setRequestSheetOpen(true)}>
              <Sparkles className="h-4 w-4 mr-1" /> Nova solicitação
            </Button>
          </>
        }
      />

      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-2">
        <Card className="p-3">
          <div className="text-[10px] uppercase text-muted-foreground">Total</div>
          <div className="text-2xl font-bold">{counters.total}</div>
        </Card>
        {(["available", "occupied", "vacated_dirty", "cleaning_in_progress", "blocked"] as BedStatus[]).map((s) => (
          <Card key={s} className="p-3">
            <div className="text-[10px] uppercase text-muted-foreground">
              {BED_STATUS_LABELS[s]}
            </div>
            <div className="text-2xl font-bold">{counters[s] || 0}</div>
          </Card>
        ))}
      </div>

      <Tabs defaultValue="map">
        <TabsList>
          <TabsTrigger value="map">Mapa de leitos</TabsTrigger>
          <TabsTrigger value="requests">
            Solicitações
            {pendingRequests.length > 0 && (
              <Badge variant="destructive" className="ml-2">{pendingRequests.length}</Badge>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="map" className="space-y-3">
          <Card className="p-3 flex flex-wrap gap-2 items-center">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <Select value={sectorFilter} onValueChange={setSectorFilter}>
              <SelectTrigger className="w-48 h-8">
                <SelectValue placeholder="Setor" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os setores</SelectItem>
                {sectors.map((s) => (
                  <SelectItem key={s} value={s}>{s}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as BedStatus | "all")}>
              <SelectTrigger className="w-56 h-8">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os status</SelectItem>
                {ALL_STATUSES.map((s) => (
                  <SelectItem key={s} value={s}>{BED_STATUS_LABELS[s]}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Card>

          {loading ? (
            <Card className="p-8 text-center text-sm text-muted-foreground">
              Carregando leitos...
            </Card>
          ) : filtered.length === 0 ? (
            <Card className="p-8 text-center">
              <BedDouble className="h-10 w-10 mx-auto text-muted-foreground/40 mb-2" />
              <p className="font-semibold">Nenhum leito cadastrado neste filtro</p>
              <p className="text-sm text-muted-foreground mt-1">
                Use o botão <strong>Cadastro de leitos</strong> para começar.
              </p>
            </Card>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-2">
              {filtered.map((b) => (
                <BedTile key={b.id} bed={b} onClick={() => setSelectedBed(b)} />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="requests" className="space-y-2">
          {requests.length === 0 ? (
            <Card className="p-8 text-center text-sm text-muted-foreground">
              Nenhuma solicitação registrada ainda.
            </Card>
          ) : (
            requests.slice(0, 50).map((r) => (
              <Card key={r.id} className="p-3 flex flex-wrap items-center gap-3">
                <Badge variant="outline" className="uppercase">{REQUEST_TYPE_LABELS[r.request_type]}</Badge>
                <Badge
                  variant={r.priority === "urgent" || r.priority === "high" ? "destructive" : "secondary"}
                >
                  {PRIORITY_LABELS[r.priority]}
                </Badge>
                <div className="flex-1 min-w-[180px]">
                  <div className="font-semibold text-sm">{r.patient_name}</div>
                  <div className="text-xs text-muted-foreground">
                    {r.origin_sector || "—"} <ArrowRight className="inline h-3 w-3" /> {r.destination_sector || "—"} {r.destination_bed && `(${r.destination_bed})`}
                  </div>
                </div>
                <Badge>{r.status}</Badge>
                <div className="flex gap-1">
                  {r.status === "pending" && (
                    <Button size="sm" variant="outline" onClick={() => updateRequestStatus(r.id, "accepted")}>
                      Aceitar
                    </Button>
                  )}
                  {r.status === "accepted" && (
                    <Button size="sm" variant="outline" onClick={() => updateRequestStatus(r.id, "in_progress")}>
                      Iniciar
                    </Button>
                  )}
                  {r.status === "in_progress" && (
                    <Button size="sm" onClick={() => updateRequestStatus(r.id, "completed")}>
                      <CheckCircle2 className="h-4 w-4 mr-1" /> Concluir
                    </Button>
                  )}
                  {(r.status === "pending" || r.status === "accepted") && (
                    <Button size="sm" variant="ghost" onClick={() => updateRequestStatus(r.id, "cancelled")}>
                      Cancelar
                    </Button>
                  )}
                </div>
              </Card>
            ))
          )}
        </TabsContent>
      </Tabs>

      {/* Drawer do leito */}
      <Sheet open={!!selectedBed} onOpenChange={(o) => !o && setSelectedBed(null)}>
        <SheetContent className="w-full sm:max-w-md">
          {selectedBed && (
            <>
              <SheetHeader>
                <SheetTitle className="flex items-center gap-2">
                  <BedDouble className="h-5 w-5" />
                  {selectedBed.sector} • {selectedBed.bed_number}
                </SheetTitle>
                <SheetDescription>
                  Status atual: <strong>{BED_STATUS_LABELS[selectedBed.current_status]}</strong> há {formatElapsed(selectedBed.status_changed_at)}
                </SheetDescription>
              </SheetHeader>

              <div className="mt-4 space-y-3">
                {selectedBed.current_patient_name && (
                  <Card className="p-3">
                    <div className="text-[10px] uppercase text-muted-foreground">Paciente atual</div>
                    <div className="font-semibold">{selectedBed.current_patient_name}</div>
                  </Card>
                )}

                <div>
                  <div className="text-xs font-semibold uppercase mb-2">Avançar ciclo</div>
                  <div className="flex flex-wrap gap-2">
                    {(NEXT_STATUS[selectedBed.current_status] || []).map((next) => (
                      <Button key={next} size="sm" onClick={() => handleAdvance(next)}>
                        <ArrowRight className="h-4 w-4 mr-1" /> {BED_STATUS_LABELS[next]}
                      </Button>
                    ))}
                  </div>
                </div>

                <div>
                  <div className="text-xs font-semibold uppercase mb-2">Outras ações</div>
                  <div className="flex flex-wrap gap-2">
                    {selectedBed.current_status !== "blocked" ? (
                      <Button size="sm" variant="outline" onClick={() => handleAdvance("blocked")}>
                        <Lock className="h-4 w-4 mr-1" /> Bloquear
                      </Button>
                    ) : (
                      <Button size="sm" variant="outline" onClick={() => handleAdvance("available")}>
                        <Unlock className="h-4 w-4 mr-1" /> Desbloquear
                      </Button>
                    )}
                    <Button size="sm" variant="outline" onClick={() => handleAdvance("available")}>
                      Forçar disponível
                    </Button>
                  </div>
                </div>

                <div className="pt-4 border-t flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setSelectedBed(null)}>
                    <ArrowRight className="h-4 w-4 mr-1 rotate-180" /> Voltar
                  </Button>
                </div>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>

      {/* Drawer nova solicitação */}
      <Sheet open={requestSheetOpen} onOpenChange={setRequestSheetOpen}>
        <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Nova solicitação</SheetTitle>
            <SheetDescription>
              UTI, enfermaria ou transporte/condutor — fluxo unificado.
            </SheetDescription>
          </SheetHeader>
          <div className="mt-4">
            <NewRequestForm onClose={() => setRequestSheetOpen(false)} />
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
