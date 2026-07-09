import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useHospital } from "@/contexts/HospitalContext";
import { useToast } from "@/hooks/use-toast";

export interface MedicalCode {
  id: string;
  category: string;
  code: string;
  name: string;
  system_description: string | null;
  source: "institutional" | "custom";
}

export function useMedicalCodes() {
  const qc = useQueryClient();
  const { user } = useAuth();
  const { currentHospital, currentState } = useHospital();
  const { toast } = useToast();

  const scope = ["medical-codes-combined", currentHospital?.id, currentState?.id];

  const { data: codes = [], isLoading } = useQuery({
    queryKey: scope,
    queryFn: async () => {
      const [inst, custom] = await Promise.all([
        supabase.from("medical_codes").select("*").order("category").order("name"),
        currentHospital && currentState
          ? supabase
              .from("custom_medical_codes")
              .select("*")
              .eq("hospital_unit_id", currentHospital.id)
              .eq("state_id", currentState.id)
              .order("category")
              .order("name")
          : Promise.resolve({ data: [], error: null } as any),
      ]);
      const institutional: MedicalCode[] = (inst.data ?? []).map((c: any) => ({
        id: c.id,
        category: c.category,
        code: c.code,
        name: c.name,
        system_description: c.system_description ?? null,
        source: "institutional",
      }));
      const customList: MedicalCode[] = (custom.data ?? []).map((c: any) => ({
        id: c.id,
        category: c.category,
        code: c.code,
        name: c.name,
        system_description: c.system_description ?? null,
        source: "custom",
      }));
      return [...institutional, ...customList];
    },
    staleTime: 30_000,
  });

  const invalidate = () => qc.invalidateQueries({ queryKey: scope });

  const addCustom = useMutation({
    mutationFn: async (input: {
      category: string;
      code: string;
      name: string;
      system_description?: string;
    }) => {
      if (!currentHospital || !currentState) throw new Error("Sem hospital");
      const { error } = await supabase.from("custom_medical_codes").insert({
        hospital_unit_id: currentHospital.id,
        state_id: currentState.id,
        category: input.category.toUpperCase().trim(),
        code: input.code.toUpperCase().trim(),
        name: input.name.toUpperCase().trim(),
        system_description: input.system_description?.toUpperCase().trim() || null,
        created_by: user?.id ?? null,
        created_by_email: user?.email ?? null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      invalidate();
      toast({ title: "Código personalizado adicionado" });
    },
    onError: (e: any) =>
      toast({ title: "Erro ao adicionar", description: e?.message, variant: "destructive" }),
  });

  const removeCustom = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("custom_medical_codes").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: invalidate,
  });

  return {
    codes,
    isLoading,
    addCustom: addCustom.mutate,
    removeCustom: removeCustom.mutate,
  };
}
