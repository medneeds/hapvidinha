import { useState } from "react";
import { parseDate, calculateDetailedAge } from "@/utils/pediatricAgeFormat";

/**
 * Calcula idade localmente a partir de uma idade simples ou data de nascimento.
 * Não utiliza nenhum processamento por IA.
 */
export function useAgeCalculator(isPediatric: boolean = false) {
  const [isCalculating] = useState(false);

  const calculateAge = async (input: string): Promise<string | null> => {
    if (!input.trim()) return null;
    const trimmed = input.trim();

    // Número simples → anos
    if (/^\d+$/.test(trimmed)) {
      const age = parseInt(trimmed);
      return age === 1 ? "1 ANO" : `${age} ANOS`;
    }

    // Data de nascimento
    const birthDate = parseDate(trimmed);
    if (birthDate) {
      const ageData = calculateDetailedAge(birthDate);
      if (ageData) {
        if (isPediatric) {
          const parts: string[] = [];
          if (ageData.years > 0) parts.push(`${ageData.years}A`);
          if (ageData.months > 0) parts.push(`${ageData.months}M`);
          if (ageData.days > 0 || parts.length === 0) parts.push(`${ageData.days}D`);
          return parts.join(" ");
        }
        const years = ageData.years || 0;
        return years === 1 ? "1 ANO" : `${years} ANOS`;
      }
    }

    return trimmed.toUpperCase();
  };

  return { calculateAge, isCalculating };
}
