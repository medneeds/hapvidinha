import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export function useAgeCalculator() {
  const [isCalculating, setIsCalculating] = useState(false);

  const calculateAge = async (input: string): Promise<string | null> => {
    if (!input.trim()) return null;

    setIsCalculating(true);
    try {
      const { data, error } = await supabase.functions.invoke("format-pediatric-age", {
        body: { input: input.trim() },
      });

      if (error) throw error;

      if (data?.formatted_age) {
        console.log("Idade formatada:", data.formatted_age, "Categoria:", data.age_category);
        return data.formatted_age;
      }

      throw new Error("Resposta inválida da formatação de idade");
    } catch (error) {
      console.error("Erro ao formatar idade:", error);
      toast.error("Erro ao formatar idade");
      return null;
    } finally {
      setIsCalculating(false);
    }
  };

  return { calculateAge, isCalculating };
}
