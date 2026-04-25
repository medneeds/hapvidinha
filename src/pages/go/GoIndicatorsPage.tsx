import { useMemo } from "react";
import { useTransportRequests } from "@/hooks/useTransportRequests";
import { useBedLifecycle, BedEventType, BED_EVENT_LABELS } from "@/hooks/useBedLifecycle";
import { Card } from "@/components/ui/card";
import {
  BarChart3,
  Clock,
  Truck,
  BedDouble,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Activity,
  Timer,
  Sparkles,
  LogOut,
  DoorOpen,
  PlayCircle,
} from "lucide-react";

function avgMinutes(durations: number[]): string {
  if (durations.length === 0) return "—";
  const avg = durations.reduce((a, b) => a + b, 0) / durations.length;
  return formatMin(avg);
}

function medianMinutes(durations: number[]): string {
  if (durations.length === 0) return "—";
  const sorted = [...durations].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  const med =
    sorted.length % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid];
  return formatMin(med);
}

function maxMinutes(durations: number[]): string {
  if (durations.length === 0) return "—";
  return formatMin(Math.max(...durations));
}

function formatMin(value: number): string {
  if (value < 60) return `${Math.round(value)} min`;
  const h = Math.floor(value / 60);
  const m = Math.round(value % 60);
  return `${h}h ${m}min`;
}

function diffMin(a: string | null, b: string | null): number | null {
  if (!a || !b) return null;
  return (new Date(b).getTime() - new Date(a).getTime()) / 60000;
}

const PRIORITY_LABELS: Record<string, string> = {
  low: "Baixa",
  normal: "Normal",
  high: "Alta",
  urgent: "Urgente",
};

const STATUS_LABELS: Record<string, string> = {
  pending: "Pendente",
  accepted: "Aceito",
  in_progress: "Em execução",
  completed: "Concluído",
  cancelled: "Cancelado",
};

