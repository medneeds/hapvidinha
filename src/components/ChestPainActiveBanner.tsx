import { useState, useEffect, useRef } from "react";
import { HeartPulse, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { SectorType } from "@/types/patient";

interface ChestPainActiveBannerProps {
  protocolCreatedAt: string;
  openingTime?: string | null;
  openingDate?: string | null;
  outcome?: string | null;
  sector?: SectorType;
  hasEcg?: boolean;
  ecgTime?: string | null;
  isStemi?: boolean | null;
  heartScore?: number | null;
  heartRiskLevel?: string | null;
  hasBalloon?: boolean;
  balloonTime?: string | null;
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
 * Dor torácica: ECG ≤ 10min (door-to-ECG). STEMI: porta-balão ≤ 90min.
 */
export function ChestPainActiveBanner({
  protocolCreatedAt, openingTime, openingDate, outcome,
  sector = 'red', hasEcg = false, ecgTime, isStemi, heartScore, heartRiskLevel,
  hasBalloon = false, balloonTime, onClick,
}: ChestPainActiveBannerProps) {
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const startTimeRef = useRef<number>(getStartTime(protocolCreatedAt, openingDate, openingTime));

  useEffect(() => {
    const newStart = getStartTime(protocolCreatedAt, openingDate, openingTime);
    if (newStart !== startTimeRef.current) startTimeRef.current = newStart;
  }, [protocolCreatedAt, openingDate, openingTime]);

  // Goal: door-to-ECG = 10min (600s); STEMI door-to-balloon = 90min (5400s)
  const TARGET = isStemi ? 5400 : 600;

  const frozenElapsed = (() => {
    if (isStemi && hasBalloon && balloonTime) {
      const dateRef = openingDate || new Date().toISOString().split('T')[0];
      const dt = new Date(`${dateRef}T${balloonTime}`);
      if (!isNaN(dt.getTime())) return Math.max(0, Math.floor((dt.getTime() - startTimeRef.current) / 1000));
    }
    if (!isStemi && hasEcg && ecgTime) {
      const dateRef = openingDate || new Date().toISOString().split('T')[0];
      const dt = new Date(`${dateRef}T${ecgTime}`);
      if (!isNaN(dt.getTime())) return Math.max(0, Math.floor((dt.getTime() - startTimeRef.current) / 1000));
    }
    return null;
  })();

  const treatmentComplete = isStemi ? hasBalloon : hasEcg;
  const shouldFreeze = treatmentComplete && frozenElapsed !== null;

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

  const progressPercent = Math.min(100, (elapsedSeconds / TARGET) * 100);
  const isExpired = elapsedSeconds >= TARGET;
  const isFinalized = !!outcome;
  const shimmerActive = !isFinalized && !treatmentComplete && !isExpired;

  const sectorColorClass = sector === 'yellow' ? 'sector-yellow' : sector === 'blue' ? 'sector-blue' : 'sector-red';

  const statusLabel = isFinalized
    ? "PROTOCOLO DOR TORÁCICA FINALIZADO"
    : treatmentComplete && !isExpired
    ? (isStemi ? "PORTA-BALÃO CUMPRIDA" : "PORTA-ECG CUMPRIDA")
    : isExpired
    ? (isStemi ? "PORTA-BALÃO EXCEDIDA" : "PORTA-ECG EXCEDIDA")
    : "PROTOCOLO DOR TORÁCICA ATIVO";

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
      <HeartPulse className={cn("h-3 w-3 flex-shrink-0 relative z-10", `sepsis-icon ${statusColorClass}`)} />

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
                  isExpired ? "bg-red-500" : treatmentComplete ? "bg-green-500" : "bg-rose-400/80"
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
            {isStemi !== null && isStemi !== undefined && (
              <>
                <span className={cn("text-[8px] font-semibold uppercase tracking-wide", isStemi ? "sepsis-expired" : statusColorClass)}>
                  {isStemi ? "STEMI" : "SEM SUPRA"}
                </span>
                <span className="separator relative z-10 text-[8px]">•</span>
              </>
            )}
            {heartScore !== null && heartScore !== undefined && (
              <>
                <span className={cn("text-[8px] font-semibold uppercase tracking-wide", statusColorClass)}>
                  HEART: {heartScore}/10 {heartRiskLevel ? `(${heartRiskLevel})` : ''}
                </span>
                <span className="separator relative z-10 text-[8px]">•</span>
              </>
            )}
            <span className={cn("text-[8px] font-semibold uppercase tracking-wide", hasEcg ? "sepsis-finalized" : statusColorClass)}>
              ECG: {hasEcg && ecgTime ? String(ecgTime).slice(0, 5) : "…"}
            </span>
            {isStemi && (
              <>
                <span className="separator relative z-10 text-[8px]">•</span>
                <span className={cn("text-[8px] font-semibold uppercase tracking-wide", hasBalloon ? "sepsis-finalized" : statusColorClass)}>
                  BALÃO: {hasBalloon && balloonTime ? String(balloonTime).slice(0, 5) : "…"}
                </span>
              </>
            )}
          </div>
        </>
      )}

      {isFinalized && <CheckCircle2 className="h-3 w-3 flex-shrink-0 relative z-10 sepsis-finalized" />}
    </div>
  );
}
