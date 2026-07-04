import { createContext, useContext, useEffect, useRef, useState, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useHospital } from "@/contexts/HospitalContext";
import { useDepartment, Department } from "@/contexts/DepartmentContext";

interface PrefetchEntry {
  hospitalId: string;
  stateId: string;
  department: Department;
  data: any[];
  fetchedAt: number;
}

interface PatientsPrefetchContextType {
  isReady: boolean;
  getPrefetched: (hospitalId: string, stateId: string, department?: Department) => any[] | null;
  consume: (hospitalId: string, stateId: string, department?: Department) => any[] | null;
}

const PatientsPrefetchContext = createContext<PatientsPrefetchContextType | undefined>(undefined);

export function PatientsPrefetchProvider({ children }: { children: ReactNode }) {
  const { user, loading: authLoading } = useAuth();
  const { currentHospital, currentState, isLoading: hospitalLoading } = useHospital();
  const { currentDepartment } = useDepartment();
  const [isReady, setIsReady] = useState(false);
  const cacheRef = useRef<PrefetchEntry | null>(null);
  const lastKeyRef = useRef<string>("");

  useEffect(() => {
    // Nothing to prefetch until user + hospital ready.
    if (authLoading || hospitalLoading) return;
    if (!user || !currentHospital || !currentState) {
      setIsReady(true); // don't block auth screen
      return;
    }

    const key = `${currentHospital.id}:${currentState.id}:${currentDepartment}`;
    if (lastKeyRef.current === key && cacheRef.current) {
      setIsReady(true);
      return;
    }
    lastKeyRef.current = key;
    setIsReady(false);

    let cancelled = false;
    const MIN_GATE_MS = 7500; // deixa o anel completar um ciclo inteiro com calma
    const startedAt = performance.now();
    (async () => {
      try {
        const { data } = await supabase
          .from("patients")
          .select("*")
          .eq("hospital_unit_id", currentHospital.id)
          .eq("state_id", currentState.id)
          .eq("department", currentDepartment)
          .order("display_order")
          .order("bed_number");
        if (cancelled) return;
        cacheRef.current = {
          hospitalId: currentHospital.id,
          stateId: currentState.id,
          department: currentDepartment,
          data: data || [],
          fetchedAt: Date.now(),
        };
      } catch (e) {
        console.error("[PatientsPrefetch] falha:", e);
      } finally {
        const elapsed = performance.now() - startedAt;
        const remaining = Math.max(0, MIN_GATE_MS - elapsed);
        setTimeout(() => {
          if (!cancelled) setIsReady(true);
        }, remaining);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [user, authLoading, currentHospital, currentState, currentDepartment, hospitalLoading]);

  const getPrefetched = (hospitalId: string, stateId: string, department?: Department) => {
    const c = cacheRef.current;
    if (!c) return null;
    if (c.hospitalId !== hospitalId || c.stateId !== stateId) return null;
    if (department && c.department !== department) return null;
    // Only consider fresh for ~15s to avoid stale hydration on later navigations.
    if (Date.now() - c.fetchedAt > 15000) return null;
    return c.data;
  };

  const consume = (hospitalId: string, stateId: string, department?: Department) => {
    const data = getPrefetched(hospitalId, stateId, department);
    if (data) {
      // Invalidate after first consumption so subsequent mounts refetch normally.
      cacheRef.current = null;
    }
    return data;
  };

  return (
    <PatientsPrefetchContext.Provider value={{ isReady, getPrefetched, consume }}>
      {children}
    </PatientsPrefetchContext.Provider>
  );
}

export function usePatientsPrefetch() {
  const ctx = useContext(PatientsPrefetchContext);
  if (!ctx) throw new Error("usePatientsPrefetch must be used within PatientsPrefetchProvider");
  return ctx;
}
