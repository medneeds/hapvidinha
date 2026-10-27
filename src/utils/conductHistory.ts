export interface ConductChange {
  oldValue: string | null;
  newValue: string | null;
}

const multisetDiff = (a: string[], b: string[]) => {
  const pool = [...b];
  const missing: string[] = [];
  for (const item of a) {
    const idx = pool.indexOf(item);
    if (idx >= 0) pool.splice(idx, 1);
    else missing.push(item);
  }
  return missing;
};

/**
 * Describes a change in a clinical list the same way the conduct history always did:
 * additions → "[ADICIONADO] item", removals → "[REMOVIDO] item", edits → old/new text.
 * Pure reordering is not recorded.
 */
export function describeListChange(oldItems: string[] = [], newItems: string[] = []): ConductChange[] {
  if (oldItems.join("\n") === newItems.join("\n")) return [];
  const added = multisetDiff(newItems, oldItems);
  const removed = multisetDiff(oldItems, newItems);
  if (added.length === 0 && removed.length === 0) return [];
  if (removed.length === 0) return added.map((item) => ({ oldValue: null, newValue: `[ADICIONADO] ${item}` }));
  if (added.length === 0) return removed.map((item) => ({ oldValue: `[REMOVIDO] ${item}`, newValue: null }));
  return [{ oldValue: oldItems.join("\n") || null, newValue: newItems.join("\n") || null }];
}
