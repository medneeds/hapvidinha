import { useState } from "react";
import { useTransportRequests, TransportRequest, TransportPriority, TransportType } from "@/hooks/useTransportRequests";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Plus, Truck, Play, Check, X, Clock, MapPin, User as UserIcon } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

const PRIORITY_LABELS: Record<TransportPriority, string> = {
  low: "Baixa",
  normal: "Normal",
  high: "Alta",
  urgent: "Urgente",
};

const PRIORITY_COLORS: Record<TransportPriority, string> = {
  low: "bg-slate-200 text-slate-700",
  normal: "bg-blue-100 text-blue-700",
  high: "bg-amber-100 text-amber-700",
  urgent: "bg-red-100 text-red-700 animate-pulse",
};

export default function GoConductorsPage() {
  const { requests, createRequest, updateStatus } = useTransportRequests();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    request_type: "patient" as TransportType,
    patient_name: "",
    patient_bed: "",
    origin: "",
    destination: "",
    description: "",
    priority: "normal" as TransportPriority,
    department: "",
  });

  const reset = () =>
    setForm({
      request_type: "patient",
      patient_name: "",
      patient_bed: "",
      origin: "",
      destination: "",
      description: "",
      priority: "normal",
      department: "",
    });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.origin || !form.destination) return;
    const ok = await createRequest({
      ...form,
      patient_id: null,
      patient_name: form.request_type === "patient" ? form.patient_name : null,
      patient_bed: form.request_type === "patient" ? form.patient_bed : null,
      notes: null,
      requested_by_name: null,
    });
    if (ok) {
      reset();
      setOpen(false);
    }
  };

  const filterByStatus = (statuses: TransportRequest["status"][]) =>
    requests.filter((r) => statuses.includes(r.status));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Condutores</h1>
          <p className="text-muted-foreground">
            Solicitações de transporte de pacientes e chamados gerais.
          </p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button size="lg">
              <Plus className="h-4 w-4 mr-2" /> Novo chamado
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Novo chamado de condutor</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Tipo</Label>
                  <Select
                    value={form.request_type}
                    onValueChange={(v) => setForm({ ...form, request_type: v as TransportType })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="patient">Transporte de paciente</SelectItem>
                      <SelectItem value="general">Chamado geral</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Prioridade</Label>
                  <Select
                    value={form.priority}
                    onValueChange={(v) => setForm({ ...form, priority: v as TransportPriority })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(PRIORITY_LABELS).map(([k, v]) => (
                        <SelectItem key={k} value={k}>
                          {v}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {form.request_type === "patient" && (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label>Paciente</Label>
                    <Input
                      value={form.patient_name}
                      onChange={(e) => setForm({ ...form, patient_name: e.target.value })}
                      placeholder="Nome do paciente"
                    />
                  </div>
                  <div>
                    <Label>Leito</Label>
                    <Input
                      value={form.patient_bed}
                      onChange={(e) => setForm({ ...form, patient_bed: e.target.value })}
                      placeholder="Ex: A12"
                    />
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Origem *</Label>
                  <Input
                    value={form.origin}
                    onChange={(e) => setForm({ ...form, origin: e.target.value })}
                    placeholder="Ex: Enfermaria 3"
                    required
                  />
                </div>
                <div>
                  <Label>Destino *</Label>
                  <Input
                    value={form.destination}
                    onChange={(e) => setForm({ ...form, destination: e.target.value })}
                    placeholder="Ex: Tomografia"
                    required
                  />
                </div>
              </div>

              <div>
                <Label>Setor / Departamento</Label>
                <Input
                  value={form.department}
                  onChange={(e) => setForm({ ...form, department: e.target.value })}
                  placeholder="Opcional"
                />
              </div>

              <div>
                <Label>Descrição</Label>
                <Textarea
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="Detalhes adicionais"
                  rows={3}
                />
              </div>

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit">Criar chamado</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Tabs defaultValue="active">
        <TabsList>
          <TabsTrigger value="active">
            Ativos ({filterByStatus(["pending", "accepted", "in_progress"]).length})
          </TabsTrigger>
          <TabsTrigger value="completed">
            Concluídos ({filterByStatus(["completed"]).length})
          </TabsTrigger>
          <TabsTrigger value="cancelled">
            Cancelados ({filterByStatus(["cancelled"]).length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="active" className="space-y-3 mt-4">
          {filterByStatus(["pending", "accepted", "in_progress"]).map((r) => (
            <RequestCard key={r.id} request={r} onAction={updateStatus} />
          ))}
          {filterByStatus(["pending", "accepted", "in_progress"]).length === 0 && (
            <EmptyState message="Nenhum chamado ativo." />
          )}
        </TabsContent>
        <TabsContent value="completed" className="space-y-3 mt-4">
          {filterByStatus(["completed"]).slice(0, 50).map((r) => (
            <RequestCard key={r.id} request={r} onAction={updateStatus} />
          ))}
          {filterByStatus(["completed"]).length === 0 && (
            <EmptyState message="Nenhum chamado concluído." />
          )}
        </TabsContent>
        <TabsContent value="cancelled" className="space-y-3 mt-4">
          {filterByStatus(["cancelled"]).map((r) => (
            <RequestCard key={r.id} request={r} onAction={updateStatus} />
          ))}
          {filterByStatus(["cancelled"]).length === 0 && (
            <EmptyState message="Nenhum chamado cancelado." />
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <Card className="p-12 text-center text-muted-foreground">
      <Truck className="h-10 w-10 mx-auto mb-3 opacity-50" />
      {message}
    </Card>
  );
}

function RequestCard({
  request,
  onAction,
}: {
  request: TransportRequest;
  onAction: (id: string, status: TransportRequest["status"]) => Promise<boolean | undefined>;
}) {
  const fmt = (d: string | null) =>
    d ? format(new Date(d), "dd/MM HH:mm", { locale: ptBR }) : "—";

  const statusBadge = {
    pending: <Badge variant="outline" className="border-amber-400 text-amber-700">Pendente</Badge>,
    accepted: <Badge variant="outline" className="border-blue-400 text-blue-700">Aceito</Badge>,
    in_progress: <Badge className="bg-blue-500">Em execução</Badge>,
    completed: <Badge className="bg-emerald-600">Concluído</Badge>,
    cancelled: <Badge variant="destructive">Cancelado</Badge>,
  }[request.status];

  return (
    <Card className="p-4">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div className="flex-1 min-w-0 space-y-2">
          <div className="flex items-center gap-2 flex-wrap">
            <Badge className={PRIORITY_COLORS[request.priority]}>
              {PRIORITY_LABELS[request.priority]}
            </Badge>
            {statusBadge}
            <Badge variant="secondary">
              {request.request_type === "patient" ? "Paciente" : "Geral"}
            </Badge>
          </div>

          {request.request_type === "patient" && request.patient_name && (
            <div className="flex items-center gap-2 font-semibold">
              <UserIcon className="h-4 w-4" />
              {request.patient_name}
              {request.patient_bed && (
                <span className="text-xs text-muted-foreground">• Leito {request.patient_bed}</span>
              )}
            </div>
          )}

          <div className="flex items-center gap-2 text-sm">
            <MapPin className="h-4 w-4 text-muted-foreground" />
            <span className="font-medium">{request.origin}</span>
            <span className="text-muted-foreground">→</span>
            <span className="font-medium">{request.destination}</span>
          </div>

          {request.description && (
            <p className="text-sm text-muted-foreground">{request.description}</p>
          )}

          <div className="flex items-center gap-4 text-xs text-muted-foreground flex-wrap">
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3" /> Solicitado: {fmt(request.created_at)}
            </span>
            {request.accepted_at && <span>Aceito: {fmt(request.accepted_at)}</span>}
            {request.started_at && <span>Iniciado: {fmt(request.started_at)}</span>}
            {request.completed_at && <span>Concluído: {fmt(request.completed_at)}</span>}
            {request.assigned_to_name && <span>Condutor: {request.assigned_to_name}</span>}
          </div>
        </div>

        <div className="flex flex-col gap-2 shrink-0">
          {request.status === "pending" && (
            <>
              <Button size="sm" onClick={() => onAction(request.id, "accepted")}>
                <Check className="h-4 w-4 mr-1" /> Aceitar
              </Button>
              <Button size="sm" variant="outline" onClick={() => onAction(request.id, "cancelled")}>
                <X className="h-4 w-4 mr-1" /> Cancelar
              </Button>
            </>
          )}
          {request.status === "accepted" && (
            <Button size="sm" onClick={() => onAction(request.id, "in_progress")}>
              <Play className="h-4 w-4 mr-1" /> Iniciar
            </Button>
          )}
          {request.status === "in_progress" && (
            <Button size="sm" onClick={() => onAction(request.id, "completed")}>
              <Check className="h-4 w-4 mr-1" /> Finalizar
            </Button>
          )}
        </div>
      </div>
    </Card>
  );
}
