import { useMemo } from "react";
import { differenceInDays, differenceInHours, differenceInMinutes } from "date-fns";
import { Clock, MessageSquare, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Patient } from "@/types/patient";
import { useBedAllocationRequests } from "@/hooks/useBedAllocationRequests";

const SECTOR_CLASS: Record<string, string> = {
  red: "sector-red",
  yellow: "sector-yellow",
  blue: "sector-blue",
  "Sala de Cuidados Especiais": "sector-red",
  "Observação Amarela": "sector-yellow",
  "Observação Azul": "sector-blue",
};

const SECTOR_NAME: Record<string, string> = {
  red: "SALA DE CUIDADOS ESPECIAIS",
  yellow: "OBSERVAÇÃO AMARELA",
  blue: "OBSERVAÇÃO AZUL",
  "Sala de Cuidados Especiais": "SALA DE CUIDADOS ESPECIAIS",
  "Observação Amarela": "OBSERVAÇÃO AMARELA",
  "Observação Azul": "OBSERVAÇÃO AZUL",
};

const STATUS = {
  pending: { label: "AGUARDANDO", statusClass: "status-pending", iconClass: "icon-pending", Icon: Clock },
  discussing: { label: "EM DISCUSSÃO", statusClass: "status-discussing", iconClass: "icon-discussing", Icon: MessageSquare },
  rejected: { label: "NEGADO", statusClass: "status-rejected", iconClass: "icon-rejected", Icon: XCircle },
} as const;

/**
 * Bar above a door patient's card while a bed request is open (status • destination • time).
 * Clicking it opens the allocation dialog of the AllocationPendingBadge inside the card.
 */
export function AllocationStatusBar({ patient }: { patient: Patient }) {
  const { requests } = useBedAllocationRequests();

  const config = useMemo(() => {
    if (!patient.allocationStatus || patient.allocationStatus === "approved" || !patient.isDoorPatient) return null;
    const status = STATUS[patient.allocationStatus as keyof typeof STATUS];
    if (!status) return null;
    const request = requests.find((r) => r.patient_id === patient.id);
    const requested = request?.requested_sector || "";
    let elapsed: string | null = null;
    if (request?.created_at) {
      const created = new Date(request.created_at);
      const now = new Date();
      const minutes = differenceInMinutes(now, created);
      const hours = differenceInHours(now, created);
      const days = differenceInDays(now, created);
      elapsed = days > 0 ? `${days}d ${hours % 24}h` : hours > 0 ? `${hours}h ${minutes % 60}min` : `${minutes}min`;
    }
    return {
      ...status,
      sectorClass: SECTOR_CLASS[requested] || "sector-blue",
      sectorName: SECTOR_NAME[requested] || requested.toUpperCase(),
      elapsed,
    };
  }, [patient.allocationStatus, patient.isDoorPatient, patient.id, requests]);

  if (!config) return null;
  const { Icon } = config;

  return (
    <div
      className={cn("allocation-status-bar py-1 px-3 flex items-center justify-center gap-2 cursor-pointer transition-all print:hidden rounded-t-lg", config.sectorClass)}
      onClick={() => {
        const badge = document.querySelector(`[data-patient-id="${patient.id}"] .allocation-badge-trigger`);
        if (badge) (badge as HTMLElement).click();
      }}
    >
      <Icon className={cn("h-3.5 w-3.5 relative z-10", config.iconClass)} />
      <span className={cn("text-xs font-semibold relative z-10 uppercase", config.statusClass)}>{config.label}</span>
      <span className="separator relative z-10">•</span>
      <span className="text-xs font-semibold relative z-10 status-destination uppercase">PARA: {config.sectorName}</span>
      {config.elapsed && (
        <>
          <span className="separator relative z-10">•</span>
          <span className="text-xs font-semibold relative z-10 status-time uppercase">HÁ {config.elapsed.toUpperCase()}</span>
        </>
      )}
    </div>
  );
}

export function hasAllocationStatusBar(patient: Patient) {
  return !!patient.allocationStatus && patient.allocationStatus !== "approved" && !!patient.isDoorPatient
    && ["pending", "discussing", "rejected"].includes(patient.allocationStatus);
}
