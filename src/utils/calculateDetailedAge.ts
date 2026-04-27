/**
 * Calcula idade detalhada (anos, meses, dias) a partir de uma data de nascimento.
 * Aceita string em DD/MM/YYYY ou ISO (YYYY-MM-DD).
 */
export interface DetailedAge {
  years: number;
  months: number;
  days: number;
}

export function parseBirthDate(input: string | undefined | null): Date | null {
  if (!input) return null;
  const trimmed = input.trim();
  if (!trimmed) return null;

  // DD/MM/YYYY
  const br = trimmed.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (br) {
    const [_, dd, mm, yyyy] = br;
    const d = new Date(parseInt(yyyy), parseInt(mm) - 1, parseInt(dd));
    return isNaN(d.getTime()) ? null : d;
  }

  // ISO YYYY-MM-DD
  const iso = trimmed.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (iso) {
    const [_, yyyy, mm, dd] = iso;
    const d = new Date(parseInt(yyyy), parseInt(mm) - 1, parseInt(dd));
    return isNaN(d.getTime()) ? null : d;
  }

  const fallback = new Date(trimmed);
  return isNaN(fallback.getTime()) ? null : fallback;
}

export function calculateDetailedAge(birthDate: string | Date | null | undefined): DetailedAge | null {
  const birth = birthDate instanceof Date ? birthDate : parseBirthDate(birthDate);
  if (!birth) return null;

  const now = new Date();
  if (birth > now) return null;

  let years = now.getFullYear() - birth.getFullYear();
  let months = now.getMonth() - birth.getMonth();
  let days = now.getDate() - birth.getDate();

  if (days < 0) {
    months -= 1;
    // Dias do mês anterior
    const prevMonth = new Date(now.getFullYear(), now.getMonth(), 0);
    days += prevMonth.getDate();
  }
  if (months < 0) {
    years -= 1;
    months += 12;
  }

  return { years, months, days };
}

export function formatDetailedAge(age: DetailedAge | null): string {
  if (!age) return '';
  const parts: string[] = [];
  if (age.years > 0) parts.push(`${age.years}A`);
  if (age.months > 0) parts.push(`${age.months}M`);
  if (age.days > 0 || parts.length === 0) parts.push(`${age.days}D`);
  return parts.join(' ');
}

/** Converte data ISO ou DD/MM/YYYY -> DD/MM/YYYY para exibição. */
export function formatBirthDateDisplay(input: string | undefined | null): string {
  const d = parseBirthDate(input ?? '');
  if (!d) return '';
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const yyyy = d.getFullYear();
  return `${dd}/${mm}/${yyyy}`;
}

/** Converte DD/MM/YYYY -> YYYY-MM-DD (para persistir como `date` no Postgres). */
export function birthDateToISO(input: string | undefined | null): string | null {
  const d = parseBirthDate(input ?? '');
  if (!d) return null;
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}
