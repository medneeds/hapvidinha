import { useState, useMemo } from "react";
import { useBedLifecycle, BED_EVENT_LABELS, BED_EVENT_ORDER, BedEventType } from "@/hooks/useBedLifecycle";
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
import { BedDouble, Plus, Clock, Search } from "lucide-react";
import { format, formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

export default function GoBedsPage() {
  const { events, registerEvent } = useBedLifecycle();
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [form, setForm] = useState({
    bed_number: "",
    sector: "",
    patient_name: "",
    event_type: "medical_discharge" as BedEventType,
    notes: "",
    department: "",
  });

  // Agrupa eventos por leito
  const bedGroups = useMemo(() => {
    const map = new Map<string, typeof events>();
    events.forEach((e) => {
      const key = e.bed_number;
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(e);
    });
    return Array.from(map.entries())
      .filter(([bed]) => !search || bed.toLowerCase().includes(search.toLowerCase()))
      .sort((a, b) => {
        const aLast = a[1][0]?.event_at || "";
        const bLast = b[1][0]?.event_at || "";
        return bLast.localeCompare(aLast);
      });
  }, [events, search]);

  const reset = () =>
    setForm({
      bed_number: "",
      sector: "",
      patient_name: "",
      event_type: "medical_discharge",
      notes: "",
      department: "",
    });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.bed_number) return;
    const ok = await registerEvent({
      bed_number: form.bed_number.toUpperCase(),
      sector: form.sector || null,
      patient_id: null,
      patient_name: form.patient_name || null,
      event_type: form.event_type,
      notes: form.notes || null,
      department: form.department || null,
      cycle_id: null,
    });
    if (ok) {
      reset();
      setOpen(false);
    }
  };

  const quickRegister = async (bed: string, type: BedEventType, sector?: string | null) => {
    await registerEvent({
      bed_number: bed,
      sector: sector || null,
      patient_id: null,
      patient_name: null,
      event_type: type,
      notes: null,
      department: null,
      cycle_id: null,
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Ciclo de Leitos</h1>
          <p className="text-muted-foreground">
            Registro manual de cada etapa: alta, desocupação, preparação e ocupação.
          </p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button size="lg">
              <Plus className="h-4 w-4 mr-2" /> Registrar evento
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Registrar evento de leito</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Leito *</Label>
                  <Input
                    value={form.bed_number}
                    onChange={(e) => setForm({ ...form, bed_number: e.target.value.toUpperCase() })}
                    placeholder="Ex: A12"
                    required
                  />
                </div>
                <div>
                  <Label>Setor</Label>
                  <Input
                    value={form.sector}
                    onChange={(e) => setForm({ ...form, sector: e.target.value })}
                    placeholder="Ex: Enfermaria"
                  />
                </div>
              </div>

              <div>
                <Label>Tipo de evento *</Label>
                <Select
                  value={form.event_type}
                  onValueChange={(v) => setForm({ ...form, event_type: v as BedEventType })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {BED_EVENT_ORDER.map((t) => (
                      <SelectItem key={t} value={t}>
                        {BED_EVENT_LABELS[t]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Paciente (opcional)</Label>
                <Input
                  value={form.patient_name}
                  onChange={(e) => setForm({ ...form, patient_name: e.target.value })}
                />
              </div>

              <div>
                <Label>Observações</Label>
                <Textarea
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  rows={2}
                />
              </div>

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit">Registrar</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Buscar por leito..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10 max-w-sm"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {bedGroups.map(([bed, bedEvents]) => {
          const last = bedEvents[0];
          const sector = bedEvents.find((e) => e.sector)?.sector;
          return (
            <Card key={bed} className="p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <BedDouble className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <div className="font-bold text-lg">Leito {bed}</div>
                    {sector && <div className="text-xs text-muted-foreground">{sector}</div>}
                  </div>
                </div>
                <Badge variant="outline" className="font-mono text-xs">
                  Último: {BED_EVENT_LABELS[last.event_type]}
                </Badge>
              </div>

              <div className="text-xs text-muted-foreground flex items-center gap-1 mb-3">
                <Clock className="h-3 w-3" />
                há {formatDistanceToNow(new Date(last.event_at), { locale: ptBR })}
              </div>

              <div className="grid grid-cols-2 gap-2 mb-3">
                {BED_EVENT_ORDER.map((type) => {
                  const evt = bedEvents.find((e) => e.event_type === type);
                  return (
                    <div
                      key={type}
                      className={`text-xs p-2 rounded border ${
                        evt ? "bg-emerald-50 border-emerald-200" : "bg-muted/40 border-border"
                      }`}
                    >
                      <div className="font-medium truncate">{BED_EVENT_LABELS[type]}</div>
                      <div className="font-mono text-[10px] text-muted-foreground mt-0.5">
                        {evt ? format(new Date(evt.event_at), "dd/MM HH:mm", { locale: ptBR }) : "—"}
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="flex flex-wrap gap-1">
                {BED_EVENT_ORDER.map((type) => (
                  <Button
                    key={type}
                    size="sm"
                    variant="outline"
                    className="text-[10px] h-7"
                    onClick={() => quickRegister(bed, type, sector)}
                  >
                    + {BED_EVENT_LABELS[type]}
                  </Button>
                ))}
              </div>
            </Card>
          );
        })}

        {bedGroups.length === 0 && (
          <Card className="p-12 text-center text-muted-foreground col-span-full">
            <BedDouble className="h-10 w-10 mx-auto mb-3 opacity-50" />
            Nenhum evento de leito registrado ainda.
          </Card>
        )}
      </div>
    </div>
  );
}
