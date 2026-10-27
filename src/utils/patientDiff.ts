import type { Patient } from "@/types/patient";

const normalize = (value: unknown) => JSON.stringify(value ?? null);

/**
 * Returns only the fields of `updates` that differ from `base`.
 * Callers often send the whole patient object; persisting only the changed
 * fields prevents a stale snapshot from overwriting fields that were edited
 * moments before (e.g. two quick entries in the same UTI column).
 */
export function getChangedPatientFields(
  base: Patient | undefined,
  updates: Partial<Patient>,
): Partial<Patient> {
  const changed: Partial<Patient> = {};
  (Object.keys(updates) as (keyof Patient)[]).forEach((key) => {
    if (key === "id") return;
    const next = updates[key];
    if (next === undefined) return;
    if (base && normalize(base[key]) === normalize(next)) return;
    (changed as Record<string, unknown>)[key] = next;
  });
  return changed;
}
