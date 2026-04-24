import { useMemo } from "react";
import { useTransportRequests } from "@/hooks/useTransportRequests";
import { useBedLifecycle, BedEventType } from "@/hooks/useBedLifecycle";
import { Card } from "@/components/ui/card";
import { BarChart3, Clock, Truck, BedDouble, TrendingUp } from "lucide-react";

function avgMinutes(durations: number[]): string {
  if (durations.length === 0) return "—";
  const avg = durations.reduce((a, b) => a + b, 0) / durations.length;
  if (avg < 60) return `${Math.round(avg)} min`;
  const h = Math.floor(avg / 60);
  const m = Math.round(avg % 60);
  return `${h}h ${m}min`;
}

function diffMin(a: string | null, b: string | null): number | null {
  if (!a || !b) return null;
  return (new Date(b).getTime() - new Date(a).getTime()) / 60000;
}

export default function GoIndicatorsPage() {
  const { requests } = useTransportRequests();
  const { events } = useBedLifecycle();

  const transportKpis = useMemo(() => {
    const completed = requests.filter((r) => r.status === "completed");
    const waitTimes = completed
      .map((r) => diffMin(r.created_at, r.accepted_at))
      .filter((v): v is number => v !== null);
    const executionTimes = completed
      .map((r) => diffMin(r.started_at, r.completed_at))
      .filter((v): v is number => v !== null);
    const totalTimes = completed
      .map((r) => diffMin(r.created_at, r.completed_at))
      .filter((v): v is number => v !== null);

    return {
      total: requests.length,
      completed: completed.length,
      pending: requests.filter((r) => r.status === "pending").length,
      avgWait: avgMinutes(waitTimes),
      avgExecution: avgMinutes(executionTimes),
      avgTotal: avgMinutes(totalTimes),
    };
  }, [requests]);

  const bedKpis = useMemo(() => {
    // Agrupa por leito e calcula tempos entre eventos do mesmo leito (sequencial)
    const byBed = new Map<string, typeof events>();
    events.forEach((e) => {
      if (!byBed.has(e.bed_number)) byBed.set(e.bed_number, []);
      byBed.get(e.bed_number)!.push(e);
    });

    const cleaningTimes: number[] = [];
    const dischargeToVacate: number[] = [];
    const turnoverTimes: number[] = [];

    byBed.forEach((arr) => {
      const sorted = [...arr].sort((a, b) => a.event_at.localeCompare(b.event_at));
      const findNext = (from: number, type: BedEventType) =>
        sorted.slice(from + 1).find((e) => e.event_type === type);

      sorted.forEach((evt, idx) => {
        if (evt.event_type === "cleaning_started") {
          const end = findNext(idx, "cleaning_finished");
          if (end) {
            const d = diffMin(evt.event_at, end.event_at);
            if (d !== null && d >= 0) cleaningTimes.push(d);
          }
        }
        if (evt.event_type === "medical_discharge") {
          const vac = findNext(idx, "bed_vacated");
          if (vac) {
            const d = diffMin(evt.event_at, vac.event_at);
            if (d !== null && d >= 0) dischargeToVacate.push(d);
          }
          const occ = findNext(idx, "bed_occupied");
          if (occ) {
            const d = diffMin(evt.event_at, occ.event_at);
            if (d !== null && d >= 0) turnoverTimes.push(d);
          }
        }
      });
    });

    return {
      totalEvents: events.length,
      uniqueBeds: byBed.size,
      avgCleaning: avgMinutes(cleaningTimes),
      avgDischargeToVacate: avgMinutes(dischargeToVacate),
      avgTurnover: avgMinutes(turnoverTimes),
    };
  }, [events]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Indicadores</h1>
        <p className="text-muted-foreground">
          Tempos médios e KPIs de operação calculados a partir dos registros.
        </p>
      </div>

      <section>
        <div className="flex items-center gap-2 mb-3">
          <Truck className="h-5 w-5 text-primary" />
          <h2 className="text-xl font-semibold">Condutores</h2>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
          <Kpi label="Total de chamados" value={transportKpis.total} icon={BarChart3} />
          <Kpi label="Concluídos" value={transportKpis.completed} icon={TrendingUp} />
          <Kpi label="Pendentes" value={transportKpis.pending} icon={Clock} />
          <Kpi label="Tempo médio de espera" value={transportKpis.avgWait} icon={Clock} hint="Solicitação → Aceite" />
          <Kpi label="Tempo médio de execução" value={transportKpis.avgExecution} icon={Clock} hint="Início → Fim" />
          <Kpi label="Tempo total médio" value={transportKpis.avgTotal} icon={Clock} hint="Solicitação → Conclusão" />
        </div>
      </section>

      <section>
        <div className="flex items-center gap-2 mb-3">
          <BedDouble className="h-5 w-5 text-primary" />
          <h2 className="text-xl font-semibold">Ciclo de Leitos</h2>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
          <Kpi label="Eventos registrados" value={bedKpis.totalEvents} icon={BarChart3} />
          <Kpi label="Leitos monitorados" value={bedKpis.uniqueBeds} icon={BedDouble} />
          <Kpi
            label="Tempo médio de preparação"
            value={bedKpis.avgCleaning}
            icon={Clock}
            hint="Início → Finalização da limpeza"
          />
          <Kpi
            label="Alta médica → Desocupação"
            value={bedKpis.avgDischargeToVacate}
            icon={Clock}
          />
          <Kpi
            label="Giro do leito"
            value={bedKpis.avgTurnover}
            icon={TrendingUp}
            hint="Alta médica → Próxima ocupação"
          />
        </div>
      </section>
    </div>
  );
}

function Kpi({
  label,
  value,
  icon: Icon,
  hint,
}: {
  label: string;
  value: string | number;
  icon: typeof Clock;
  hint?: string;
}) {
  return (
    <Card className="p-4">
      <div className="flex items-start justify-between mb-2">
        <span className="text-xs uppercase tracking-wide text-muted-foreground">{label}</span>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </div>
      <div className="text-2xl font-bold font-mono">{value}</div>
      {hint && <div className="text-[10px] text-muted-foreground mt-1">{hint}</div>}
    </Card>
  );
}
