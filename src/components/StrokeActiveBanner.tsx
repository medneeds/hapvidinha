import { useState, useEffect, useRef } from "react";
import { Brain, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { SectorType } from "@/types/patient";

interface StrokeActiveBannerProps {
  protocolCreatedAt: string;
  openingTime?: string | null;
  openingDate?: string | null;
  outcome?: string | null;
  sector?: SectorType;
  hasCt?: boolean;
  hasThrombolysis?: boolean;
  ctTime?: string | null;
  thrombolysisTime?: string | null;
  nihssTotal?: number | null;
  onClick?: () => void;
}

function getStartTime(createdAt: string, openingDate?: string | null, openingTime?: string | null): number {
  if (openingDate && openingTime) {
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

/**
 * AVC: Janela trombólise = 4,5h (16200s). Door-to-needle alvo = 60min (3600s).
 * Bar shows door-to-needle progress.
 */
export function StrokeActiveBanner({
  protocolCreatedAt, openingTime, openingDate, outcome,
  sector = 'red', hasCt = false, hasThrombolysis = false,
  ctTime, thrombolysisTime, nihssTotal, onClick,
}: StrokeActiveBannerProps) {
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const startTimeRef = useRef<number>(getStartTime(protocolCreatedAt, openingDate, openingTime));

  useEffect(() => {
    const newStart = getStartTime(protocolCreatedAt, openingDate, openingTime);
    if (newStart !== startTimeRef.current) startTimeRef.current = newStart;
  }, [protocolCreatedAt, openingDate, openingTime]);

  const frozenElapsed = (() => {
    if (hasThrombolysis && thrombolysisTime) {
      // Use today's date if no opening date
      const dateRef = openingDate || new Date().toISOString().split('T')[0];
      const dt = new Date(`${dateRef}T${thrombolysisTime}`);
      if (!isNaN(dt.getTime())) {
        return Math.max(0, Math.floor((dt.getTime() - startTimeRef.current) / 1000));
      }
    }
    return null;
  })();

  const shouldFreeze = hasThrombolysis && frozenElapsed !== null;

  useEffect(() => {
    if (outcome || shouldFreeze) {
      if (shouldFreeze) setElapsedSeconds(frozenElapsed!);
      return;
    }
    const tick = () => setElapsedSeconds(Math.max(0, Math.floor((Date.now() - startTimeRef.current) / 1000)));
    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [outcome, shouldFreeze, frozenElapsed]);

  const DOOR_TO_NEEDLE = 3600; // 60 min
  const progressPercent = Math.min(100, (elapsedSeconds / DOOR_TO_NEEDLE) * 100);
  const isExpired = elapsedSeconds >= DOOR_TO_NEEDLE;
  const isFinalized = !!outcome;
  const shimmerActive = !isFinalized && !hasThrombolysis && !isExpired;

  const sectorColorClass = sector === 'yellow' ? 'sector-yellow' : sector === 'blue' ? 'sector-blue' : 'sector-red';

  const statusLabel = isFinalized
    ? "PROTOCOLO AVC FINALIZADO"
    : hasThrombolysis && !isExpired
    ? "PORTA-AGULHA CUMPRIDA"
    : isExpired
    ? "PORTA-AGULHA EXCEDIDA"
    : "PROTOCOLO AVC ATIVO";

  const statusColorClass = isFinalized ? "sepsis-finalized" : isExpired ? "sepsis-expired" : "sepsis-active";

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
      <Brain className={cn("h-3 w-3 flex-shrink-0 relative z-10", `sepsis-icon ${statusColorClass}`)} />

      <span className={cn("text-[9px] font-semibold uppercase flex-shrink-0 relative z-10 tracking-wide", statusColorClass)}>
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
                  isExpired ? "bg-red-500" : hasThrombolysis ? "bg-green-500" : "bg-purple-400/80"
                )}
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>
          <span className={cn("text-[9px] font-mono font-semibold tabular-nums flex-shrink-0 relative z-10", statusColorClass)}>
            {formatElapsed(elapsedSeconds)}
          </span>
          <span className="separator relative z-10 text-[8px]">•</span>
          <div className="flex items-center gap-1.5 relative z-10">
            {nihssTotal !== null && nihssTotal !== undefined && (
              <>
                <span className={cn("text-[8px] font-semibold uppercase tracking-wide", statusColorClass)}>
                  NIHSS: {nihssTotal}
                </span>
                <span className="separator relative z-10 text-[8px]">•</span>
              </>
            )}
            <span className={cn("text-[8px] font-semibold uppercase tracking-wide", hasCt ? "sepsis-finalized" : statusColorClass)}>
              TC: {hasCt && ctTime ? String(ctTime).slice(0, 5) : "…"}
            </span>
            <span className="separator relative z-10 text-[8px]">•</span>
            <span className={cn("text-[8px] font-semibold uppercase tracking-wide", hasThrombolysis ? "sepsis-finalized" : statusColorClass)}>
              TROMBÓLISE: {hasThrombolysis && thrombolysisTime ? String(thrombolysisTime).slice(0, 5) : "…"}
            </span>
          </div>
        </>
      )}

      {isFinalized && <CheckCircle2 className="h-3 w-3 flex-shrink-0 relative z-10 sepsis-finalized" />}
    </div>
  );
}
