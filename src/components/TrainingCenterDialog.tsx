import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { CheckCircle2, Circle, Play, RotateCcw, GraduationCap, X } from "lucide-react";
import { TRAINING_TOURS } from "@/data/trainingTours";
import { TrainingSettings } from "@/hooks/useTrainingScheduler";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  settings: TrainingSettings;
  onUpdateSettings: (s: TrainingSettings) => void;
  completedIds: string[];
  dismissedIds: string[];
  onStartTour: (id: string) => void;
  onResetProgress: () => void;
}

export function TrainingCenterDialog({
  open,
  onOpenChange,
  settings,
  onUpdateSettings,
  completedIds,
  dismissedIds,
  onStartTour,
  onResetProgress,
}: Props) {
  const [localHours, setLocalHours] = useState<number[]>(settings.hours);

  const handleFrequencyChange = (val: string) => {
    const freq = parseInt(val, 10);
    const defaults = [9, 13, 16].slice(0, freq);
    const merged = [...localHours.slice(0, freq), ...defaults.slice(localHours.length)].slice(0, freq);
    setLocalHours(merged);
    onUpdateSettings({ ...settings, frequencyPerDay: freq, hours: merged });
  };

  const handleHourChange = (idx: number, val: string) => {
    const h = Math.max(0, Math.min(23, parseInt(val, 10) || 0));
    const next = [...localHours];
    next[idx] = h;
    setLocalHours(next);
    onUpdateSettings({ ...settings, hours: next });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl" aria-describedby="training-center-desc">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <GraduationCap className="h-5 w-5 text-violet-500" />
            Central de Treinamentos
          </DialogTitle>
          <DialogDescription id="training-center-desc">
            Reveja tours, acompanhe progresso e personalize a frequência dos pop-ups.
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="tours" className="mt-2">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="tours">Tours ({TRAINING_TOURS.length})</TabsTrigger>
            <TabsTrigger value="settings">Preferências</TabsTrigger>
          </TabsList>

          <TabsContent value="tours" className="mt-4">
            <ScrollArea className="h-[420px] pr-3">
              <ul className="space-y-2" aria-label="Lista de tours de treinamento">
                {TRAINING_TOURS.map((t) => {
                  const done = completedIds.includes(t.id);
                  const dismissed = dismissedIds.includes(t.id) && !done;
                  return (
                    <li
                      key={t.id}
                      className="flex items-start gap-3 rounded-lg border border-border/60 p-3 hover:bg-accent/40 transition-colors"
                    >
                      <div className="mt-0.5">
                        {done ? (
                          <CheckCircle2 className="h-5 w-5 text-emerald-500" aria-label="Concluído" />
                        ) : (
                          <Circle className="h-5 w-5 text-muted-foreground" aria-label="Pendente" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-medium text-sm">{t.title}</span>
                          <Badge variant="outline" className="text-[10px]">
                            {t.badge}
                          </Badge>
                          {done && <Badge className="bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 text-[10px]">Concluído</Badge>}
                          {dismissed && <Badge variant="secondary" className="text-[10px]">Dispensado</Badge>}
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{t.hook}</p>
                        <p className="text-[10px] text-muted-foreground/70 mt-1">
                          {t.slides.length} slide{t.slides.length > 1 ? "s" : ""} • ~{t.estimatedSeconds}s
                        </p>
                      </div>
                      <Button
                        size="sm"
                        variant={done ? "outline" : "default"}
                        onClick={() => onStartTour(t.id)}
                        aria-label={`${done ? "Rever" : "Iniciar"} tour ${t.title}`}
                        className="gap-1"
                      >
                        <Play className="h-3.5 w-3.5" />
                        {done ? "Rever" : "Iniciar"}
                      </Button>
                    </li>
                  );
                })}
              </ul>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="settings" className="mt-4 space-y-5">
            <div className="flex items-center justify-between rounded-lg border p-3">
              <div>
                <Label htmlFor="training-enabled" className="text-sm font-medium">
                  Pop-ups automáticos
                </Label>
                <p className="text-xs text-muted-foreground">Receba treinamentos espontâneos durante o expediente.</p>
              </div>
              <Switch
                id="training-enabled"
                checked={settings.enabled}
                onCheckedChange={(v) => onUpdateSettings({ ...settings, enabled: v })}
              />
            </div>

            <div className="space-y-2">
              <Label className="text-sm">Frequência diária</Label>
              <Select
                value={String(settings.frequencyPerDay)}
                onValueChange={handleFrequencyChange}
                disabled={!settings.enabled}
              >
                <SelectTrigger aria-label="Frequência diária de pop-ups">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">1x por dia</SelectItem>
                  <SelectItem value="2">2x por dia</SelectItem>
                  <SelectItem value="3">3x por dia</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-sm">Horários personalizados</Label>
              <div className="grid grid-cols-3 gap-2">
                {Array.from({ length: settings.frequencyPerDay }).map((_, i) => (
                  <div key={i} className="space-y-1">
                    <Label htmlFor={`hour-${i}`} className="text-[11px] text-muted-foreground">
                      Pop-up {i + 1}
                    </Label>
                    <Input
                      id={`hour-${i}`}
                      type="number"
                      min={0}
                      max={23}
                      value={localHours[i] ?? 9}
                      onChange={(e) => handleHourChange(i, e.target.value)}
                      disabled={!settings.enabled}
                      aria-label={`Hora do pop-up ${i + 1}`}
                    />
                  </div>
                ))}
              </div>
              <p className="text-[11px] text-muted-foreground">Hora cheia (0–23). Intervalo mínimo de 2h entre pop-ups.</p>
            </div>

            <div className="border-t pt-4">
              <Button variant="outline" size="sm" onClick={onResetProgress} className="gap-2">
                <RotateCcw className="h-4 w-4" />
                Reiniciar progresso e campanha de 7 dias
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
