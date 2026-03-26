import { useState, useEffect, useRef } from "react";
import { ShieldAlert, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { SectorType } from "@/types/patient";

interface SepsisActiveBannerProps {
  protocolCreatedAt: string;
  openingTime?: string | null;
  openingDate?: string | null;
  outcome?: string | null;
  sector?: SectorType;
  hasCultures?: boolean;
  hasAntibiotic?: boolean;
  onClick?: () => void;
}

function getProtocolStartTime(createdAt: string, openingDate?: string | null, openingTime?: string | null): number {
  if (openingDate && openingTime) {
    // Parse as local time
    const dt = new Date(`${openingDate}T${openingTime}`);
    if (!isNaN(dt.getTime())) return dt.getTime();
  }
  return new Date(createdAt).getTime();
}

function formatElapsed(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

export function SepsisActiveBanner({ protocolCreatedAt, openingTime, openingDate, outcome, sector = 'red', hasCultures = false, hasAntibiotic = false, onClick }: SepsisActiveBannerProps) {
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const startTimeRef = useRef<number>(
    getProtocolStartTime(protocolCreatedAt, openingDate, openingTime)
  );
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Only update startTimeRef if the actual values change
  useEffect(() => {
    const newStartTime = getProtocolStartTime(protocolCreatedAt, openingDate, openingTime);
    if (newStartTime !== startTimeRef.current) {
      startTimeRef.current = newStartTime;
    }
  }, [protocolCreatedAt, openingDate, openingTime]);

  useEffect(() => {
    if (outcome) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    const tick = () => {
      const now = Date.now();
      const diff = Math.max(0, Math.floor((now - startTimeRef.current) / 1000));
      setElapsedSeconds(diff);
    };

    tick();
    intervalRef.current = setInterval(tick, 1000);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [outcome]);

  const ONE_HOUR = 3600;
  const progressPercent = Math.min(100, (elapsedSeconds / ONE_HOUR) * 100);
  const isExpired = elapsedSeconds >= ONE_HOUR;
  const isFinalized = !!outcome;
  const treatmentComplete = hasCultures && hasAntibiotic;
  const shimmerActive = !isFinalized && !treatmentComplete;

  const sectorColorClass = sector === 'yellow' ? 'sector-yellow' : sector === 'blue' ? 'sector-blue' : 'sector-red';

  const statusLabel = isFinalized
    ? "PROTOCOLO SEPSE FINALIZADO"
    : treatmentComplete && !isExpired
    ? "GOLDEN HOUR CUMPRIDA"
    : isExpired
    ? "GOLDEN HOUR EXCEDIDA"
    : "PROTOCOLO SEPSE ATIVO";

  const statusColorClass = isFinalized
    ? "sepsis-finalized"
    : treatmentComplete && !isExpired
    ? "sepsis-finalized"
    : isExpired
    ? "sepsis-expired"
    : "sepsis-active";

  return (
    <div
      onClick={onClick}
      className={cn(
        "sepsis-status-bar py-1.5 px-4 flex items-center gap-2 cursor-pointer transition-all print:hidden rounded-t-lg",
        sectorColorClass,
        shimmerActive && "sepsis-shimmer-active",
        isExpired && !isFinalized && "animate-pulse"
      )}
    >
      <ShieldAlert className={cn("h-3 w-3 flex-shrink-0 relative z-10", `sepsis-icon ${statusColorClass}`)} />
      
      <span className={cn(
        "text-[9px] font-semibold uppercase flex-shrink-0 relative z-10 tracking-wide",
        statusColorClass
      )}>
        {statusLabel}
      </span>

      {!isFinalized && (
        <>
          <span className="separator relative z-10 text-[8px]">•</span>
          
          <div className="flex-1 max-w-[100px] relative z-10">
            <div className="h-1 w-full rounded-full bg-black/10 dark:bg-white/10 overflow-hidden">
              <div
                className={cn(
                  "h-full rounded-full transition-all duration-1000",
                  isExpired ? "bg-red-500" : "bg-orange-500"
                )}
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>
          
          <span className={cn(
            "text-[9px] font-mono font-semibold tabular-nums flex-shrink-0 relative z-10",
            statusColorClass
          )}>
            {formatElapsed(elapsedSeconds)}
          </span>

          <span className="separator relative z-10 text-[8px]">•</span>
          <div className="flex items-center gap-1.5 relative z-10">
            <span className={cn(
              "text-[8px] font-semibold uppercase tracking-wide",
              hasCultures ? "sepsis-finalized" : statusColorClass
            )}>
              HC{hasCultures ? "✓" : "…"}
            </span>
            <span className={cn(
              "text-[8px] font-semibold uppercase tracking-wide",
              hasAntibiotic ? "sepsis-finalized" : statusColorClass
            )}>
              ATB{hasAntibiotic ? "✓" : "…"}
            </span>
          </div>
        </>
      )}

      {isFinalized && (
        <CheckCircle2 className="h-3 w-3 flex-shrink-0 relative z-10 sepsis-finalized" />
      )}
    </div>
  );
}
