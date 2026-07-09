import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useHospital } from "@/contexts/HospitalContext";
import { useDepartment } from "@/contexts/DepartmentContext";
import { useToast } from "@/hooks/use-toast";

export interface UnitSharedNote {
  id: string;
  content: string;
  updated_at: string;
  updated_by_email: string | null;
}

export function useUnitSharedNotes() {
  const qc = useQueryClient();
  const { user } = useAuth();
  const { currentHospital, currentState } = useHospital();
  const { currentDepartment } = useDepartment();
  const { toast } = useToast();

  const scope = ["unit-shared-notes", currentHospital?.id, currentState?.id, currentDepartment];

  const { data: note, isLoading } = useQuery({
    queryKey: scope,
    queryFn: async () => {
      if (!currentHospital || !currentState) return null;
      const { data, error } = await supabase
        .from("unit_shared_notes")
        .select("*")
        .eq("hospital_unit_id", currentHospital.id)
        .eq("state_id", currentState.id)
        .eq("department", currentDepartment)
        .maybeSingle();
      if (error) return null;
      return (data ?? null) as UnitSharedNote | null;
    },
    enabled: !!currentHospital && !!currentState,
    staleTime: 10_000,
  });

  const saveNote = useMutation({
    mutationFn: async (content: string) => {
      if (!currentHospital || !currentState) throw new Error("Sem hospital");
      const payload = {
        hospital_unit_id: currentHospital.id,
        state_id: currentState.id,
        department: currentDepartment,
        content,
        updated_by: user?.id ?? null,
        updated_by_email: user?.email ?? null,
      };
      const { error } = await supabase
        .from("unit_shared_notes")
        .upsert(payload, { onConflict: "hospital_unit_id,state_id,department" });
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: scope }),
    onError: (e: any) =>
      toast({ title: "Erro ao salvar anotações", description: e?.message, variant: "destructive" }),
  });

  return {
    content: note?.content ?? "",
    updatedAt: note?.updated_at ?? null,
    updatedByEmail: note?.updated_by_email ?? null,
    isLoading,
    saveNote: saveNote.mutate,
    isSaving: saveNote.isPending,
  };
}
