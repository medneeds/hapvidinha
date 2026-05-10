import { useMemo, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Trash2, Plus, Settings2 } from "lucide-react";
import { toast } from "sonner";
import {
  useBedSlaConfigs,
  SLA_STAGES,
  SlaStage,
  SLA_DEFAULTS,
  WILDCARD_SECTOR,
} from "@/hooks/useBedSlaConfigs";

interface Props {
  knownSectors: string[];
}

export function SlaConfigDialog({ knownSectors }: Props) {
  const { configs, upsert, remove } = useBedSlaConfigs();
  const [open, setOpen] = useState(false);
  const [sector, setSector] = useState<string>(WILDCARD_SECTOR);
  const [customSector, setCustomSector] = useState("");
  const [stage, setStage] = useState<SlaStage>("hotelaria");
  const [slaMin, setSlaMin] = useState<string>("60");
  const [warnPct, setWarnPct] = useState<string>("80");

  const sectorOptions = useMemo(() => {
    const set = new Set<string>([WILDCARD_SECTOR, ...knownSectors, ...configs.map((c) => c.sector)]);
    return Array.from(set);
  }, [knownSectors, configs]);

  const handleSave = async () => {
    const finalSector = (sector === "__custom__" ? customSector.trim() : sector).toUpperCase();
    if (!finalSector) return toast.error("INFORME O SETOR");
    const sla = parseInt(slaMin, 10);
    const warn = parseInt(warnPct, 10);
    if (!sla || sla < 1) return toast.error("SLA INVÁLIDO");
    if (!warn || warn < 1 || warn > 100) return toast.error("LIMITE DE ALERTA INVÁLIDO");
    const ok = await upsert({
      sector: finalSector,
      stage,
      sla_minutes: sla,
      warning_pct: warn,
    } as any);
    if (ok) {
      toast.success("SLA SALVO");
      setCustomSector("");
    } else toast.error("FALHA AO SALVAR");
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Settings2 className="h-4 w-4 mr-1" /> SLA
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle className="uppercase tracking-wide">Configuração de SLA por Setor</DialogTitle>
        </DialogHeader>

        <div className="text-xs text-muted-foreground uppercase">
          Defina o tempo-alvo (minutos) e o limite de alerta (% do SLA) para cada etapa por setor.
          Use <Badge variant="outline" className="mx-1 text-[10px]">{WILDCARD_SECTOR}</Badge> para
          aplicar a todos os setores sem regra específica. Padrões: HOTELARIA {SLA_DEFAULTS.hotelaria}min,
          LEITO {SLA_DEFAULTS.leito}min, TRANSFERÊNCIA {SLA_DEFAULTS.transferencia}min · ALERTA 80%.
        </div>

        <Card className="p-3 grid grid-cols-1 md:grid-cols-5 gap-2 items-end">
          <div className="md:col-span-2">
            <Label className="text-[10px] uppercase">Setor solicitado</Label>
            <Select value={sector} onValueChange={setSector}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {sectorOptions.map((s) => (
                  <SelectItem key={s} value={s}>{s === WILDCARD_SECTOR ? "TODOS (PADRÃO)" : s.toUpperCase()}</SelectItem>
                ))}
                <SelectItem value="__custom__">+ NOVO SETOR…</SelectItem>
              </SelectContent>
            </Select>
            {sector === "__custom__" && (
              <Input
                placeholder="NOME DO SETOR"
                value={customSector}
                onChange={(e) => setCustomSector(e.target.value)}
                className="mt-1 uppercase"
              />
            )}
          </div>
          <div>
            <Label className="text-[10px] uppercase">Etapa</Label>
            <Select value={stage} onValueChange={(v) => setStage(v as SlaStage)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {SLA_STAGES.map((s) => <SelectItem key={s.key} value={s.key}>{s.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-[10px] uppercase">SLA (min)</Label>
            <Input type="number" min={1} value={slaMin} onChange={(e) => setSlaMin(e.target.value)} />
          </div>
          <div>
            <Label className="text-[10px] uppercase">Alerta (%)</Label>
            <Input type="number" min={1} max={100} value={warnPct} onChange={(e) => setWarnPct(e.target.value)} />
          </div>
          <div className="md:col-span-5 flex justify-end">
            <Button size="sm" onClick={handleSave}><Plus className="h-3 w-3 mr-1" /> SALVAR REGRA</Button>
          </div>
        </Card>

        <div className="border rounded-md max-h-[320px] overflow-auto">
          <table className="w-full text-xs">
            <thead className="bg-muted/50 sticky top-0">
              <tr className="text-left uppercase tracking-wider text-[10px]">
                <th className="px-3 py-2">Setor</th>
                <th className="px-3 py-2">Etapa</th>
                <th className="px-3 py-2 text-right">SLA</th>
                <th className="px-3 py-2 text-right">Alerta</th>
                <th className="px-3 py-2"></th>
              </tr>
            </thead>
            <tbody>
              {configs.length === 0 && (
                <tr><td colSpan={5} className="px-3 py-6 text-center text-muted-foreground uppercase">Nenhuma regra cadastrada — usando padrões.</td></tr>
              )}
              {configs.sort((a, b) => a.sector.localeCompare(b.sector) || a.stage.localeCompare(b.stage)).map((c) => (
                <tr key={c.id} className="border-t">
                  <td className="px-3 py-2 font-mono">{c.sector === WILDCARD_SECTOR ? "TODOS" : c.sector}</td>
                  <td className="px-3 py-2 uppercase">{SLA_STAGES.find((s) => s.key === c.stage)?.label ?? c.stage}</td>
                  <td className="px-3 py-2 text-right tabular-nums">{c.sla_minutes} min</td>
                  <td className="px-3 py-2 text-right tabular-nums">{c.warning_pct}%</td>
                  <td className="px-3 py-2 text-right">
                    <Button size="icon" variant="ghost" onClick={async () => {
                      const ok = await remove(c.id);
                      if (ok) toast.success("REMOVIDO");
                    }}>
                      <Trash2 className="h-3 w-3 text-destructive" />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </DialogContent>
    </Dialog>
  );
}
