import { useState, useEffect, useMemo } from "react";
import { Activity } from "lucide-react";
import { cn } from "@/lib/utils";
import { Progress } from "@/components/ui/progress";

interface SepsisActiveBannerProps {
  protocolCreatedAt: string;
  openingTime?: string | null;
  openingDate?: string | null;
  outcome?: string | null;
  onClick?: () => void;
}

function getProtocolStartTime(createdAt: string, openingDate?: string | null, openingTime?: string | null): Date {
  if (openingDate && openingTime) {
    const dt = new Date(`${openingDate}T${openingTime}`);
    if (!isNaN(dt.getTime())) return dt;
  }
  return new Date(createdAt);
}

function formatElapsed(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

export function SepsisActiveBanner({ protocolCreatedAt, openingTime, openingDate, outcome, onClick }: SepsisActiveBannerProps) {
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  const startTime = useMemo(
    () => getProtocolStartTime(protocolCreatedAt, openingDate, openingTime),
    [protocolCreatedAt, openingDate, openingTime]
  );

  useEffect(() => {
    if (outcome) return; // Stop ticking if finalized

    const tick = () => {
      const now = new Date();
      setElapsedSeconds(Math.max(0, Math.floor((now.getTime() - startTime.getTime()) / 1000)));
    };
    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [startTime, outcome]);

  const ONE_HOUR = 3600;
  const progressPercent = Math.min(100, (elapsedSeconds / ONE_HOUR) * 100);
  const isExpired = elapsedSeconds >= ONE_HOUR;
  const isFinalized = !!outcome;

  const statusLabel = isFinalized
    ? "PROTOCOLO SEPSE FINALIZADO"
    : isExpired
    ? "GOLDEN HOUR EXCEDIDA"
    : "PROTOCOLO SEPSE ATIVO";

  return (
    <div
      onClick={onClick}
      className={cn(
        "py-1.5 px-3 flex items-center gap-2 cursor-pointer transition-all print:hidden rounded-t-lg",
        isFinalized
          ? "bg-green-600/20 border-b border-green-500/30"
          : isExpired
          ? "bg-red-600/20 border-b border-red-500/30 animate-pulse"
          : "bg-orange-500/20 border-b border-orange-400/30"
      )}
    >
      <Activity className={cn(
        "h-3.5 w-3.5 flex-shrink-0",
        isFinalized ? "text-green-500" : isExpired ? "text-red-500" : "text-orange-500"
      )} />
      
      <span className={cn(
        "text-[10px] font-bold uppercase flex-shrink-0",
        isFinalized ? "text-green-600 dark:text-green-400" : isExpired ? "text-red-600 dark:text-red-400" : "text-orange-600 dark:text-orange-400"
      )}>
        {statusLabel}
      </span>

      {!isFinalized && (
        <>
          <div className="flex-1 max-w-[120px]">
            <Progress 
              value={progressPercent} 
              className={cn(
                "h-1.5",
                isExpired ? "[&>div]:bg-red-500" : "[&>div]:bg-orange-500"
              )}
            />
          </div>
          <span className={cn(
            "text-[10px] font-mono font-bold tabular-nums flex-shrink-0",
            isExpired ? "text-red-600 dark:text-red-400" : "text-orange-600 dark:text-orange-400"
          )}>
            {formatElapsed(elapsedSeconds)}
          </span>
        </>
      )}
    </div>
  );
}
