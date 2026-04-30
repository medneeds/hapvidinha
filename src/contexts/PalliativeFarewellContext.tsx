import { createContext, useContext, useState, ReactNode, useCallback } from "react";
import { PalliativeFarewellOverlay } from "@/components/PalliativeFarewellOverlay";

interface PalliativeFarewellContextValue {
  triggerFarewell: (patientName: string) => void;
}

const PalliativeFarewellContext = createContext<PalliativeFarewellContextValue | null>(null);

export function PalliativeFarewellProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");

  const triggerFarewell = useCallback((patientName: string) => {
    setName(patientName);
    setOpen(true);
  }, []);

  return (
    <PalliativeFarewellContext.Provider value={{ triggerFarewell }}>
      {children}
      <PalliativeFarewellOverlay
        open={open}
        patientName={name}
        onClose={() => setOpen(false)}
      />
    </PalliativeFarewellContext.Provider>
  );
}

export function usePalliativeFarewell() {
  const ctx = useContext(PalliativeFarewellContext);
  if (!ctx) {
    return { triggerFarewell: () => {} };
  }
  return ctx;
}
