import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export function useAgeCalculator() {
  const [isCalculating, setIsCalculating] = useState(false);

  const calculateAge = async (input: string): Promise<number | null> => {
    if (!input.trim()) return null;

    setIsCalculating(true);
    try {
      const { data, error } = await supabase.functions.invoke("calculate-age", {
        body: { input: input.trim() },
      });

      if (error) throw error;

      if (data?.age !== undefined) {
        return data.age;
      }

      throw new Error("Resposta inválida");
    } catch (error) {
      console.error("Erro ao calcular idade:", error);
      toast.error("Erro ao calcular idade");
      return null;
    } finally {
      setIsCalculating(false);
    }
  };

  return { calculateAge, isCalculating };
}
