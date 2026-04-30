import { createContext, useContext, useState, ReactNode, useCallback, useRef } from "react";
import { PalliativeFarewellOverlay } from "@/components/PalliativeFarewellOverlay";

interface PalliativeFarewellContextValue {
  triggerFarewell: (patientName: string) => void;
}

const PalliativeFarewellContext = createContext<PalliativeFarewellContextValue | null>(null);

export function PalliativeFarewellProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const nameRef = useRef("");

  const triggerFarewell = useCallback((patientName: string) => {
    console.log('[FAREWELL] context.triggerFarewell received', {
      patientName,
      timestamp: new Date().toISOString(),
    });
    nameRef.current = patientName;
    setName(patientName);
    setOpen(true);
  }, []);

  const handleClose = useCallback(() => {
    console.log('[FAREWELL] context.onClose fired — setting open=false', {
      patientName: nameRef.current,
      timestamp: new Date().toISOString(),
    });
    setOpen(false);
  }, []);

  return (
    <PalliativeFarewellContext.Provider value={{ triggerFarewell }}>
      {children}
      <PalliativeFarewellOverlay
        open={open}
        patientName={name}
        onClose={handleClose}
      />
    </PalliativeFarewellContext.Provider>
  );
}

export function usePalliativeFarewell() {
  const ctx = useContext(PalliativeFarewellContext);
  if (!ctx) {
    console.warn('[FAREWELL] usePalliativeFarewell called outside provider — using no-op');
    return { triggerFarewell: () => {} };
  }
  return ctx;
}
