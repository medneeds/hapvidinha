import { useMemo, useState } from "react";
import { useBedRequestsPanel, PanelRequest, formatHHMM, getRequestStatusInfo, StageEval, SlaResolver } from "@/hooks/useBedRequestsPanel";
import { useHospital } from "@/contexts/HospitalContext";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import {
  DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { exportPanelExcel, exportPanelPDF } from "@/utils/bedPanelExport";
import { SlaConfigDialog } from "@/components/bed-panel/SlaConfigDialog";
import { BedPageHeader } from "@/components/bed-panel/BedPageHeader";
import { useIsMobile } from "@/hooks/use-mobile";
import {
  FileDown, FileSpreadsheet, RefreshCw, Search, Activity, AlertTriangle,
  Clock, CheckCircle2, Hourglass, ShieldAlert, Bed, ArrowRight, Inbox, Download,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const LEVEL_DOT: Record<string, string> = {
  ok: "bg-emerald-500 ring-emerald-300",
  warning: "bg-amber-500 ring-amber-300",
  late: "bg-destructive ring-destructive/40",
  in_progress: "bg-sky-500 ring-sky-300 animate-pulse",
  pending: "bg-muted ring-border",
};
const LEVEL_HEX: Record<string, string> = {
  ok: "#10b981",
  warning: "#f59e0b",
  late: "hsl(var(--destructive))",
  in_progress: "#0ea5e9",
  pending: "hsl(var(--border))",
};

function StageDot({ stage, label, time }: { stage: StageEval; label: string; time?: string }) {
  return (
    <div className="flex flex-col items-center gap-1 min-w-[64px]">
      <div className={cn(
        "h-3 w-3 rounded-full transition-all duration-200 ease-in-out",
        stage.level === "in_progress" ? "ring-2 ring-offset-2 ring-offset-background ring-sky-400" : "ring-2 ring-offset-2 ring-offset-background",
        LEVEL_DOT[stage.level]
      )} title={`SLA ${stage.slaMinutes}min · alerta ${stage.warningPct}%`} />
      <span className="text-[9px] uppercase tracking-wider text-muted-foreground">{label}</span>
      <span className="text-xs font-mono font-semibold tabular-nums">{time ?? "--:--"}</span>
      {stage.elapsedMin !== null && (
        <span className={cn(
          "text-[9px] font-mono tabular-nums",
          stage.level === "late" ? "text-destructive" :
          stage.level === "warning" ? "text-amber-600" :
          stage.level === "ok" ? "text-emerald-600" : "text-muted-foreground"
        )}>{formatHHMM(stage.elapsedMin)}/{formatHHMM(stage.slaMinutes)}</span>
      )}
    </div>
  );
}

function StageLine({ from, to }: { from: string; to: string }) {
  const start = LEVEL_HEX[from] ?? "hsl(var(--border))";
  const end = LEVEL_HEX[to] ?? "hsl(var(--border))";
  return (
    <div
      className="h-px flex-1 mt-1.5 opacity-60"
      style={{ background: `linear-gradient(to right, ${start}, ${end})` }}
    />
  );
}

function fmtTime(iso: string | null) {
  return iso ? new Date(iso).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }) : undefined;
}