export default function GoIndicatorsPage() {
  const { requests } = useTransportRequests();
  const { events } = useBedLifecycle();

  /* ============== TRANSPORT KPIs ============== */
  const transportKpis = useMemo(() => {
    const completed = requests.filter((r) => r.status === "completed");
    const cancelled = requests.filter((r) => r.status === "cancelled");
    const active = requests.filter((r) =>
      ["pending", "accepted", "in_progress"].includes(r.status)
    );

    const waitTimes = completed
      .map((r) => diffMin(r.created_at, r.accepted_at))
      .filter((v): v is number => v !== null && v >= 0);
    const responseTimes = completed
      .map((r) => diffMin(r.accepted_at, r.started_at))
      .filter((v): v is number => v !== null && v >= 0);
    const executionTimes = completed
      .map((r) => diffMin(r.started_at, r.completed_at))
      .filter((v): v is number => v !== null && v >= 0);
    const totalTimes = completed
      .map((r) => diffMin(r.created_at, r.completed_at))
      .filter((v): v is number => v !== null && v >= 0);

    const byPriority: Record<string, number> = { low: 0, normal: 0, high: 0, urgent: 0 };
    const byStatus: Record<string, number> = {
      pending: 0,
      accepted: 0,
      in_progress: 0,
      completed: 0,
      cancelled: 0,
    };
    const byType = { patient: 0, general: 0 };
    const byConductor = new Map<string, number>();

    requests.forEach((r) => {
      byPriority[r.priority] = (byPriority[r.priority] || 0) + 1;
      byStatus[r.status] = (byStatus[r.status] || 0) + 1;
      byType[r.request_type] = (byType[r.request_type] || 0) + 1;
      if (r.assigned_to_name) {
        byConductor.set(
          r.assigned_to_name,
          (byConductor.get(r.assigned_to_name) || 0) + 1
        );
      }
    });

    const completionRate =
      requests.length > 0
        ? Math.round((completed.length / requests.length) * 100)
        : 0;
    const cancelRate =
      requests.length > 0
        ? Math.round((cancelled.length / requests.length) * 100)
        : 0;

    const topConductors = Array.from(byConductor.entries())
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5);

    return {
      total: requests.length,
      completed: completed.length,
      cancelled: cancelled.length,
      active: active.length,
      avgWait: avgMinutes(waitTimes),
      medianWait: medianMinutes(waitTimes),
      maxWait: maxMinutes(waitTimes),
      avgResponse: avgMinutes(responseTimes),
      avgExecution: avgMinutes(executionTimes),
      avgTotal: avgMinutes(totalTimes),
      medianTotal: medianMinutes(totalTimes),
      completionRate,
      cancelRate,
      byPriority,
      byStatus,
      byType,
      topConductors,
    };
  }, [requests]);

  /* ============== BED LIFECYCLE KPIs ============== */
  const bedKpis = useMemo(() => {
    const byBed = new Map<string, typeof events>();
    events.forEach((e) => {
      if (!byBed.has(e.bed_number)) byBed.set(e.bed_number, []);
      byBed.get(e.bed_number)!.push(e);
    });

    const cleaningTimes: number[] = [];
    const dischargeToVacate: number[] = [];
    const adminToVacate: number[] = [];
    const vacateToCleanStart: number[] = [];
    const cleanFinishToRelease: number[] = [];
    const releaseToOccupy: number[] = [];
    const turnoverTimes: number[] = [];
    const fullCycleTimes: number[] = [];

    const eventCount: Record<BedEventType, number> = {
      medical_discharge: 0,
      administrative_discharge: 0,
      bed_vacated: 0,
      cleaning_started: 0,
      cleaning_finished: 0,
      bed_released: 0,
      bed_occupied: 0,
    };

    const perBedMetrics: {
      bed: string;
      cycles: number;
      avgTurnover: string;
      avgCleaning: string;
    }[] = [];

    byBed.forEach((arr, bedNumber) => {
      const sorted = [...arr].sort((a, b) =>
        a.event_at.localeCompare(b.event_at)
      );
      const findNext = (from: number, type: BedEventType) =>
        sorted.slice(from + 1).find((e) => e.event_type === type);

      const localTurnover: number[] = [];
      const localCleaning: number[] = [];
      let cyclesForBed = 0;

      sorted.forEach((evt, idx) => {
        eventCount[evt.event_type as BedEventType]++;

        if (evt.event_type === "cleaning_started") {
          const end = findNext(idx, "cleaning_finished");
          if (end) {
            const d = diffMin(evt.event_at, end.event_at);
            if (d !== null && d >= 0) {
              cleaningTimes.push(d);
              localCleaning.push(d);
            }
          }
        }
        if (evt.event_type === "medical_discharge") {
          const adm = findNext(idx, "administrative_discharge");
          const vac = findNext(idx, "bed_vacated");
          const occ = findNext(idx, "bed_occupied");
          if (adm) {
            const d = diffMin(evt.event_at, adm.event_at);
            if (d !== null && d >= 0) adminToVacate.push(d);
          }
          if (vac) {
            const d = diffMin(evt.event_at, vac.event_at);
            if (d !== null && d >= 0) dischargeToVacate.push(d);
          }
          if (occ) {
            const d = diffMin(evt.event_at, occ.event_at);
            if (d !== null && d >= 0) {
              turnoverTimes.push(d);
              localTurnover.push(d);
              cyclesForBed++;
            }
          }
        }
        if (evt.event_type === "bed_vacated") {
          const cleanStart = findNext(idx, "cleaning_started");
          const occ = findNext(idx, "bed_occupied");
          if (cleanStart) {
            const d = diffMin(evt.event_at, cleanStart.event_at);
            if (d !== null && d >= 0) vacateToCleanStart.push(d);
          }
          if (occ) {
            const d = diffMin(evt.event_at, occ.event_at);
            if (d !== null && d >= 0) fullCycleTimes.push(d);
          }
        }
        if (evt.event_type === "cleaning_finished") {
          const rel = findNext(idx, "bed_released");
          if (rel) {
            const d = diffMin(evt.event_at, rel.event_at);
            if (d !== null && d >= 0) cleanFinishToRelease.push(d);
          }
        }
        if (evt.event_type === "bed_released") {
          const occ = findNext(idx, "bed_occupied");
          if (occ) {
            const d = diffMin(evt.event_at, occ.event_at);
            if (d !== null && d >= 0) releaseToOccupy.push(d);
          }
        }
      });

      if (cyclesForBed > 0 || localCleaning.length > 0) {
        perBedMetrics.push({
          bed: bedNumber,
          cycles: cyclesForBed,
          avgTurnover: avgMinutes(localTurnover),
          avgCleaning: avgMinutes(localCleaning),
        });
      }
    });

    perBedMetrics.sort((a, b) => b.cycles - a.cycles);

    return {
      totalEvents: events.length,
      uniqueBeds: byBed.size,
      eventCount,
      avgCleaning: avgMinutes(cleaningTimes),
      medianCleaning: medianMinutes(cleaningTimes),
      maxCleaning: maxMinutes(cleaningTimes),
      avgAdminToVacate: avgMinutes(adminToVacate),
      avgDischargeToVacate: avgMinutes(dischargeToVacate),
      avgVacateToCleanStart: avgMinutes(vacateToCleanStart),
      avgCleanFinishToRelease: avgMinutes(cleanFinishToRelease),
      avgReleaseToOccupy: avgMinutes(releaseToOccupy),
      avgTurnover: avgMinutes(turnoverTimes),
      medianTurnover: medianMinutes(turnoverTimes),
      avgFullCycle: avgMinutes(fullCycleTimes),
      perBedMetrics: perBedMetrics.slice(0, 10),
    };
  }, [events]);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Indicadores Operacionais</h1>
        <p className="text-muted-foreground">
          KPIs detalhados de tempos, eficiência e fluxo a partir dos registros do HAPMAP GO.
        </p>
      </div>

      {/* ============= TRANSPORT SECTION ============= */}
      <section className="space-y-4">
        <SectionHeader
          icon={Truck}
          title="Condutores · Transporte"
          subtitle="Volume, tempos e produtividade do fluxo de chamados"
        />

        <Subtitle>Volume e taxa de resolução</Subtitle>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Kpi label="Total de chamados" value={transportKpis.total} icon={BarChart3} />
          <Kpi label="Concluídos" value={transportKpis.completed} icon={CheckCircle2} accent="success" />
          <Kpi label="Em andamento" value={transportKpis.active} icon={Activity} accent="info" />
          <Kpi label="Cancelados" value={transportKpis.cancelled} icon={XCircle} accent="danger" />
          <Kpi label="Taxa de conclusão" value={`${transportKpis.completionRate}%`} icon={TrendingUp} accent="success" />
          <Kpi label="Taxa de cancelamento" value={`${transportKpis.cancelRate}%`} icon={AlertTriangle} accent="danger" />
          <Kpi label="Pacientes" value={transportKpis.byType.patient} icon={Truck} />
          <Kpi label="Materiais / outros" value={transportKpis.byType.general} icon={Truck} />
        </div>

        <Subtitle>Tempos médios do ciclo</Subtitle>
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
          <Kpi label="Tempo de espera (médio)" value={transportKpis.avgWait} icon={Clock} hint="Solicitação → Aceite" />
          <Kpi label="Tempo de espera (mediano)" value={transportKpis.medianWait} icon={Timer} hint="50% dos chamados" />
          <Kpi label="Pior espera" value={transportKpis.maxWait} icon={AlertTriangle} accent="danger" hint="Maior tempo registrado" />
          <Kpi label="Tempo de resposta" value={transportKpis.avgResponse} icon={Clock} hint="Aceite → Início" />
          <Kpi label="Tempo de execução" value={transportKpis.avgExecution} icon={Clock} hint="Início → Conclusão" />
          <Kpi label="Tempo total (médio)" value={transportKpis.avgTotal} icon={Timer} hint="Solicitação → Conclusão" />
        </div>

        <Subtitle>Distribuição por prioridade</Subtitle>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {(["urgent", "high", "normal", "low"] as const).map((p) => (
            <Kpi
              key={p}
              label={PRIORITY_LABELS[p]}
              value={transportKpis.byPriority[p] || 0}
              icon={AlertTriangle}
              accent={p === "urgent" ? "danger" : p === "high" ? "warning" : "muted"}
            />
          ))}
        </div>

        <Subtitle>Distribuição por status</Subtitle>
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
          {(["pending", "accepted", "in_progress", "completed", "cancelled"] as const).map(
            (s) => (
              <Kpi
                key={s}
                label={STATUS_LABELS[s]}
                value={transportKpis.byStatus[s] || 0}
                icon={Activity}
              />
            )
          )}
        </div>

        {transportKpis.topConductors.length > 0 && (
          <>
            <Subtitle>Top condutores (atendimentos)</Subtitle>
            <Card className="p-4">
              <div className="space-y-2">
                {transportKpis.topConductors.map(([name, count]) => {
                  const max = transportKpis.topConductors[0][1];
                  const pct = Math.round((count / max) * 100);
                  return (
                    <div key={name} className="space-y-1">
                      <div className="flex justify-between text-sm">
                        <span className="font-medium">{name}</span>
                        <span className="font-mono text-muted-foreground">{count}</span>
                      </div>
                      <div className="h-2 bg-muted rounded-full overflow-hidden">
                        <div
                          className="h-full bg-primary rounded-full transition-all"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </Card>
          </>
        )}
      </section>

      {/* ============= BED LIFECYCLE SECTION ============= */}
      <section className="space-y-4">
        <SectionHeader
          icon={BedDouble}
          title="Ciclo de Leitos"
          subtitle="Tempos por etapa, giro e produtividade dos leitos"
        />

        <Subtitle>Visão geral</Subtitle>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Kpi label="Eventos registrados" value={bedKpis.totalEvents} icon={BarChart3} />
          <Kpi label="Leitos monitorados" value={bedKpis.uniqueBeds} icon={BedDouble} />
          <Kpi
            label="Giro do leito (médio)"
            value={bedKpis.avgTurnover}
            icon={TrendingUp}
            accent="info"
            hint="Alta médica → Próxima ocupação"
          />
          <Kpi
            label="Giro do leito (mediano)"
            value={bedKpis.medianTurnover}
            icon={Timer}
          />
        </div>

        <Subtitle>Tempos por etapa do ciclo</Subtitle>
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
          <Kpi
            label="Alta médica → Alta admin"
            value={bedKpis.avgAdminToVacate}
            icon={LogOut}
            hint="Burocracia administrativa"
          />
          <Kpi
            label="Alta médica → Desocupação"
            value={bedKpis.avgDischargeToVacate}
            icon={LogOut}
            hint="Saída do paciente"
          />
          <Kpi
            label="Desocupação → Início limpeza"
            value={bedKpis.avgVacateToCleanStart}
            icon={PlayCircle}
            hint="Espera por higienização"
          />
          <Kpi
            label="Tempo de preparação (médio)"
            value={bedKpis.avgCleaning}
            icon={Sparkles}
            accent="info"
            hint="Início → Finalização da limpeza"
          />
          <Kpi
            label="Preparação (mediano)"
            value={bedKpis.medianCleaning}
            icon={Timer}
          />
          <Kpi
            label="Pior preparação"
            value={bedKpis.maxCleaning}
            icon={AlertTriangle}
            accent="warning"
          />
          <Kpi
            label="Limpeza → Liberação"
            value={bedKpis.avgCleanFinishToRelease}
            icon={CheckCircle2}
            hint="Conferência e liberação"
          />
          <Kpi
            label="Liberação → Ocupação"
            value={bedKpis.avgReleaseToOccupy}
            icon={DoorOpen}
            hint="Tempo até novo paciente"
          />
          <Kpi
            label="Ciclo completo (desocupação→ocup.)"
            value={bedKpis.avgFullCycle}
            icon={Timer}
            accent="info"
          />
        </div>

        <Subtitle>Eventos registrados por tipo</Subtitle>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {(Object.keys(bedKpis.eventCount) as BedEventType[]).map((t) => (
            <Kpi
              key={t}
              label={BED_EVENT_LABELS[t]}
              value={bedKpis.eventCount[t]}
              icon={Activity}
            />
          ))}
        </div>

        {bedKpis.perBedMetrics.length > 0 && (
          <>
            <Subtitle>Top 10 leitos com maior giro</Subtitle>
            <Card className="p-0 overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-muted/50">
                  <tr className="text-left">
                    <th className="px-4 py-2 font-medium">Leito</th>
                    <th className="px-4 py-2 font-medium text-right">Giros</th>
                    <th className="px-4 py-2 font-medium text-right">Giro médio</th>
                    <th className="px-4 py-2 font-medium text-right">Limpeza média</th>
                  </tr>
                </thead>
                <tbody>
                  {bedKpis.perBedMetrics.map((b) => (
                    <tr key={b.bed} className="border-t border-border">
                      <td className="px-4 py-2 font-mono font-semibold">{b.bed}</td>
                      <td className="px-4 py-2 text-right font-mono">{b.cycles}</td>
                      <td className="px-4 py-2 text-right font-mono">{b.avgTurnover}</td>
                      <td className="px-4 py-2 text-right font-mono">{b.avgCleaning}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Card>
          </>
        )}
      </section>
    </div>
  );
}

/* ============== UI HELPERS ============== */

function SectionHeader({
  icon: Icon,
  title,
  subtitle,
}: {
  icon: typeof Clock;
  title: string;
  subtitle?: string;
}) {
  return (
    <div className="flex items-start gap-3 border-b border-border pb-3">
      <div className="h-10 w-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
        <Icon className="h-5 w-5" />
      </div>
      <div>
        <h2 className="text-xl font-semibold leading-tight">{title}</h2>
        {subtitle && (
          <p className="text-sm text-muted-foreground">{subtitle}</p>
        )}
      </div>
    </div>
  );
}

function Subtitle({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="text-xs uppercase tracking-wider text-muted-foreground font-semibold mt-2">
      {children}
    </h3>
  );
}

type Accent = "default" | "success" | "danger" | "warning" | "info" | "muted";

function Kpi({
  label,
  value,
  icon: Icon,
  hint,
  accent = "default",
}: {
  label: string;
  value: string | number;
  icon: typeof Clock;
  hint?: string;
  accent?: Accent;
}) {
  const accentMap: Record<Accent, string> = {
    default: "text-foreground",
    success: "text-emerald-600 dark:text-emerald-400",
    danger: "text-destructive",
    warning: "text-amber-600 dark:text-amber-400",
    info: "text-primary",
    muted: "text-muted-foreground",
  };
  const iconMap: Record<Accent, string> = {
    default: "text-muted-foreground",
    success: "text-emerald-600 dark:text-emerald-400",
    danger: "text-destructive",
    warning: "text-amber-600 dark:text-amber-400",
    info: "text-primary",
    muted: "text-muted-foreground",
  };

  return (
    <Card className="p-4 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-2 gap-2">
        <span className="text-[11px] uppercase tracking-wide text-muted-foreground leading-tight">
          {label}
        </span>
        <Icon className={`h-4 w-4 shrink-0 ${iconMap[accent]}`} />
      </div>
      <div className={`text-2xl font-bold font-mono ${accentMap[accent]}`}>
        {value}
      </div>
      {hint && (
        <div className="text-[10px] text-muted-foreground mt-1 leading-tight">
          {hint}
        </div>
      )}
    </Card>
  );
}
