import { DoorOpen, UserPlus, Users, ChevronDown, Wrench, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { SectorType } from "@/types/patient";

interface EmptyBedSlotProps {
  bedNumber: string;
  sector: SectorType;
  onAllocateNew: () => void;
  onAllocateFromQueue?: () => void;
  isMaintenance?: boolean;
  maintenanceReason?: string | null;
  onBlockMaintenance?: () => void;
  onReleaseMaintenance?: () => void;
}

const sectorTokens: Record<
  SectorType,
  { container: string; bedBg: string; bedText: string; ring: string; accent: string }
> = {
  red: {
    container: "bg-critical/[0.03] hover:bg-critical/[0.06] border-critical/20",
    bedBg: "bg-critical/[0.07] border-critical/25",
    bedText: "text-critical",
    ring: "focus-visible:ring-critical/40",
    accent: "text-critical",
  },
  yellow: {
    container: "bg-warning/[0.03] hover:bg-warning/[0.06] border-warning/20",
    bedBg: "bg-warning/[0.07] border-warning/25",
    bedText: "text-warning",
    ring: "focus-visible:ring-warning/40",
    accent: "text-warning",
  },
  blue: {
    container: "bg-stable/[0.03] hover:bg-stable/[0.06] border-stable/20",
    bedBg: "bg-stable/[0.07] border-stable/25",
    bedText: "text-stable",
    ring: "focus-visible:ring-stable/40",
    accent: "text-stable",
  },
  outside: {
    container: "bg-muted/30 hover:bg-muted/50 border-border",
    bedBg: "bg-muted/60 border-border",
    bedText: "text-muted-foreground",
    ring: "focus-visible:ring-muted",
    accent: "text-muted-foreground",
  },
};

/**
 * Compact "pre-allocation" slot for fixed emergency observation beds (V/A/Z).
 * Single-row, ~36px tall — silent visually, clear functionally.
 */
export function EmptyBedSlot({
  bedNumber,
  sector,
  onAllocateNew,
  onAllocateFromQueue,
  isMaintenance = false,
  maintenanceReason,
  onBlockMaintenance,
  onReleaseMaintenance,
}: EmptyBedSlotProps) {
  const tokens = sectorTokens[sector];

  return (
    <div
      className={cn(
        "group flex items-center justify-between gap-2 px-2 py-1.5 rounded-md border border-dashed transition-colors",
        isMaintenance ? "bg-muted/60 border-muted-foreground/40" : tokens.container,
      )}
    >
      <div className="flex items-center gap-2 min-w-0">
        <div
          className={cn(
            "shrink-0 px-1.5 py-0.5 rounded border",
            tokens.bedBg,
          )}
        >
          <span className={cn("text-xs font-bold tabular-nums", tokens.bedText)}>
            {bedNumber}
          </span>
        </div>
        {isMaintenance ? (
          <Wrench className="h-4 w-4 shrink-0 text-muted-foreground" />
        ) : (
          <DoorOpen className={cn("h-4 w-4 shrink-0 opacity-70", tokens.accent)} />
        )}
        <span className="text-xs font-medium italic text-muted-foreground truncate" title={maintenanceReason || undefined}>
          {isMaintenance ? `Interditado${maintenanceReason ? ` · ${maintenanceReason}` : ""}` : "Leito disponível"}
        </span>
      </div>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className={cn(
              "h-7 px-2 text-xs gap-1.5 opacity-80 hover:opacity-100",
              tokens.accent,
              tokens.ring,
            )}
          >
            {isMaintenance ? <Wrench className="h-4 w-4" /> : <UserPlus className="h-4 w-4" />}
            {isMaintenance ? "Manutenção" : "Alocar"}
            <ChevronDown className="h-4 w-4 opacity-60" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-52 bg-popover z-50">
          {!isMaintenance && <DropdownMenuItem onClick={onAllocateNew} className="gap-2">
            <UserPlus className="h-4 w-4" />
            <div className="flex flex-col">
              <span className="text-sm">Novo paciente</span>
              <span className="text-xs text-muted-foreground">
                Liberar leito para preenchimento
              </span>
            </div>
          </DropdownMenuItem>}
          {!isMaintenance && onAllocateFromQueue && (
            <DropdownMenuItem onClick={onAllocateFromQueue} className="gap-2">
              <Users className="h-4 w-4" />
              <div className="flex flex-col">
                <span className="text-sm">Da fila de espera</span>
                <span className="text-xs text-muted-foreground">
                  Solicitar regulação para este leito
                </span>
              </div>
            </DropdownMenuItem>
          )}
          {isMaintenance ? (
            <DropdownMenuItem onClick={onReleaseMaintenance} className="gap-2">
              <CheckCircle2 className="h-4 w-4" />
              Liberar manutenção
            </DropdownMenuItem>
          ) : (
            <DropdownMenuItem onClick={onBlockMaintenance} className="gap-2">
              <Wrench className="h-4 w-4" />
              Interditar manutenção
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