function RequestRow({ r, onAdvance, resolver }: { r: PanelRequest; onAdvance: (id: string, patch: Partial<PanelRequest>, patientName?: string | null, label?: string) => void; resolver: SlaResolver }) {
  const info = getRequestStatusInfo(r, resolver);
  const stages = info.stages;
  const anyLate = stages.hotelaria.level === "late" || stages.leito.level === "late" || stages.transferencia.level === "late";
  const anyWarn = stages.hotelaria.level === "warning" || stages.leito.level === "warning" || stages.transferencia.level === "warning";
  const overall: "ok" | "late" | "warning" | "in_progress" | "pending" = info.completed
    ? (info.onTime ? "ok" : "late")
    : anyLate ? "late"
    : anyWarn ? "warning"
    : r.status === "pending" && !stages.hotelaria.done ? "pending"
    : "in_progress";

  const statusBadge = {
    ok: <Badge className="bg-emerald-100/90 text-emerald-700 hover:bg-emerald-100 border border-emerald-200/60 backdrop-blur-sm">CONCLUÍDO {formatHHMM(info.totalMin)}</Badge>,
    late: <Badge className="bg-destructive/15 text-destructive border border-destructive/30 backdrop-blur-sm">ATRASADO {formatHHMM(info.totalMin)}</Badge>,
    warning: <Badge className="bg-amber-100/90 text-amber-700 border border-amber-200/60 backdrop-blur-sm">ATENÇÃO SLA</Badge>,
    in_progress: <Badge className="bg-sky-100/90 text-sky-700 border border-sky-200/60 backdrop-blur-sm">EM ANDAMENTO</Badge>,
    pending: <Badge className="bg-rose-100/90 text-rose-700 border border-rose-200/60 backdrop-blur-sm">PENDENTE</Badge>,
  }[overall];

  const borderColor =
    overall === "ok" ? "hsl(142 71% 45%)" :
    overall === "late" ? "hsl(var(--destructive))" :
    overall === "warning" ? "hsl(38 92% 50%)" :
    overall === "in_progress" ? "hsl(199 89% 48%)" :
    "hsl(346 77% 50%)";

  const solicitStage: StageEval = { elapsedMin: 0, slaMinutes: 0, warningPct: 100, level: "ok", done: true };

  return (
    <Card
      className="p-4 shadow-sm hover:shadow-md transition-all duration-200 ease-in-out border-l-[3px] rounded-lg"
      style={{ borderLeftColor: borderColor }}
    >
      <div className="flex flex-wrap items-start gap-3 mb-3">
        <div className="flex items-center gap-2 min-w-0 flex-1 flex-wrap">
          <span className="font-mono text-xs text-muted-foreground">#{r.sequence_number ?? "—"}</span>
          <Badge variant="outline" className="text-[10px] uppercase">{r.requesting_sector ?? "—"}</Badge>
          <ArrowRight className="h-3 w-3 text-muted-foreground" />
          <Badge variant="outline" className="text-[10px] uppercase font-bold">{r.accommodation_type ?? r.requested_sector} {r.requested_bed ? `· ${r.requested_bed}` : ""}</Badge>
          {r.is_isolation && (
            <Badge className="bg-yellow-200 text-yellow-900 border-yellow-300 gap-1 text-[10px]">
              <ShieldAlert className="h-3 w-3" /> ISOLAMENTO
            </Badge>
          )}
        </div>
        {statusBadge}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-2 mb-3">
        <div>
          <div className="text-[9px] uppercase tracking-wider text-muted-foreground">Paciente</div>
          <div className="font-medium text-sm text-foreground uppercase">{r.patient_name ?? "—"}</div>
        </div>
        <div>
          <div className="text-[9px] uppercase tracking-wider text-muted-foreground">Diagnóstico</div>
          <div className="text-xs italic text-muted-foreground uppercase">{r.diagnosis ?? "—"}</div>
        </div>
        <div>
          <div className="text-[9px] uppercase tracking-wider text-muted-foreground">Solicitante</div>
          <div className="text-xs text-muted-foreground uppercase">{r.requesting_doctor_name ?? "—"}{r.requesting_office_number ? ` · C${r.requesting_office_number}` : ""}</div>
        </div>
        <div>
          <div className="text-[9px] uppercase tracking-wider text-muted-foreground">Lib. Hotelaria / Leito</div>
          <div className="text-xs text-muted-foreground uppercase">
            {(r.hotelaria_released_by ?? "—")} · {(r.bed_released_by ?? "—")}
          </div>
        </div>
      </div>

      {/* Divider */}
      <div className="border-t border-dashed border-foreground/10 my-3" />

      {/* Timeline */}
      <div className="flex items-start gap-1 mb-3">
        <StageDot stage={solicitStage} label="Solicit" time={fmtTime(r.created_at)} />
        <StageLine from="ok" to={stages.hotelaria.level} />
        <StageDot stage={stages.hotelaria} label="Hotelaria" time={fmtTime(r.hotelaria_released_at)} />
        <StageLine from={stages.hotelaria.level} to={stages.leito.level} />
        <StageDot stage={stages.leito} label="Leito Lib" time={fmtTime(r.bed_released_at)} />
        <StageLine from={stages.leito.level} to={stages.transferencia.level} />
        <StageDot stage={stages.transferencia} label="Transferido" time={fmtTime(r.transfer_completed_at)} />
      </div>

      <div className="flex flex-wrap gap-2 pt-2 border-t">
        {!r.hotelaria_released_at && (
          <Button
            size="sm"
            variant="outline"
            className="h-8 uppercase tracking-wide text-xs"
            onClick={() => onAdvance(r.id, { hotelaria_released_at: new Date().toISOString() }, r.patient_name, "Hotelaria liberada")}
          >
            <CheckCircle2 className="h-3 w-3 mr-1" /> Liberar Hotelaria
          </Button>
        )}
        {r.hotelaria_released_at && !r.bed_released_at && (
          <Button
            size="sm"
            variant="outline"
            className="h-8 uppercase tracking-wide text-xs"
            onClick={() => onAdvance(r.id, { bed_released_at: new Date().toISOString() }, r.patient_name, "Leito liberado")}
          >
            <Bed className="h-3 w-3 mr-1" /> Liberar Leito
          </Button>
        )}
        {r.bed_released_at && !r.transfer_completed_at && (
          <Button
            size="sm"
            variant="default"
            className="h-8 uppercase tracking-wide text-xs"
            onClick={() => onAdvance(r.id, { transfer_completed_at: new Date().toISOString(), status: "approved" }, r.patient_name, "Transferência concluída")}
          >
            <CheckCircle2 className="h-3 w-3 mr-1" /> Concluir Transferência
          </Button>
        )}
        {info.completed && (
          <span className="text-xs text-muted-foreground ml-auto self-center font-mono tabular-nums">
            Hotel: {formatHHMM(info.hotelMin)} · Total: {formatHHMM(info.totalMin)}
          </span>
        )}
      </div>
    </Card>
  );
}

