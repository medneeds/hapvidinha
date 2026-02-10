import { useState, useEffect, useMemo } from "react";
import { parseISO, isValid, parse, differenceInMinutes } from "date-fns";

export interface StayTimerData {
  /** Formatted display string, e.g. "4h32min", "1d 6h", "32min" */
  display: string;
  /** Total minutes of stay */
  totalMinutes: number;
  /** Alert level based on thresholds */
  level: "normal" | "warning" | "orange" | "critical" | "pulsing";
  /** CSS classes for the timer badge */
  colorClasses: string;
}

const THRESHOLDS = {
  warning: 6 * 60,    // 6h → yellow
  orange: 12 * 60,    // 12h → orange
  critical: 18 * 60,  // 18h → red
  pulsing: 24 * 60,   // 24h → red pulsing
};

function parseAdmissionDate(dateString: string): Date | null {
  if (!dateString) return null;

  // Try ISO format
  let d = parseISO(dateString);
  if (isValid(d)) return d;

  // Try DD/MM/YYYY HH:mm
  d = parse(dateString, "dd/MM/yyyy HH:mm", new Date());
  if (isValid(d)) return d;

  // Try DD/MM/YYYY
  d = parse(dateString, "dd/MM/yyyy", new Date());
  if (isValid(d)) return d;

  // Try native Date constructor as fallback
  d = new Date(dateString);
  if (isValid(d)) return d;

  return null;
}

function formatDuration(totalMinutes: number): string {
  if (totalMinutes < 0) return "0min";

  const days = Math.floor(totalMinutes / (24 * 60));
  const hours = Math.floor((totalMinutes % (24 * 60)) / 60);
  const minutes = totalMinutes % 60;

  if (days > 0) {
    return `${days}d ${hours}h`;
  }
  if (hours > 0) {
    return `${hours}h${minutes > 0 ? `${minutes}min` : ""}`;
  }
  return `${minutes}min`;
}

function getLevel(totalMinutes: number): StayTimerData["level"] {
  if (totalMinutes >= THRESHOLDS.pulsing) return "pulsing";
  if (totalMinutes >= THRESHOLDS.critical) return "critical";
  if (totalMinutes >= THRESHOLDS.orange) return "orange";
  if (totalMinutes >= THRESHOLDS.warning) return "warning";
  return "normal";
}

function getColorClasses(level: StayTimerData["level"]): string {
  switch (level) {
    case "normal":
      return "text-muted-foreground bg-muted/50";
    case "warning":
      return "text-yellow-700 dark:text-yellow-400 bg-yellow-100/80 dark:bg-yellow-900/30 border-yellow-300 dark:border-yellow-700";
    case "orange":
      return "text-orange-700 dark:text-orange-400 bg-orange-100/80 dark:bg-orange-900/30 border-orange-300 dark:border-orange-700";
    case "critical":
      return "text-red-700 dark:text-red-400 bg-red-100/80 dark:bg-red-900/30 border-red-300 dark:border-red-700";
    case "pulsing":
      return "text-red-700 dark:text-red-400 bg-red-100/80 dark:bg-red-900/30 border-red-300 dark:border-red-700 animate-pulse";
  }
}

/**
 * Hook that provides a live-updating sector stay timer based on admission date.
 * Updates every minute.
 */
export function useSectorStayTimer(admissionDate: string | undefined | null): StayTimerData | null {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 60_000); // update every minute
    return () => clearInterval(interval);
  }, []);

  return useMemo(() => {
    if (!admissionDate) return null;

    const parsed = parseAdmissionDate(admissionDate);
    if (!parsed) return null;

    const totalMinutes = differenceInMinutes(now, parsed);
    if (totalMinutes < 0) return null;

    const level = getLevel(totalMinutes);

    return {
      display: formatDuration(totalMinutes),
      totalMinutes,
      level,
      colorClasses: getColorClasses(level),
    };
  }, [admissionDate, now]);
}
