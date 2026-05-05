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
import { Badge } from "@/components/ui/badge";
import { BedDouble, Plus, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useHospital } from "@/contexts/HospitalContext";
import { useDepartment } from "@/contexts/DepartmentContext";
import { SECTOR_BED_CONFIG, getNextBedNumber, isExtraBed, formatBedDisplay } from "@/utils/bedNaming";

export type BedSlot = {
  bed_number: string;
  status: "vacant" | "occupied" | "maintenance" | "extra-suggestion";
  patient_id?: string;
  patient_name?: string;
  maintenance_reason?: string | null;
  display_order?: number | null;
};

interface BedSelectionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sector: string; // "red" | "yellow" | "blue"
  title?: string;
  description?: string;
  patientName?: string;
  /** Called with the chosen bed number (existing vacant or freshly-named EXTRA). 
   *  If the chosen bed corresponds to a vacant placeholder row, vacantPlaceholderId is provided. */
  onSelect: (bedNumber: string, vacantPlaceholderId?: string) => void | Promise<void>;
  /** Optional: when true, shows an "Allocate to EXTRA bed" CTA even if vacant beds exist */
  allowExtraAlways?: boolean;
}

const sectorColorMap: Record<string, { bg: string; ring: string; text: string; label: string }> = {
  red:    { bg: "bg-red-500",    ring: "ring-red-500/40",    text: "text-red-600 dark:text-red-400",       label: "Sala de Cuidados Especiais" },
  yellow: { bg: "bg-yellow-500", ring: "ring-yellow-500/40", text: "text-yellow-600 dark:text-yellow-400", label: "Observação Amarela" },
  blue:   { bg: "bg-blue-500",   ring: "ring-blue-500/40",   text: "text-blue-600 dark:text-blue-400",     label: "Observação Azul" },
};

