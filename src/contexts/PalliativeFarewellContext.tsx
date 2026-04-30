import { createContext, useContext, useState, ReactNode, useCallback, useRef } from "react";
import { PalliativeFarewellOverlay } from "@/components/PalliativeFarewellOverlay";

type DeallocateFn = () => Promise<void> | void;

interface TriggerOptions {
  /**
   * Called when the user confirms the bed deallocation at the end of the
   * farewell animation. Mirrors the behaviour of alta/transferência: only
   * after this resolves successfully do we close the overlay.
   */
  onDeallocate?: DeallocateFn;
}

interface PalliativeFarewellContextValue {
  triggerFarewell: (patientName: string, options?: TriggerOptions) => void;
}

const PalliativeFarewellContext = createContext<PalliativeFarewellContextValue | null>(null);

export function PalliativeFarewellProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const nameRef = useRef("");
  const onDeallocateRef = useRef<DeallocateFn | null>(null);

  const triggerFarewell = useCallback((patientName: string, options?: TriggerOptions) => {
    console.log('[FAREWELL] context.triggerFarewell received', {
      patientName,
      hasDeallocate: !!options?.onDeallocate,
      timestamp: new Date().toISOString(),
    });
    nameRef.current = patientName;
    onDeallocateRef.current = options?.onDeallocate ?? null;
    setName(patientName);
    setOpen(true);
  }, []);

  const handleClose = useCallback(() => {
    console.log('[FAREWELL] context.onClose fired — setting open=false', {
      patientName: nameRef.current,
      timestamp: new Date().toISOString(),
    });
    setOpen(false);
    onDeallocateRef.current = null;
  }, []);

  const handleDeallocate = useCallback(async () => {
    const fn = onDeallocateRef.current;
    if (!fn) return;
    await fn();
  }, []);

  return (
    <PalliativeFarewellContext.Provider value={{ triggerFarewell }}>
      {children}
      <PalliativeFarewellOverlay
        open={open}
        patientName={name}
        onClose={handleClose}
        onDeallocate={handleDeallocate}
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
