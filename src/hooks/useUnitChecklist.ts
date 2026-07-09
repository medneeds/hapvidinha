import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useHospital } from "@/contexts/HospitalContext";
import { useDepartment } from "@/contexts/DepartmentContext";
import { useToast } from "@/hooks/use-toast";

export interface UnitChecklistItem {
  id: string;
  text: string;
  completed: boolean;
  position: number;
  created_by_email: string | null;
  completed_by_email: string | null;
  completed_at: string | null;
  created_at: string;
}

export function useUnitChecklist() {
  const qc = useQueryClient();
  const { user } = useAuth();
  const { currentHospital, currentState } = useHospital();
  const { currentDepartment } = useDepartment();
  const { toast } = useToast();

  const scope = ["unit-checklist", currentHospital?.id, currentState?.id, currentDepartment];

  const { data: items = [], isLoading } = useQuery({
    queryKey: scope,
    queryFn: async () => {
      if (!currentHospital || !currentState) return [];
      const { data, error } = await supabase
        .from("unit_checklist_items")
        .select("*")
        .eq("hospital_unit_id", currentHospital.id)
        .eq("state_id", currentState.id)
        .eq("department", currentDepartment)
        .order("position", { ascending: true })
        .order("created_at", { ascending: true });
      if (error) return [];
      return (data ?? []) as UnitChecklistItem[];
    },
    enabled: !!currentHospital && !!currentState,
    staleTime: 15_000,
  });

  const invalidate = () => qc.invalidateQueries({ queryKey: scope });

  const addItem = useMutation({
    mutationFn: async (text: string) => {
      if (!currentHospital || !currentState) throw new Error("Sem hospital");
      const nextPos = (items.length ? Math.max(...items.map((i) => i.position)) : 0) + 1;
      const { error } = await supabase.from("unit_checklist_items").insert({
        hospital_unit_id: currentHospital.id,
        state_id: currentState.id,
        department: currentDepartment,
        text: text.toUpperCase().trim(),
        position: nextPos,
        created_by: user?.id ?? null,
        created_by_email: user?.email ?? null,
      });
      if (error) throw error;
    },
    onSuccess: invalidate,
    onError: (e: any) =>
      toast({ title: "Erro ao adicionar", description: e?.message, variant: "destructive" }),
  });

  const toggleItem = useMutation({
    mutationFn: async (item: UnitChecklistItem) => {
      const nowCompleted = !item.completed;
      const { error } = await supabase
        .from("unit_checklist_items")
        .update({
          completed: nowCompleted,
          completed_by: nowCompleted ? user?.id ?? null : null,
          completed_by_email: nowCompleted ? user?.email ?? null : null,
          completed_at: nowCompleted ? new Date().toISOString() : null,
        })
        .eq("id", item.id);
      if (error) throw error;
    },
    onSuccess: invalidate,
  });

  const removeItem = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("unit_checklist_items").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: invalidate,
  });

  const clearCompleted = useMutation({
    mutationFn: async () => {
      if (!currentHospital || !currentState) return;
      const { error } = await supabase
        .from("unit_checklist_items")
        .delete()
        .eq("hospital_unit_id", currentHospital.id)
        .eq("state_id", currentState.id)
        .eq("department", currentDepartment)
        .eq("completed", true);
      if (error) throw error;
    },
    onSuccess: invalidate,
  });

  return {
    items,
    isLoading,
    addItem: addItem.mutate,
    toggleItem: toggleItem.mutate,
    removeItem: removeItem.mutate,
    clearCompleted: clearCompleted.mutate,
  };
}