export function BedSelectionDialog({
  open,
  onOpenChange,
  sector,
  title,
  description,
  patientName,
  onSelect,
  allowExtraAlways = false,
}: BedSelectionDialogProps) {
  const { currentHospital, currentState } = useHospital();
  const { currentDepartment } = useDepartment();
  const [slots, setSlots] = useState<BedSlot[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState<string | null>(null);

  const colors = sectorColorMap[sector] || sectorColorMap.red;
  const config = SECTOR_BED_CONFIG[sector];

  useEffect(() => {
    if (!open || !currentHospital?.id || !currentState?.id) return;
    let cancelled = false;
    setLoading(true);
    (async () => {
      const { data, error } = await supabase
        .from("patients")
        .select("id, bed_number, name, is_vacant, display_order, bed_status, bed_maintenance_reason")
        .eq("hospital_unit_id", currentHospital.id)
        .eq("state_id", currentState.id)
        .eq("department", currentDepartment)
        .eq("sector", sector);

      if (cancelled) return;
      if (error) {
        console.error("[BedSelection] fetch error", error);
        setSlots([]);
        setLoading(false);
        return;
      }

      // Build full slot list from sector capacity
      const existingBeds = (data || []).map((p: any) => ({
        id: p.id as string,
        bed_number: p.bed_number as string,
        is_vacant: !!p.is_vacant,
        name: p.name as string,
        display_order: p.display_order as number | null,
        bed_status: p.bed_status as string | null,
        bed_maintenance_reason: p.bed_maintenance_reason as string | null,
      }));

      const map = new Map<string, BedSlot>();
      // 1) Generate fixed regular slots (V01..Vxx, A01..Axx, Z01..Zxx)
      if (config && Number.isFinite(config.maxRegularBeds)) {
        for (let i = 1; i <= config.maxRegularBeds; i++) {
          const bn = `${config.prefix}${String(i).padStart(2, "0")}`;
          map.set(bn, { bed_number: bn, status: "vacant" });
        }
      }
      // 2) Overlay actual data (occupied / vacant placeholder)
      existingBeds.forEach((b) => {
        map.set(b.bed_number, {
          bed_number: b.bed_number,
          status: b.bed_status === "maintenance" ? "maintenance" : b.is_vacant ? "vacant" : "occupied",
          patient_id: b.id,
          patient_name: b.is_vacant ? undefined : b.name,
          maintenance_reason: b.bed_maintenance_reason,
          display_order: b.display_order,
        });
      });
      // 3) Sort
      const ordered = Array.from(map.values()).sort((a, b) =>
        a.bed_number.localeCompare(b.bed_number, undefined, { numeric: true })
      );
      setSlots(ordered);
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [open, currentHospital?.id, currentState?.id, currentDepartment, sector, config]);

  const vacantCount = useMemo(() => slots.filter((s) => s.status === "vacant").length, [slots]);
  const occupiedBedNumbers = useMemo(
    () => slots.filter((s) => s.status === "occupied").map((s) => s.bed_number),
    [slots]
  );

  const handlePick = async (slot: BedSlot) => {
    if (slot.status === "occupied") return;
    setSubmitting(slot.bed_number);
    try {
      // For vacant placeholder rows (already in DB), we pass the placeholder id so caller can delete it.
      await onSelect(slot.bed_number, slot.patient_id);
      onOpenChange(false);
    } finally {
      setSubmitting(null);
    }
  };

  const handleCreateExtra = async () => {
    const allBedNumbers = slots
      .filter((s) => s.status !== "vacant" || s.patient_id) // include both occupied and extras already present
      .map((s) => s.bed_number);
    const nextExtra = getNextBedNumber(sector, [...occupiedBedNumbers, ...allBedNumbers.filter(isExtraBed)], currentDepartment);
    setSubmitting(nextExtra);
    try {
      await onSelect(nextExtra);
      onOpenChange(false);
    } finally {
      setSubmitting(null);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[560px]">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className={cn("h-10 w-10 rounded-lg flex items-center justify-center text-white", colors.bg)}>
              <BedDouble className="h-5 w-5" />
            </div>
            <div className="flex-1 min-w-0">
              <DialogTitle className="text-lg">{title || "Selecionar Leito"}</DialogTitle>
              <DialogDescription className="text-xs">
                {description || `Escolha um leito disponível em ${colors.label}.`}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {patientName && (
          <div className="rounded-lg bg-muted px-3 py-2 text-sm">
            <span className="text-muted-foreground">Paciente:</span>{" "}
            <span className="font-semibold uppercase">{patientName}</span>
          </div>
        )}

        <div className="flex items-center justify-between pt-1">
          <p className={cn("text-xs font-medium", colors.text)}>
            {colors.label}
          </p>
          <Badge variant="outline" className="text-[10px]">
            {vacantCount} de {config?.maxRegularBeds ?? slots.length} disponíveis
          </Badge>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-10 text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin mr-2" /> Carregando leitos…
          </div>
        ) : (
          <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 py-2">
            {slots.map((s) => {
              const isOccupied = s.status === "occupied";
              const isMaintenance = s.status === "maintenance";
              const isBusy = submitting === s.bed_number;
              return (
                <button
                  key={s.bed_number}
                  type="button"
                  disabled={isOccupied || isMaintenance || !!submitting}
                  onClick={() => handlePick(s)}
                  className={cn(
                    "relative rounded-lg border p-3 text-center transition-all duration-150",
                    "flex flex-col items-center gap-1",
                    isOccupied || isMaintenance
                      ? "bg-muted/50 border-border text-muted-foreground cursor-not-allowed opacity-60"
                      : cn(
                          "bg-background hover:scale-[1.03] hover:shadow-md cursor-pointer",
                          "border-2 hover:border-current",
                          colors.text
                        ),
                    isBusy && "ring-2",
                    isBusy && colors.ring,
                  )}
                  title={isMaintenance ? `Interditado: ${s.maintenance_reason || 'manutenção'}` : isOccupied ? `Ocupado por ${s.patient_name}` : `Alocar em ${s.bed_number}`}
                >
                  <span className="text-base font-bold tracking-wide">
                    {formatBedDisplay(s.bed_number)}
                  </span>
                  <span className="text-[10px] uppercase tracking-wide">
                    {isMaintenance ? "Interditado" : isOccupied ? "Ocupado" : isBusy ? "Alocando…" : "Disponível"}
                  </span>
                  {isOccupied && s.patient_name && (
                    <span className="text-[9px] truncate max-w-full text-muted-foreground/80">
                      {s.patient_name}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        )}

        <div className={cn(
          "rounded-lg border-2 border-dashed p-3 mt-1",
          vacantCount === 0 ? "border-amber-500/50 bg-amber-500/5" : "border-border"
        )}>
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="text-sm font-semibold">
                {vacantCount === 0 ? "Setor lotado" : "Precisa de um leito EXTRA?"}
              </p>
              <p className="text-xs text-muted-foreground">
                {vacantCount === 0
                  ? "Não há leitos regulares disponíveis. Você pode criar um leito EXTRA."
                  : "Use apenas se for estritamente necessário acrescentar capacidade."}
              </p>
            </div>
            <Button
              variant={vacantCount === 0 ? "default" : "outline"}
              size="sm"
              onClick={handleCreateExtra}
              disabled={!!submitting}
              className="shrink-0"
            >
              <Plus className="h-4 w-4 mr-1" /> Criar EXTRA
            </Button>
          </div>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={!!submitting}>
            Cancelar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
