import { createContext, useContext, useState, ReactNode, useEffect } from "react";

export type Department = 
  | "URGÊNCIA E EMERGÊNCIA ADULTO"
  | "URGÊNCIA E EMERGÊNCIA PEDIÁTRICA"
  | "UTI";

interface DepartmentContextType {
  currentDepartment: Department;
  setCurrentDepartment: (department: Department) => void;
}

const DepartmentContext = createContext<DepartmentContextType | undefined>(undefined);

const STORAGE_KEY = "selected_department";

export function DepartmentProvider({ children }: { children: ReactNode }) {
  const [currentDepartment, setCurrentDepartmentState] = useState<Department>(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    return (stored as Department) || "URGÊNCIA E EMERGÊNCIA ADULTO";
  });

  const setCurrentDepartment = (department: Department) => {
    setCurrentDepartmentState(department);
    localStorage.setItem(STORAGE_KEY, department);
  };

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, currentDepartment);
  }, [currentDepartment]);

  return (
    <DepartmentContext.Provider value={{ currentDepartment, setCurrentDepartment }}>
      {children}
    </DepartmentContext.Provider>
  );
}

export function useDepartment() {
  const context = useContext(DepartmentContext);
  if (context === undefined) {
    throw new Error("useDepartment must be used within a DepartmentProvider");
  }
  return context;
}

export const DEPARTMENTS: Department[] = [
  "URGÊNCIA E EMERGÊNCIA ADULTO",
  "URGÊNCIA E EMERGÊNCIA PEDIÁTRICA",
  "UTI",
];

export const DEPARTMENT_LABELS: Record<Department, string> = {
  "URGÊNCIA E EMERGÊNCIA ADULTO": "UE ADULTO",
  "URGÊNCIA E EMERGÊNCIA PEDIÁTRICA": "UE PEDIÁTRICA",
  "UTI": "UTI",
};

export function getDepartmentLabel(dept: Department | string | null | undefined): string {
  if (!dept) return "";
  return (DEPARTMENT_LABELS as Record<string, string>)[dept] ?? String(dept);
}

