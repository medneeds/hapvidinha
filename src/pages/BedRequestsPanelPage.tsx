import { useMemo, useState } from "react";
import { useBedRequestsPanel, PanelRequest, formatHHMM, getRequestStatusInfo, StageEval, SlaResolver } from "@/hooks/useBedRequestsPanel";
import { useHospital } from "@/contexts/HospitalContext";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { exportPanelExcel, exportPanelPDF } from "@/utils/bedPanelExport";
import { SlaConfigDialog } from "@/components/bed-panel/SlaConfigDialog";
import {
  FileDown, FileSpreadsheet, RefreshCw, Search, Activity, AlertTriangle,
  Clock, CheckCircle2, Hourglass, ShieldAlert, Bed, ArrowRight,
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
const LEVEL_LINE: Record<string, string> = {
  ok: "bg-emerald-400",
  warning: "bg-amber-400",
  late: "bg-destructive",
  in_progress: "bg-sky-400",
  pending: "bg-border",
};

function StageDot({ stage, label, time }: { stage: StageEval; label: string; time?: string }) {
  return (
    <div className="flex flex-col items-center gap-1 min-w-[64px]">
      <div className={cn(
        "h-3 w-3 rounded-full ring-2 ring-offset-2 ring-offset-background transition-all",
        LEVEL_DOT[stage.level]
      )} title={`SLA ${stage.slaMinutes}min · alerta ${stage.warningPct}%`} />
      <span className="text-[9px] uppercase tracking-wider text-muted-foreground">{label}</span>
      <span className="text-[10px] font-mono font-semibold">{time ?? "--:--"}</span>
      {stage.elapsedMin !== null && (
        <span className={cn(
          "text-[9px] font-mono",
          stage.level === "late" ? "text-destructive" :
          stage.level === "warning" ? "text-amber-600" :
          stage.level === "ok" ? "text-emerald-600" : "text-muted-foreground"
        )}>{formatHHMM(stage.elapsedMin)}/{formatHHMM(stage.slaMinutes)}</span>
      )}
    </div>
  );
}

function StageLine({ level }: { level: string }) {
  return <div className={cn("h-px flex-1 mt-1.5", LEVEL_LINE[level])} />;
}

function fmtTime(iso: string | null) {
  return iso ? new Date(iso).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }) : undefined;
}

function RequestRow({ r, onAdvance, resolver }: { r: PanelRequest; onAdvance: (id: string, patch: Partial<PanelRequest>) => void; resolver: SlaResolver }) {
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
    ok: <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100 border-emerald-200">CONCLUÍDO {formatHHMM(info.totalMin)}</Badge>,
    late: <Badge className="bg-destructive/15 text-destructive border-destructive/30">ATRASADO {formatHHMM(info.totalMin)}</Badge>,
    warning: <Badge className="bg-amber-100 text-amber-700 border-amber-200">ATENÇÃO SLA</Badge>,
    in_progress: <Badge className="bg-sky-100 text-sky-700 border-sky-200">EM ANDAMENTO</Badge>,
    pending: <Badge className="bg-rose-100 text-rose-700 border-rose-200">PENDENTE</Badge>,
  }[overall];

  const borderColor =
    overall === "ok" ? "hsl(142 71% 45%)" :
    overall === "late" ? "hsl(var(--destructive))" :
    overall === "warning" ? "hsl(38 92% 50%)" :
    overall === "in_progress" ? "hsl(199 89% 48%)" :
    "hsl(346 77% 50%)";

  const solicitStage: StageEval = { elapsedMin: 0, slaMinutes: 0, warningPct: 100, level: "ok", done: true };

  return (
    <Card className="p-4 hover:shadow-md transition-shadow border-l-4" style={{ borderLeftColor: borderColor }}>
      <div className="flex flex-wrap items-start gap-3 mb-3">
        <div className="flex items-center gap-2 min-w-0 flex-1">
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

      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mb-4">
        <div>
          <div className="text-[9px] uppercase tracking-wider text-muted-foreground">Paciente</div>
          <div className="font-semibold text-sm uppercase truncate">{r.patient_name ?? "—"}</div>
        </div>
        <div>
          <div className="text-[9px] uppercase tracking-wider text-muted-foreground">Diagnóstico</div>
          <div className="text-sm uppercase truncate">{r.diagnosis ?? "—"}</div>
        </div>
        <div>
          <div className="text-[9px] uppercase tracking-wider text-muted-foreground">Solicitante</div>
          <div className="text-xs uppercase">{r.requesting_doctor_name ?? "—"}{r.requesting_office_number ? ` · C${r.requesting_office_number}` : ""}</div>
        </div>
        <div>
          <div className="text-[9px] uppercase tracking-wider text-muted-foreground">Liberação Hotelaria / Leito</div>
          <div className="text-xs uppercase">
            {(r.hotelaria_released_by ?? "—")} · {(r.bed_released_by ?? "—")}
          </div>
        </div>
      </div>

      {/* Timeline */}
      <div className="flex items-start gap-1 mb-3">
        <StageDot stage={solicitStage} label="Solicit" time={fmtTime(r.created_at)} />
        <StageLine level={stages.hotelaria.level} />
        <StageDot stage={stages.hotelaria} label="Hotelaria" time={fmtTime(r.hotelaria_released_at)} />
        <StageLine level={stages.leito.level} />
        <StageDot stage={stages.leito} label="Leito Lib" time={fmtTime(r.bed_released_at)} />
        <StageLine level={stages.transferencia.level} />
        <StageDot stage={stages.transferencia} label="Transferido" time={fmtTime(r.transfer_completed_at)} />
      </div>

      <div className="flex flex-wrap gap-2 pt-2 border-t">
        {!r.hotelaria_released_at && (
          <Button size="sm" variant="outline" onClick={() => onAdvance(r.id, { hotelaria_released_at: new Date().toISOString() })}>
            <CheckCircle2 className="h-3 w-3 mr-1" /> Liberar Hotelaria
          </Button>
        )}
        {r.hotelaria_released_at && !r.bed_released_at && (
          <Button size="sm" variant="outline" onClick={() => onAdvance(r.id, { bed_released_at: new Date().toISOString() })}>
            <Bed className="h-3 w-3 mr-1" /> Liberar Leito
          </Button>
        )}
        {r.bed_released_at && !r.transfer_completed_at && (
          <Button size="sm" variant="default" onClick={() => onAdvance(r.id, { transfer_completed_at: new Date().toISOString(), status: "approved" })}>
            <CheckCircle2 className="h-3 w-3 mr-1" /> Concluir Transferência
          </Button>
        )}
        {info.completed && (
          <span className="text-xs text-muted-foreground ml-auto self-center">
            Hotel: {formatHHMM(info.hotelMin)} · Total: {formatHHMM(info.totalMin)}
          </span>
        )}
      </div>
    </Card>
  );
}

