import { useEffect, useState, useCallback } from "react";
import { TRAINING_TOURS, Tour } from "@/data/trainingTours";

const STORAGE_KEY = "hapmap_training_state_v1";
const SETTINGS_KEY = "hapmap_training_settings_v1";
const CAMPAIGN_DAYS = 7;
const MIN_GAP_MS = 2 * 60 * 60 * 1000; // 2h mínimo entre popups
const DEFAULT_HOURS = [9, 13, 16];

export interface TrainingSettings {
  enabled: boolean;
  frequencyPerDay: number; // 1, 2 or 3
  hours: number[]; // length === frequencyPerDay
}

interface TrainingState {
  startedAt: number;
  completed: string[];
  dismissed: string[];
  shownAt: Record<string, number>;
  lastPopupAt: number;
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
    shownToday: 0,
    todayDate: new Date().toISOString().slice(0, 10),
  };
}

function loadSettings(): TrainingSettings {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return { enabled: true, frequencyPerDay: 3, hours: DEFAULT_HOURS };
}

function saveState(s: TrainingState) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(s));
}

function saveSettings(s: TrainingSettings) {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(s));
  window.dispatchEvent(new CustomEvent("hapmap:training-settings-changed"));
}

function pickNextTour(state: TrainingState): Tour | null {
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
  const [settings, setSettingsState] = useState<TrainingSettings>(loadSettings);
  const [activeTour, setActiveTour] = useState<Tour | null>(null);
  const [open, setOpen] = useState(false);

  const updateState = useCallback((updater: (s: TrainingState) => TrainingState) => {
    setState((prev) => {
      const next = updater(prev);
      saveState(next);
      return next;
    });
  }, []);

  const updateSettings = useCallback((next: TrainingSettings) => {
    const sanitized: TrainingSettings = {
      enabled: next.enabled,
      frequencyPerDay: Math.max(1, Math.min(3, next.frequencyPerDay)),
      hours: [...next.hours].slice(0, next.frequencyPerDay).sort((a, b) => a - b),
    };
    setSettingsState(sanitized);
    saveSettings(sanitized);
  }, []);

  const openTour = useCallback((tour: Tour) => {
    setActiveTour(tour);
    setOpen(true);
  }, []);

  const startTourById = useCallback((tourId: string) => {
    const t = TRAINING_TOURS.find((x) => x.id === tourId);
    if (t) openTour(t);
  }, [openTour]);

  const resumeNextTour = useCallback(() => {
    const t = pickNextTour(state) || TRAINING_TOURS[0];
    openTour(t);
  }, [state, openTour]);

  const tryShow = useCallback(() => {
    if (!settings.enabled) return;
    const now = new Date();
    const today = now.toISOString().slice(0, 10);
    const hour = now.getHours();
    const ts = now.getTime();

    setState((prev) => {
      let s = { ...prev };
      if (s.todayDate !== today) {
        s.todayDate = today;
        s.shownToday = 0;
      }
      const daysSinceStart = (ts - s.startedAt) / (24 * 3600 * 1000);
      if (daysSinceStart > CAMPAIGN_DAYS) {
        saveState(s);
        return s;
      }
      const hours = settings.hours.slice(0, settings.frequencyPerDay).sort((a, b) => a - b);
      if (s.shownToday >= hours.length) {
        saveState(s);
        return s;
      }
      if (ts - s.lastPopupAt < MIN_GAP_MS) {
        saveState(s);
        return s;
      }
      const targetHour = hours[s.shownToday];
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
  }, [settings]);

  useEffect(() => {
    const t1 = setTimeout(tryShow, 8000);
    const interval = setInterval(tryShow, 5 * 60 * 1000);
    return () => {
      clearTimeout(t1);
      clearInterval(interval);
    };
  }, [tryShow]);

  // Listen to global events for manual open
  useEffect(() => {
    const onOpenTour = (e: Event) => {
      const id = (e as CustomEvent<string>).detail;
      if (id) startTourById(id);
      else resumeNextTour();
    };
    const onSettingsChanged = () => setSettingsState(loadSettings());
    window.addEventListener("hapmap:open-tour", onOpenTour as EventListener);
    window.addEventListener("hapmap:training-settings-changed", onSettingsChanged);
    return () => {
      window.removeEventListener("hapmap:open-tour", onOpenTour as EventListener);
      window.removeEventListener("hapmap:training-settings-changed", onSettingsChanged);
    };
  }, [startTourById, resumeNextTour]);

  const handleCompleted = useCallback(
    (tourId: string) => {
      updateState((s) => ({ ...s, completed: [...new Set([...s.completed, tourId])] }));
    },
    [updateState]
  );

  const handleDismissed = useCallback(
    (tourId: string) => {
      updateState((s) => ({ ...s, dismissed: [...new Set([...s.dismissed, tourId])] }));
    },
    [updateState]
  );

  const resetProgress = useCallback(() => {
    const fresh: TrainingState = {
      startedAt: Date.now(),
      completed: [],
      dismissed: [],
      shownAt: {},
      lastPopupAt: 0,
      shownToday: 0,
      todayDate: new Date().toISOString().slice(0, 10),
    };
    setState(fresh);
    saveState(fresh);
  }, []);

  return {
    activeTour,
    open,
    setOpen,
    handleCompleted,
    handleDismissed,
    settings,
    updateSettings,
    state,
    startTourById,
    resumeNextTour,
    resetProgress,
  };
}