function KPI({ icon: Icon, label, value, accent, last }: { icon: any; label: string; value: string | number; accent: string; last?: boolean }) {
  return (
    <div className={cn(
      "relative px-4 py-5 flex items-center gap-3 transition-all duration-200 ease-in-out",
      !last && "lg:border-r lg:border-border/20"
    )}>
      <div
        className="h-9 w-9 rounded-full flex items-center justify-center flex-shrink-0"
        style={{ background: `${accent}26`, color: accent }}
      >
        <Icon className="h-4 w-4" />
      </div>
      <div className="min-w-0">
        <div className="text-xl font-semibold tabular-nums leading-none">{value}</div>
        <div className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold mt-1">{label}</div>
      </div>
    </div>
  );
}

function KpiSkeleton() {
  return (
    <div className="px-4 py-5 flex items-center gap-3">
      <Skeleton className="h-9 w-9 rounded-full" />
      <div className="space-y-2 flex-1">
        <Skeleton className="h-5 w-12" />
        <Skeleton className="h-2.5 w-20" />
      </div>
    </div>
  );
}

function RequestRowSkeleton() {
  return (
    <Card className="p-4 border-l-[3px] rounded-lg shadow-sm">
      <div className="flex justify-between mb-3">
        <Skeleton className="h-4 w-48" />
        <Skeleton className="h-5 w-24" />
      </div>
      <div className="grid grid-cols-2 gap-3 mb-3">
        <Skeleton className="h-8 w-full" />
        <Skeleton className="h-8 w-full" />
        <Skeleton className="h-8 w-full" />
        <Skeleton className="h-8 w-full" />
      </div>
      <div className="border-t border-dashed border-foreground/10 my-3" />
      <Skeleton className="h-6 w-full" />
    </Card>
  );
}

