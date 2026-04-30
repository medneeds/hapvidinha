import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, act } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import {
  PalliativeFarewellProvider,
  usePalliativeFarewell,
} from "@/contexts/PalliativeFarewellContext";

// Stub the heavy SVG overlay so the test focuses on lifecycle, not animations.
vi.mock("@/components/PalliativeFarewellOverlay", () => ({
  PalliativeFarewellOverlay: ({
    open,
    patientName,
  }: {
    open: boolean;
    patientName?: string;
    onClose: () => void;
  }) =>
    open ? (
      <div data-testid="farewell-overlay">
        Em memória de {patientName}
      </div>
    ) : null,
}));

/**
 * Simulates the real bug scenario:
 *   1. A child component (the Movement Dialog) triggers the farewell.
 *   2. Immediately after, the parent unmounts the child (because the
 *      patient/bed is removed from the list on success).
 *   3. The overlay must remain visible because it lives in the global
 *      provider, not inside the unmounted child.
 */
function TriggerChild({ patientName }: { patientName: string }) {
  const { triggerFarewell } = usePalliativeFarewell();
  return (
    <button onClick={() => triggerFarewell(patientName)}>
      Registrar óbito
    </button>
  );
}

function Harness() {
  const [showChild, setShowChild] = useState(true);

  return (
    <PalliativeFarewellProvider>
      {showChild && <TriggerChild patientName="MARIA DA SILVA" />}
      <button onClick={() => setShowChild(false)}>Remover leito</button>
    </PalliativeFarewellProvider>
  );
}

describe("PalliativeFarewellProvider", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("opens the overlay when triggerFarewell is called", async () => {
    const user = userEvent.setup();
    render(<Harness />);

    expect(screen.queryByTestId("farewell-overlay")).not.toBeInTheDocument();

    await user.click(screen.getByText("Registrar óbito"));

    expect(screen.getByTestId("farewell-overlay")).toBeInTheDocument();
    expect(
      screen.getByText(/Em memória de MARIA DA SILVA/i)
    ).toBeInTheDocument();
  });

  it("keeps the overlay visible even when the triggering component unmounts", async () => {
    const user = userEvent.setup();
    render(<Harness />);

    // Step 1: child fires the farewell.
    await user.click(screen.getByText("Registrar óbito"));
    expect(screen.getByTestId("farewell-overlay")).toBeInTheDocument();

    // Step 2: parent removes the child (simulates the bed being deleted
    // and the PatientCard / MovementDialog unmounting right after).
    await user.click(screen.getByText("Remover leito"));

    // The triggering child is gone…
    expect(screen.queryByText("Registrar óbito")).not.toBeInTheDocument();

    // …but the overlay must survive because it is anchored to the provider.
    expect(screen.getByTestId("farewell-overlay")).toBeInTheDocument();
    expect(
      screen.getByText(/Em memória de MARIA DA SILVA/i)
    ).toBeInTheDocument();
  });

  it("preserves the patient name across re-renders after the trigger unmounts", async () => {
    const user = userEvent.setup();
    render(<Harness />);

    await user.click(screen.getByText("Registrar óbito"));
    await user.click(screen.getByText("Remover leito"));

    // Force a microtask flush — overlay state should still hold the name.
    await act(async () => {
      await Promise.resolve();
    });

    expect(
      screen.getByText(/Em memória de MARIA DA SILVA/i)
    ).toBeInTheDocument();
  });
});
