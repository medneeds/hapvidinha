/**
 * Runtime store for FIXED bed capacity per department + sector.
 *
 * Source of truth is the `sector_bed_capacities` table (managed in the admin panel).
 * Values are cached in-memory for the currently selected hospital unit so that
 * synchronous helpers (bed naming, fixed-bed detection, self-heal) can read them.
 * Falls back to the historical hardcoded defaults when no row exists.
 */

export type CapacityRow = {
  department: string;
  sector: string;
  bed_prefix: string;
  fixed_bed_count: number;
};

export const DEFAULT_FIXED_COUNTS: Record<string, Record<string, number>> = {
  UTI: { blue: 10, yellow: 10 },
  __default__: { red: 7, yellow: 6, blue: 6 },
};

export const DEFAULT_PREFIXES: Record<string, Record<string, string>> = {
  UTI: { blue: 'U', yellow: 'U' },
  __default__: { red: 'V', yellow: 'A', blue: 'Z' },
};

export const CONFIGURABLE_SECTORS: Record<string, string[]> = {
  UTI: ['blue', 'yellow'],
  __default__: ['red', 'yellow', 'blue'],
};

const key = (department: string | null | undefined, sector: string) =>
  `${department ?? ''}|${sector}`;

let capacities: Record<string, number> = {};
let prefixes: Record<string, string> = {};
const listeners = new Set<() => void>();

export function setCapacityRows(rows: CapacityRow[]) {
  const nextCaps: Record<string, number> = {};
  const nextPrefixes: Record<string, string> = {};
  for (const row of rows) {
    nextCaps[key(row.department, row.sector)] = row.fixed_bed_count;
    if (row.bed_prefix) nextPrefixes[key(row.department, row.sector)] = row.bed_prefix;
  }
  capacities = nextCaps;
  prefixes = nextPrefixes;
  listeners.forEach((l) => l());
}

export function subscribeCapacities(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function getSectorGroup(department: string | null | undefined) {
  return department === 'UTI' ? 'UTI' : '__default__';
}

export function getDefaultFixedBedCount(department: string | null | undefined, sector: string) {
  return DEFAULT_FIXED_COUNTS[getSectorGroup(department)]?.[sector] ?? 0;
}

export function getFixedBedCount(department: string | null | undefined, sector: string): number {
  const configured = capacities[key(department, sector)];
  if (typeof configured === 'number') return configured;
  return getDefaultFixedBedCount(department, sector);
}

export function getBedPrefix(department: string | null | undefined, sector: string): string {
  return (
    prefixes[key(department, sector)] ||
    DEFAULT_PREFIXES[getSectorGroup(department)]?.[sector] ||
    'X'
  );
}

export function padBed(prefix: string, n: number) {
  return `${prefix}${String(n).padStart(2, '0')}`;
}

/** Ordered list of fixed bed numbers for a department + sector, e.g. ['V01','V02',...]. */
export function getFixedBedNumbers(
  department: string | null | undefined,
  sector: string,
): string[] {
  const count = getFixedBedCount(department, sector);
  const prefix = getBedPrefix(department, sector);
  return Array.from({ length: count }, (_, i) => padBed(prefix, i + 1));
}

/** True when the bed number is inside the configured fixed range for that sector. */
export function isWithinFixedRange(
  department: string | null | undefined,
  sector: string,
  bedNumber: string,
): boolean {
  const prefix = getBedPrefix(department, sector);
  if (!bedNumber.startsWith(prefix)) return false;
  const n = parseInt(bedNumber.slice(prefix.length), 10);
  if (Number.isNaN(n)) return false;
  return n >= 1 && n <= getFixedBedCount(department, sector);
}
