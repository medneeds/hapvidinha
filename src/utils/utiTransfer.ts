import type { Patient } from "@/types/patient";

export type UtiUnit = 'UTI 1' | 'UTI 2';

const UE_WARD_LABEL: Record<Patient['sector'], string> = {
  red: 'CUIDADOS ESPECIAIS',
  yellow: 'OBSERVAÇÃO AMARELA',
  blue: 'OBSERVAÇÃO AZUL',
  outside: 'FORA DAS ALAS',
};

const UE_DEPARTMENT_SHORT: Record<string, string> = {
  'URGÊNCIA E EMERGÊNCIA ADULTO': 'UE ADULTO',
  'URGÊNCIA E EMERGÊNCIA PEDIÁTRICA': 'UE PEDIÁTRICA',
};

/** "UE ADULTO – CUIDADOS ESPECIAIS" — written in the UTI "Setor de origem". */
export function buildUtiOriginLabel(department: string, sector: Patient['sector'], bedNumber?: string): string {
  const dept = UE_DEPARTMENT_SHORT[department] || department.toUpperCase();
  const ward = UE_WARD_LABEL[sector] || String(sector).toUpperCase();
  return bedNumber ? `${dept} – ${ward} (${bedNumber})` : `${dept} – ${ward}`;
}

/** "UTI 1 – U03" — written in the movement history. */
export function buildUtiDestinationLabel(unit: UtiUnit, bedNumber: string): string {
  return `${unit} – ${bedNumber}`;
}

/** UTI 1 = sectors blue/red, UTI 2 = yellow (same rule as the UTI unit selector). */
export function isBedInUtiUnit(sector: string, unit: UtiUnit): boolean {
  return unit === 'UTI 2' ? sector === 'yellow' : sector === 'blue' || sector === 'red';
}

export interface UtiBedRow {
  id: string;
  bed_number: string;
  sector: string;
  is_vacant: boolean | null;
  bed_status: string | null;
}

/** Vacant, non-blocked beds of one UTI, in bed order. */
export function getVacantUtiBeds(rows: UtiBedRow[], unit: UtiUnit): UtiBedRow[] {
  return rows
    .filter(r => isBedInUtiUnit(r.sector, unit) && r.is_vacant === true && (r.bed_status || 'available') !== 'maintenance')
    .sort((a, b) => a.bed_number.localeCompare(b.bed_number, 'pt-BR', { numeric: true }));
}
