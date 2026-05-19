import { useEffect, useMemo, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ArrowLeftRight, Loader2, Search } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useHospital } from "@/contexts/HospitalContext";
import { useDepartment } from "@/contexts/DepartmentContext";
import { toast } from "@/hooks/use-toast";
import type { Patient } from "@/types/patient";
import { buildPatientSlotPayloadFromPatient, buildPatientSlotPayloadFromRecord } from "@/utils/patientSlotPayload";
import { cn } from "@/lib/utils";

interface BedSwapDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  patient: Patient | null;
  onSwapped?: () => void | Promise<void>;
}

const sectorLabels: Record<string, string> = {
  red: "Cuidados Especiais",
  yellow: "Obs. Amarela",
  blue: "Obs. Azul",
  outside: "Fora das Alas",
};

const sectorColor: Record<string, string> = {
  red: "bg-red-500/10 text-red-600 border-red-500/30",
  yellow: "bg-yellow-500/10 text-yellow-600 border-yellow-500/30",
  blue: "bg-blue-500/10 text-blue-600 border-blue-500/30",
  outside: "bg-muted text-muted-foreground border-border",
};

interface SwapCandidate {
  id: string;
  name: string;
  bed_number: string;
  sector: string;
  display_order: number | null;
}

type CandidateRow = SwapCandidate & { is_vacant: boolean | null };

export function BedSwapDialog({ open, onOpenChange, patient, onSwapped }: BedSwapDialogProps) {
  const { currentHospital, currentState } = useHospital();
  const { currentDepartment } = useDepartment();
  const [candidates, setCandidates] = useState<SwapCandidate[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [submitting, setSubmitting] = useState<string | null>(null);

  useEffect(() => {
    if (!open || !patient || !currentHospital?.id || !currentState?.id) return;
    let cancelled = false;
    setLoading(true);
    (async () => {
      const { data, error } = await supabase
        .from("patients")
        .select("id, name, bed_number, sector, display_order, is_vacant")
        .eq("hospital_unit_id", currentHospital.id)
        .eq("state_id", currentState.id)
        .eq("department", currentDepartment)
        .neq("id", patient.id);

      if (cancelled) return;
      if (error) {
        console.error("[BedSwap] fetch error", error);
        setCandidates([]);
      } else {
        setCandidates(
          ((data || []) as CandidateRow[])
            .filter((p) => !p.is_vacant && (p.name?.trim() || "").length > 0)
            .map((p) => ({
              id: p.id,
              name: p.name,
              bed_number: p.bed_number,
              sector: p.sector,
              display_order: p.display_order,
            }))
        );
      }
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [open, patient, currentHospital?.id, currentState?.id, currentDepartment]);

  const filtered = useMemo(() => {
    const q = search.trim().toUpperCase();
    if (!q) return candidates;
    return candidates.filter(
      (c) =>
        c.name.toUpperCase().includes(q) ||
        c.bed_number.toUpperCase().includes(q)
    );
  }, [candidates, search]);

  const handleSwap = async (target: SwapCandidate) => {
    if (!patient) return;
    setSubmitting(target.id);
    try {
      const { data: targetRecord, error: targetError } = await supabase
        .from("patients")
        .select("*")
        .eq("id", target.id)
        .single();
      if (targetError) throw targetError;

      const [originUpdate, targetUpdate] = await Promise.all([
        supabase
          .from("patients")
          .update(buildPatientSlotPayloadFromRecord(targetRecord, patient.sector))
          .eq("id", patient.id),
        supabase
          .from("patients")
          .update(buildPatientSlotPayloadFromPatient(patient, target.sector as Patient['sector']))
          .eq("id", target.id),
      ]);

      if (originUpdate.error) throw originUpdate.error;
      if (targetUpdate.error) throw targetUpdate.error;

      toast({
        title: "Permuta realizada",
        description: `${patient.name} ↔ ${target.name} trocaram de leito.`,
      });

      if (onSwapped) await onSwapped();
      onOpenChange(false);
    } catch (err) {
      console.error("[BedSwap] failed", err);
      toast({
        title: "Erro na permuta",
        description: "Não foi possível trocar os leitos. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setSubmitting(null);
    }
  };

  if (!patient) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-teal-500 flex items-center justify-center text-white">
              <ArrowLeftRight className="h-5 w-5" />
            </div>
            <div>
              <DialogTitle>Permutar Leitos</DialogTitle>
              <DialogDescription className="text-xs">
                Selecione outro paciente para trocar de leito (mantém todos os dados clínicos).
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="rounded-lg bg-muted px-3 py-2 text-sm flex items-center justify-between gap-2">
          <div className="min-w-0">
            <p className="text-xs text-muted-foreground">Paciente A (origem)</p>
            <p className="font-semibold uppercase truncate">{patient.name}</p>
          </div>
          <Badge variant="outline" className={cn("text-[11px]", sectorColor[patient.sector])}>
            {patient.bedNumber} · {sectorLabels[patient.sector]}
          </Badge>
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nome ou leito…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-10 text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin mr-2" /> Carregando…
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-8 text-sm text-muted-foreground">
            Nenhum paciente encontrado para permuta.
          </div>
        ) : (
          <div className="max-h-[380px] overflow-y-auto space-y-1 pr-1">
            {filtered.map((c) => {
              const busy = submitting === c.id;
              return (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => handleSwap(c)}
                  disabled={!!submitting}
                  className={cn(
                    "w-full flex items-center justify-between gap-3 rounded-lg border p-3 text-left transition-all",
                    "hover:bg-accent hover:border-teal-500/50 hover:shadow-sm",
                    busy && "ring-2 ring-teal-500/40",
                    submitting && !busy && "opacity-50"
                  )}
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold uppercase truncate">{c.name}</p>
                    <p className="text-xs text-muted-foreground">
                      Trocar para o leito <strong>{patient.bedNumber}</strong> ({sectorLabels[patient.sector]})
                    </p>
                  </div>
                  <Badge variant="outline" className={cn("text-[11px] shrink-0", sectorColor[c.sector])}>
                    {c.bed_number} · {sectorLabels[c.sector]}
                  </Badge>
                  {busy && <Loader2 className="h-4 w-4 animate-spin text-teal-500" />}
                </button>
              );
            })}
          </div>
        )}

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={!!submitting}>
            Cancelar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
