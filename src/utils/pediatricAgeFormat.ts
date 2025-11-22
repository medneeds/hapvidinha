/**
 * Formata a idade pediátrica seguindo padrões clínicos
 * Baseado na tabela de expressão de idade em prontuários pediátricos
 */

export interface PediatricAgeInput {
  years?: number;
  months?: number;
  days?: number;
}

/**
 * Formata a idade para exibição seguindo padrões pediátricos
 */
export function formatPediatricAge(input: string | number): string {
  if (typeof input === 'number') {
    // Apenas anos
    if (input === 1) return "1 ANO";
    return `${input} ANOS`;
  }

  // Se já está formatado, retorna como está
  return input.toUpperCase();
}

/**
 * Extrai componentes de idade de uma string
 */
export function parsePediatricAge(ageString: string): PediatricAgeInput | null {
  const normalized = ageString.toLowerCase().trim();
  
  // DOL pattern (dias de vida)
  const dolMatch = normalized.match(/dol\s*(\d+)/);
  if (dolMatch) {
    return { days: parseInt(dolMatch[1]) };
  }
  
  // Semanas + dias pattern
  const weeksDaysMatch = normalized.match(/(\d+)\s*semanas?\s*(?:\+|e)?\s*(\d+)?\s*dias?/);
  if (weeksDaysMatch) {
    const weeks = parseInt(weeksDaysMatch[1]);
    const days = weeksDaysMatch[2] ? parseInt(weeksDaysMatch[2]) : 0;
    return { days: weeks * 7 + days };
  }
  
  // Meses e dias pattern
  const monthsDaysMatch = normalized.match(/(\d+)\s*m[eê]s(?:es)?\s*(?:e|,)?\s*(\d+)?\s*dias?/);
  if (monthsDaysMatch) {
    return {
      months: parseInt(monthsDaysMatch[1]),
      days: monthsDaysMatch[2] ? parseInt(monthsDaysMatch[2]) : 0
    };
  }
  
  // Anos e meses pattern
  const yearsMonthsMatch = normalized.match(/(\d+)\s*anos?\s*(?:e|,)?\s*(\d+)?\s*m[eê]s(?:es)?/);
  if (yearsMonthsMatch) {
    return {
      years: parseInt(yearsMonthsMatch[1]),
      months: yearsMonthsMatch[2] ? parseInt(yearsMonthsMatch[2]) : 0
    };
  }
  
  // Apenas meses
  const monthsOnlyMatch = normalized.match(/(\d+)\s*m[eê]s(?:es)?/);
  if (monthsOnlyMatch) {
    return { months: parseInt(monthsOnlyMatch[1]) };
  }
  
  // Apenas anos
  const yearsOnlyMatch = normalized.match(/(\d+)\s*anos?/);
  if (yearsOnlyMatch) {
    return { years: parseInt(yearsOnlyMatch[1]) };
  }
  
  // Apenas dias
  const daysOnlyMatch = normalized.match(/(\d+)\s*dias?/);
  if (daysOnlyMatch) {
    return { days: parseInt(daysOnlyMatch[1]) };
  }
  
  return null;
}

/**
 * Sugere formato baseado na entrada do usuário
 */
export function suggestPediatricFormat(parsed: PediatricAgeInput): string {
  const { years = 0, months = 0, days = 0 } = parsed;
  
  const totalDays = (years * 365) + (months * 30) + days;
  
  // 0-28 dias: DOL
  if (totalDays <= 28) {
    return `DOL ${totalDays}`;
  }
  
  // 29 dias - 3 meses: semanas + dias
  if (totalDays <= 90) {
    const weeks = Math.floor(totalDays / 7);
    const remainingDays = totalDays % 7;
    if (remainingDays > 0) {
      return `${weeks} SEMANA${weeks !== 1 ? 'S' : ''} + ${remainingDays} DIA${remainingDays !== 1 ? 'S' : ''}`;
    }
    return `${weeks} SEMANA${weeks !== 1 ? 'S' : ''}`;
  }
  
  // 3-12 meses: meses e dias
  if (months < 12 && years === 0) {
    if (days > 0) {
      return `${months} MES${months !== 1 ? 'ES' : ''} E ${days} DIA${days !== 1 ? 'S' : ''}`;
    }
    return `${months} MES${months !== 1 ? 'ES' : ''}`;
  }
  
  // 12-24 meses: apenas meses
  if (years < 2 || (years === 2 && months === 0 && days === 0)) {
    const totalMonths = (years * 12) + months;
    return `${totalMonths} MESES`;
  }
  
  // 2-12 anos: anos e meses
  if (years < 12) {
    if (months > 0) {
      return `${years} ANO${years !== 1 ? 'S' : ''} E ${months} MES${months !== 1 ? 'ES' : ''}`;
    }
    return `${years} ANO${years !== 1 ? 'S' : ''}`;
  }
  
  // >= 12 anos: apenas anos
  return `${years} ANOS`;
}
