import { useEffect, useState, useCallback } from "react";
import { TRAINING_TOURS, Tour } from "@/data/trainingTours";

const STORAGE_KEY = "hapmap_training_state_v1";
const SCHEDULE_HOURS = [9, 13, 16]; // 3x/dia
const CAMPAIGN_DAYS = 7;
const MIN_GAP_MS = 2 * 60 * 60 * 1000; // 2h mínimo entre popups

interface TrainingState {
  startedAt: number; // timestamp do primeiro acesso
  completed: string[];
  dismissed: string[];
  shownAt: Record<string, number>; // tourId -> last shown
  lastPopupAt: number; // qualquer popup
  shownTodayKey: string; // YYYY-MM-DD-slot count
  shownToday: number;
  todayDate: string;
}

function loadState(): TrainingState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  const now = Date.now();
  return {
    startedAt: now,
    completed: [],
    dismissed: [],
    shownAt: {},
    lastPopupAt: 0,
    shownTodayKey: "",
    shownToday: 0,
    todayDate: new Date().toISOString().slice(0, 10),
  };
}

function saveState(s: TrainingState) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(s));
}

function pickNextTour(state: TrainingState): Tour | null {
  // Priority: not completed first, fewer shows first, latest features (top of list) first
  const candidates = TRAINING_TOURS.filter((t) => !state.completed.includes(t.id));
  if (candidates.length === 0) return null;
  candidates.sort((a, b) => {
    const sa = state.shownAt[a.id] || 0;
    const sb = state.shownAt[b.id] || 0;
    if (sa !== sb) return sa - sb;
    return TRAINING_TOURS.indexOf(a) - TRAINING_TOURS.indexOf(b);
  });
  return candidates[0];
}

export function useTrainingScheduler() {
  const [state, setState] = useState<TrainingState>(loadState);
  const [activeTour, setActiveTour] = useState<Tour | null>(null);
  const [open, setOpen] = useState(false);

  const updateState = useCallback((updater: (s: TrainingState) => TrainingState) => {
    setState((prev) => {
      const next = updater(prev);
      saveState(next);
      return next;
    });
  }, []);

  const tryShow = useCallback(() => {
    const now = new Date();
    const today = now.toISOString().slice(0, 10);
    const hour = now.getHours();
    const minute = now.getMinutes();
    const ts = now.getTime();

    setState((prev) => {
      let s = { ...prev };

      // Reset day counter
      if (s.todayDate !== today) {
        s.todayDate = today;
        s.shownToday = 0;
      }

      // Campaign window check
      const daysSinceStart = (ts - s.startedAt) / (24 * 3600 * 1000);
      if (daysSinceStart > CAMPAIGN_DAYS) {
        saveState(s);
        return s;
      }

      // Already 3 today?
      if (s.shownToday >= SCHEDULE_HOURS.length) {
        saveState(s);
        return s;
      }

      // Min gap
      if (ts - s.lastPopupAt < MIN_GAP_MS) {
        saveState(s);
        return s;
      }

      // Check if current time is at/past a scheduled hour we haven't filled
      // shownToday=0 → trigger after hour 9, shownToday=1 → after 13, shownToday=2 → after 16
      const targetHour = SCHEDULE_HOURS[s.shownToday];
      if (hour < targetHour) {
        saveState(s);
        return s;
      }

      const tour = pickNextTour(s);
      if (!tour) {
        saveState(s);
        return s;
      }

      s.lastPopupAt = ts;
      s.shownToday += 1;
      s.shownAt = { ...s.shownAt, [tour.id]: ts };
      saveState(s);
      setActiveTour(tour);
      setOpen(true);
      return s;
    });
  }, []);

  useEffect(() => {
    // initial trigger after small delay
    const t1 = setTimeout(tryShow, 8000);
    const interval = setInterval(tryShow, 5 * 60 * 1000); // check every 5 min
    return () => {
      clearTimeout(t1);
      clearInterval(interval);
    };
  }, [tryShow]);

  const handleCompleted = useCallback(
    (tourId: string) => {
      updateState((s) => ({ ...s, completed: [...new Set([...s.completed, tourId])] }));
    },
    [updateState]
  );

  const handleDismissed = useCallback(
    (tourId: string) => {
      updateState((s) => ({ ...s, dismissed: [...s.dismissed, tourId] }));
    },
    [updateState]
  );

  return {
    activeTour,
    open,
    setOpen,
    handleCompleted,
    handleDismissed,
  };
}