function KPI({ icon: Icon, label, value, accent }: { icon: any; label: string; value: string | number; accent: string }) {
  return (
    <Card className="p-4 relative overflow-hidden">
      <div className="absolute top-0 right-0 w-20 h-20 rounded-full opacity-10 -translate-y-6 translate-x-6" style={{ background: accent }} />
      <div className="flex items-center gap-2 mb-2">
        <div className="h-8 w-8 rounded-lg flex items-center justify-center" style={{ background: `${accent}20`, color: accent }}>
          <Icon className="h-4 w-4" />
        </div>
        <span className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold">{label}</span>
      </div>
      <div className="text-2xl font-bold tabular-nums">{value}</div>
    </Card>
  );
}

export default function BedRequestsPanelPage() {
  const { requests, loading, kpis, refetch, updateStage, resolver } = useBedRequestsPanel();
  const { currentHospital } = useHospital();
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
  }, [requests, search, sectorFilter, statusFilter]);

  const handleAdvance = async (id: string, patch: any) => {
    const ok = await updateStage(id, patch);
    if (ok) toast.success("Etapa atualizada");
    else toast.error("Falha ao atualizar");
  };

  const hospitalName = currentHospital?.name ?? "HOSPITAL";

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6 max-w-[1600px]">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight uppercase">Painel de Gestão de Leitos</h1>
          <p className="text-sm text-muted-foreground uppercase tracking-wide">{hospitalName} · Solicitações & Conduções em tempo real</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Button variant="outline" size="sm" onClick={refetch}><RefreshCw className="h-4 w-4 mr-1" /> Atualizar</Button>
          <SlaConfigDialog knownSectors={Array.from(new Set(requests.map((r) => r.requested_sector).filter(Boolean) as string[]))} />
          <Button variant="outline" size="sm" onClick={() => exportPanelExcel(filtered, hospitalName)}><FileSpreadsheet className="h-4 w-4 mr-1" /> Excel</Button>
          <Button variant="default" size="sm" onClick={() => exportPanelPDF(filtered, hospitalName)}><FileDown className="h-4 w-4 mr-1" /> PDF</Button>
        </div>
      </header>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        <KPI icon={Activity} label="Total" value={kpis.total} accent="hsl(217 91% 60%)" />
        <KPI icon={Hourglass} label="Pendentes" value={kpis.pending} accent="hsl(346 77% 50%)" />
        <KPI icon={Clock} label="Em Andamento" value={kpis.inProgress} accent="hsl(38 92% 50%)" />
        <KPI icon={CheckCircle2} label="Concluídas" value={kpis.completed} accent="hsl(142 71% 45%)" />
        <KPI icon={ShieldAlert} label="Isolamento" value={kpis.isolation} accent="hsl(48 96% 53%)" />
        <KPI icon={AlertTriangle} label="No Prazo" value={`${kpis.onTimePct}%`} accent="hsl(262 83% 58%)" />
      </div>

      <Card className="p-3">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          <div className="relative col-span-2">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input placeholder="BUSCAR PACIENTE, DIAGNÓSTICO, MÉDICO..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-8 uppercase" />
          </div>
          <Select value={sectorFilter} onValueChange={setSectorFilter}>
            <SelectTrigger><SelectValue placeholder="Setor solicitante" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">TODOS OS SETORES</SelectItem>
              {sectors.map((s) => <SelectItem key={s} value={s}>{s.toUpperCase()}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger><SelectValue placeholder="Status" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">TODOS OS STATUS</SelectItem>
              <SelectItem value="pending">PENDENTES</SelectItem>
              <SelectItem value="completed">CONCLUÍDAS</SelectItem>
              <SelectItem value="late">ATRASADAS</SelectItem>
              <SelectItem value="isolation">COM ISOLAMENTO</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </Card>

      <Tabs defaultValue="solicitacoes">
        <TabsList>
          <TabsTrigger value="solicitacoes">SOLICITAÇÕES DE LEITO</TabsTrigger>
          <TabsTrigger value="conducoes">ACOMPANHAMENTO DE CONDUÇÃO</TabsTrigger>
        </TabsList>
        <TabsContent value="solicitacoes" className="space-y-3 mt-4">
          {loading ? (
            <Card className="p-8 text-center text-muted-foreground">Carregando…</Card>
          ) : filtered.length === 0 ? (
            <Card className="p-8 text-center text-muted-foreground uppercase tracking-wide text-sm">
              Nenhuma solicitação para os filtros atuais.
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
