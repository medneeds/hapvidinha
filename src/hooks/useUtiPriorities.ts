import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useHospital } from "@/contexts/HospitalContext";
import { useToast } from "@/hooks/use-toast";

export interface UtiPriorityEntry {
  id: string;
  patient_id: string;
  position: number;
  notes: string | null;
  added_by: string | null;
  added_by_email: string | null;
  created_at: string;
}

export function useUtiPriorities() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { currentHospital, currentState } = useHospital();
  const { toast } = useToast();

  const scopeKey = [
    "uti-priorities",
    currentHospital?.id ?? null,
    currentState?.id ?? null,
  ];

  const { data: priorities = [], isLoading } = useQuery({
    queryKey: scopeKey,
    queryFn: async () => {
      if (!currentHospital || !currentState) return [];
      const { data, error } = await supabase
        .from("uti_priorities")
        .select("*")
        .eq("hospital_unit_id", currentHospital.id)
        .eq("state_id", currentState.id)
        .order("position", { ascending: true });
      if (error) {
        console.error("Erro ao carregar prioridades UTI:", error);
        return [];
      }
      return (data ?? []) as UtiPriorityEntry[];
    },
    enabled: !!currentHospital && !!currentState,
    staleTime: 15_000,
  });

  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: scopeKey });

  const addPriority = useMutation({
    mutationFn: async (patientId: string) => {
      if (!currentHospital || !currentState) throw new Error("Sem hospital");
      const nextPos =
        (priorities.length > 0
          ? Math.max(...priorities.map((p) => p.position))
          : 0) + 1;
      const { error } = await supabase.from("uti_priorities").insert({
        patient_id: patientId,
        hospital_unit_id: currentHospital.id,
        state_id: currentState.id,
        position: nextPos,
        added_by: user?.id ?? null,
        added_by_email: user?.email ?? null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      invalidate();
      toast({ title: "Paciente adicionado às prioridades UTI" });
    },
    onError: (err: any) => {
      toast({
        title: "Erro ao adicionar",
        description: err?.message ?? String(err),
        variant: "destructive",
      });
    },
  });

  const removePriority = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("uti_priorities")
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      invalidate();
      toast({ title: "Removido da lista de prioridades" });
    },
    onError: (err: any) => {
      toast({
        title: "Erro ao remover",
        description: err?.message ?? String(err),
        variant: "destructive",
      });
    },
  });

  const reorder = useMutation({
    mutationFn: async (orderedIds: string[]) => {
      const updates = orderedIds.map((id, idx) =>
        supabase
          .from("uti_priorities")
          .update({ position: idx + 1 })
          .eq("id", id),
      );
      const results = await Promise.all(updates);
      const failed = results.find((r) => r.error);
      if (failed?.error) throw failed.error;
    },
    onSuccess: () => invalidate(),
    onError: (err: any) => {
      toast({
        title: "Erro ao reordenar",
        description: err?.message ?? String(err),
        variant: "destructive",
      });
      invalidate();
    },
  });

  return {
    priorities,
    isLoading,
    addPriority: addPriority.mutate,
    removePriority: removePriority.mutate,
    reorder: reorder.mutate,
  };
}
