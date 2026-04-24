import { Link } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Truck, BedDouble, BarChart3, Clock, Activity, AlertCircle } from "lucide-react";
import { useTransportRequests } from "@/hooks/useTransportRequests";
import { useBedLifecycle } from "@/hooks/useBedLifecycle";
import { Badge } from "@/components/ui/badge";

export default function GoOverviewPage() {
  const { requests } = useTransportRequests();
  const { events } = useBedLifecycle();

  const pending = requests.filter((r) => r.status === "pending").length;
  const inProgress = requests.filter((r) => r.status === "in_progress" || r.status === "accepted").length;
  const completedToday = requests.filter(
    (r) => r.status === "completed" && r.completed_at && new Date(r.completed_at).toDateString() === new Date().toDateString()
  ).length;
  const eventsToday = events.filter(
    (e) => new Date(e.event_at).toDateString() === new Date().toDateString()
  ).length;

  const cards = [
    {
      to: "/go/conductors",
      title: "Condutores",
      description: "Solicitações de transporte e chamados gerais",
      icon: Truck,
      stats: [
        { label: "Pendentes", value: pending, variant: pending > 0 ? "warning" : "default" },
        { label: "Em andamento", value: inProgress },
        { label: "Concluídos hoje", value: completedToday },
      ],
      gradient: "from-blue-500/20 to-cyan-500/10",
    },
    {
      to: "/go/beds",
      title: "Ciclo de Leitos",
      description: "Registro das etapas operacionais por leito",
      icon: BedDouble,
      stats: [{ label: "Eventos hoje", value: eventsToday }],
      gradient: "from-emerald-500/20 to-teal-500/10",
    },
    {
      to: "/go/indicators",
      title: "Indicadores",
      description: "Tempos médios, KPIs e desempenho operacional",
      icon: BarChart3,
      stats: [],
      gradient: "from-purple-500/20 to-pink-500/10",
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Visão Geral</h1>
        <p className="text-muted-foreground">
          Painel operacional do HAPMAP GO — sincronizado em tempo real.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Chamados pendentes</p>
              <p className="text-3xl font-bold mt-1">{pending}</p>
            </div>
            <AlertCircle className="h-8 w-8 text-amber-500" />
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Em andamento</p>
              <p className="text-3xl font-bold mt-1">{inProgress}</p>
            </div>
            <Activity className="h-8 w-8 text-blue-500" />
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Concluídos hoje</p>
              <p className="text-3xl font-bold mt-1">{completedToday}</p>
            </div>
            <Clock className="h-8 w-8 text-emerald-500" />
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Eventos de leito hoje</p>
              <p className="text-3xl font-bold mt-1">{eventsToday}</p>
            </div>
            <BedDouble className="h-8 w-8 text-teal-500" />
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {cards.map((c) => {
          const Icon = c.icon;
          return (
            <Link key={c.to} to={c.to} className="group">
              <Card className={`p-6 h-full hover:shadow-lg transition-all bg-gradient-to-br ${c.gradient} border-2 hover:border-primary/40`}>
                <div className="flex items-start justify-between mb-4">
                  <Icon className="h-10 w-10 text-primary" />
                </div>
                <h3 className="text-xl font-bold">{c.title}</h3>
                <p className="text-sm text-muted-foreground mt-1 mb-4">{c.description}</p>
                <div className="flex flex-wrap gap-2">
                  {c.stats.map((s) => (
                    <Badge key={s.label} variant="secondary" className="font-mono">
                      {s.label}: <span className="ml-1 font-bold">{s.value}</span>
                    </Badge>
                  ))}
                </div>
              </Card>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
