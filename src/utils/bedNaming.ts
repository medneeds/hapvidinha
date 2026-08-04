/**
 * Sector bed configuration: defines prefix, max regular beds, and naming conventions.
 * 
 * Regular beds follow the pattern: PREFIX + NUMBER (e.g., V01, A03, Z06)
 * Extra beds (beyond capacity) follow: EXTRA + NUMBER (e.g., EXTRA1, EXTRA2)
 */

import { getBedPrefix, getFixedBedCount } from '@/utils/bedCapacityStore';


export interface SectorBedConfig {
  prefix: string;
  maxRegularBeds: number;
  label: string;
}

export const SECTOR_BED_CONFIG: Record<string, SectorBedConfig> = {
  red: { prefix: 'V', maxRegularBeds: 7, label: 'Cuidados Especiais' },
  yellow: { prefix: 'A', maxRegularBeds: 6, label: 'Observação Amarela' },
  blue: { prefix: 'Z', maxRegularBeds: 6, label: 'Observação Azul' },
  outside: { prefix: 'F', maxRegularBeds: Infinity, label: 'Fora das Alas' },
};

/**
 * Determines the next bed number for a given sector based on existing beds.
 * 
 * Logic:
 * 1. If there are available regular slots (V01-V02, A01-A06, Z01-Z06),
 *    assigns the next sequential regular bed.
 * 2. If all regular slots are filled, assigns an EXTRA bed (EXTRA1, EXTRA2, ...).
 */
export function getNextBedNumber(
  sector: string,
  existingBedNumbers: string[],
  department?: string
): string {
  const prefix = getBedPrefix(department, sector);
  const maxRegularBeds =
    sector === 'outside' ? Infinity : getFixedBedCount(department, sector);

  if (sector === 'outside') {
    return `F${String(existingBedNumbers.length + 1).padStart(2, '0')}`;
  }

  const regularBedNumbers = existingBedNumbers
    .filter(b => b.startsWith(prefix) && !b.startsWith('EXTRA'))
    .map(b => parseInt(b.substring(prefix.length), 10))
    .filter(n => !isNaN(n));

  for (let i = 1; i <= maxRegularBeds; i++) {
    if (!regularBedNumbers.includes(i)) {
      return `${prefix}${String(i).padStart(2, '0')}`;
    }
  }


  // All regular beds occupied → assign EXTRA bed
  const extraBedNumbers = existingBedNumbers
    .filter(b => b.startsWith('EXTRA'))
    .map(b => parseInt(b.replace('EXTRA', ''), 10))
    .filter(n => !isNaN(n));

  const nextExtra = extraBedNumbers.length > 0 ? Math.max(...extraBedNumbers) + 1 : 1;
  return `EXTRA${nextExtra}`;
}

/**
 * Checks if a bed number is an "extra" bed (beyond sector capacity).
 */
export function isExtraBed(bedNumber: string): boolean {
  return bedNumber.startsWith('EXTRA');
}

/**
 * Returns the display label for a bed number.
 * Regular beds: "V01", "A03", etc.
 * Extra beds: "EXTRA 1", "EXTRA 2", etc.
 */
export function formatBedDisplay(bedNumber: string): string {
  if (isExtraBed(bedNumber)) {
    const num = bedNumber.replace('EXTRA', '');
    return `EXTRA ${num}`;
  }
  return bedNumber;
}