export default function BedRequestsPanelPage() {
  const { requests, loading, kpis, refetch, updateStage, resolver } = useBedRequestsPanel();
  const { currentHospital } = useHospital();
  const isMobile = useIsMobile();
  const [search, setSearch] = useState("");
  const [sectorFilter, setSectorFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const sectors = useMemo(() => Array.from(new Set(requests.map((r) => r.requesting_sector).filter(Boolean) as string[])), [requests]);

  const filtered = useMemo(() => {
    const s = search.trim().toLowerCase();
    return requests.filter((r) => {
      if (sectorFilter !== "all" && r.requesting_sector !== sectorFilter) return false;
      if (statusFilter !== "all") {
        const info = getRequestStatusInfo(r, resolver);
        if (statusFilter === "completed" && !info.completed) return false;
        if (statusFilter === "pending" && r.status !== "pending") return false;
        if (statusFilter === "late" && !(info.completed && !info.onTime)) return false;
        if (statusFilter === "isolation" && !r.is_isolation) return false;
      }
      if (!s) return true;
      return [r.patient_name, r.diagnosis, r.requesting_doctor_name, r.requested_bed]
        .some((v) => (v ?? "").toLowerCase().includes(s));
    });
  }, [requests, search, sectorFilter, statusFilter, resolver]);

  const handleAdvance = async (id: string, patch: any, patientName?: string | null, label?: string) => {
    const ok = await updateStage(id, patch);
    if (ok) {
      toast.success(
        `${label ?? "Etapa atualizada"}${patientName ? ` · ${patientName.toUpperCase()}` : ""}`,
        { icon: <CheckCircle2 className="h-4 w-4 text-emerald-600" /> }
      );
    } else {
      toast.error("Falha ao atualizar");
    }
  };

  const clearFilters = () => {
    setSearch("");
    setSectorFilter("all");
    setStatusFilter("all");
  };

  const hospitalName = currentHospital?.name ?? "HOSPITAL";

  const exportActions = isMobile ? (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="h-8 rounded-md border border-white/30 bg-white/5 text-white hover:bg-white/15 hover:text-white"
        >
          <Download className="h-4 w-4 mr-1" /> Exportar
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-[140px]">
        <DropdownMenuItem onClick={() => exportPanelExcel(filtered, hospitalName)}>
          <FileSpreadsheet className="h-4 w-4 mr-2" /> Excel
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => exportPanelPDF(filtered, hospitalName)}>
          <FileDown className="h-4 w-4 mr-2" /> PDF
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  ) : (
    <div className="inline-flex items-center rounded-md border border-white/30 overflow-hidden bg-white/5">
      <Button
        variant="ghost"
        size="sm"
        className="h-8 rounded-none text-white hover:bg-white/15 hover:text-white"
        onClick={() => exportPanelExcel(filtered, hospitalName)}
      >
        <FileSpreadsheet className="h-4 w-4 mr-1" /> Excel
      </Button>
      <span className="h-5 w-px bg-white/30" aria-hidden />
      <Button
        variant="ghost"
        size="sm"
        className="h-8 rounded-none text-white hover:bg-white/15 hover:text-white"
        onClick={() => exportPanelPDF(filtered, hospitalName)}
      >
        <FileDown className="h-4 w-4 mr-1" /> PDF
      </Button>
    </div>
  );

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-10 py-6 space-y-6 max-w-[1600px]">
      <BedPageHeader
        icon={Activity}
        title="Painel de Gestão de Leitos"
        subtitle={`${hospitalName} · Solicitações & conduções em tempo real`}
        badge="Tempo real"
        badgePulse
        accent="violet"
        actions={
          <>
            <Button variant="outline" size="sm" className="h-8" onClick={refetch}>
              <RefreshCw className="h-4 w-4 mr-1" /> Atualizar
            </Button>
            <SlaConfigDialog knownSectors={Array.from(new Set(requests.map((r) => r.requested_sector).filter(Boolean) as string[]))} />
            {exportActions}
          </>
        }
      />

      {/* KPI bar with vertical dividers */}
      <Card className="overflow-hidden">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 divide-y md:divide-y-0 md:[&>*:nth-child(3n)]:border-r-0 lg:[&>*]:border-r-0">
          {loading ? (
            Array.from({ length: 6 }).map((_, i) => <KpiSkeleton key={i} />)
          ) : (
            <>
              <KPI icon={Activity} label="Total" value={kpis.total} accent="hsl(217 91% 60%)" />
              <KPI icon={Hourglass} label="Pendentes" value={kpis.pending} accent="hsl(38 92% 50%)" />
              <KPI icon={Clock} label="Em Andamento" value={kpis.inProgress} accent="hsl(199 89% 48%)" />
              <KPI icon={CheckCircle2} label="Concluídas" value={kpis.completed} accent="hsl(142 71% 45%)" />
              <KPI icon={ShieldAlert} label="Isolamento" value={kpis.isolation} accent="hsl(48 96% 53%)" />
              <KPI icon={AlertTriangle} label="No Prazo" value={`${kpis.onTimePct}%`} accent="hsl(262 83% 58%)" last />
            </>
          )}
        </div>
      </Card>

      {/* Filters + counter */}
      <Card className="p-3">
        <div className="flex flex-col md:flex-row gap-2 md:items-center">
          <div className="relative flex-1 min-w-0">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="BUSCAR PACIENTE, DIAGNÓSTICO, MÉDICO, LEITO..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 uppercase border-input"
            />
          </div>
          <Select value={sectorFilter} onValueChange={setSectorFilter}>
            <SelectTrigger className="md:w-[200px] min-w-[180px] border-input">
              <SelectValue placeholder="Setor solicitante" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">TODOS OS SETORES</SelectItem>
              {sectors.map((s) => <SelectItem key={s} value={s}>{s.toUpperCase()}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="md:w-[200px] min-w-[180px] border-input">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">TODOS OS STATUS</SelectItem>
              <SelectItem value="pending">PENDENTES</SelectItem>
              <SelectItem value="completed">CONCLUÍDAS</SelectItem>
              <SelectItem value="late">ATRASADAS</SelectItem>
              <SelectItem value="isolation">COM ISOLAMENTO</SelectItem>
            </SelectContent>
          </Select>
          <div className="text-xs text-muted-foreground tabular-nums md:ml-auto md:pl-3 whitespace-nowrap">
            {filtered.length} {filtered.length === 1 ? "solicitação" : "solicitações"}
          </div>
        </div>
      </Card>

      <Tabs defaultValue="solicitacoes">
        <TabsList>
          <TabsTrigger value="solicitacoes">SOLICITAÇÕES DE LEITO</TabsTrigger>
          <TabsTrigger value="conducoes">ACOMPANHAMENTO DE CONDUÇÃO</TabsTrigger>
        </TabsList>
        <TabsContent value="solicitacoes" className="space-y-3 mt-4">
          {loading ? (
            <>
              <RequestRowSkeleton />
              <RequestRowSkeleton />
              <RequestRowSkeleton />
            </>
          ) : filtered.length === 0 ? (
            <Card className="p-10 text-center transition-all duration-200">
              <Inbox className="h-10 w-10 mx-auto text-muted-foreground/50 mb-3" />
              <p className="text-sm uppercase tracking-wide text-muted-foreground">
                Nenhuma solicitação encontrada para os filtros aplicados
              </p>
              <Button variant="outline" size="sm" className="mt-4 h-8" onClick={clearFilters}>
                Limpar filtros
              </Button>
            </Card>
          ) : (
            filtered.map((r) => <RequestRow key={r.id} r={r} onAdvance={handleAdvance} resolver={resolver} />)
          )}
        </TabsContent>
        <TabsContent value="conducoes" className="mt-4">
          <Card className="p-6 text-sm text-muted-foreground uppercase tracking-wide">
            Acompanhamento de condução compartilha as mesmas etapas (solicitação → liberação → transporte → conclusão).
            Use os botões de avanço de etapa nas solicitações acima — cada conclusão dispara o registro de tempo final
            no relatório exportável.
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
