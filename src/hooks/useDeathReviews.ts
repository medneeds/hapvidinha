import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useHospital } from "@/contexts/HospitalContext";

export interface DeathReview {
  id: string;
  patient_movement_id: string | null;
  patient_name: string;
  patient_bed: string;
  patient_sector: string | null;
  department: string;
  state_id: string;
  hospital_unit_id: string;
  death_certificate_done: boolean;
  death_certificate_at: string | null;
  death_certificate_by: string | null;
  family_notified_done: boolean;
  family_notified_at: string | null;
  family_notified_by: string | null;
  belongings_removal_done: boolean;
  belongings_removal_at: string | null;
  belongings_removal_by: string | null;
  chart_finalized_done: boolean;
  chart_finalized_at: string | null;
  chart_finalized_by: string | null;
  completed_at: string | null;
  notes: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export type DeathReviewItem =
  | "death_certificate"
  | "family_notified"
  | "belongings_removal"
  | "chart_finalized";

type DeathReviewDoneKey = `${DeathReviewItem}_done`;
type DeathReviewAtKey = `${DeathReviewItem}_at`;
type DeathReviewByKey = `${DeathReviewItem}_by`;
type DeathReviewUpdate = Partial<
  Pick<DeathReview, DeathReviewDoneKey | DeathReviewAtKey | DeathReviewByKey | "completed_at">
>;

export const DEATH_REVIEW_ITEMS: { key: DeathReviewItem; label: string }[] = [
  { key: "death_certificate", label: "DECLARAÇÃO DE ÓBITO EMITIDA" },
  { key: "family_notified", label: "FAMÍLIA COMUNICADA" },
  { key: "belongings_removal", label: "PERTENCES E REMOÇÃO" },
  { key: "chart_finalized", label: "PRONTUÁRIO FINALIZADO E LEITO LIBERADO" },
];

export function useDeathReviews(department?: string | null) {
  const { currentState, currentHospital } = useHospital();
  const [reviews, setReviews] = useState<DeathReview[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchReviews = useCallback(async () => {
    if (!currentState?.id || !currentHospital?.id) {
      setReviews([]);
      setIsLoading(false);
      return;
    }

    let query = supabase
      .from("death_reviews")
      .select("*")
      .eq("state_id", currentState.id)
      .eq("hospital_unit_id", currentHospital.id)
      .is("completed_at", null)
      .order("created_at", { ascending: false });

    if (department) {
      query = query.eq("department", department);
    }

    const { data, error } = await query;

    if (!error && data) {
      setReviews(data as unknown as DeathReview[]);
    }
    setIsLoading(false);
  }, [currentState?.id, currentHospital?.id, department]);

  useEffect(() => {
    fetchReviews();
  }, [fetchReviews]);

  // Realtime
  useEffect(() => {
    if (!currentState?.id || !currentHospital?.id) return;
    const channel = supabase
      .channel("death_reviews_changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "death_reviews" },
        () => fetchReviews()
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [currentState?.id, currentHospital?.id, fetchReviews]);

  const createReview = useCallback(
    async (input: {
      patient_movement_id?: string | null;
      patient_name: string;
      patient_bed: string;
      patient_sector?: string | null;
      department: string;
    }) => {
      if (!currentState?.id || !currentHospital?.id) return null;
      const { data: userData } = await supabase.auth.getUser();
      const { data, error } = await supabase
        .from("death_reviews")
        .insert({
          patient_movement_id: input.patient_movement_id ?? null,
          patient_name: input.patient_name,
          patient_bed: input.patient_bed,
          patient_sector: input.patient_sector ?? null,
          department: input.department,
          state_id: currentState.id,
          hospital_unit_id: currentHospital.id,
          created_by: userData.user?.id ?? null,
        })
        .select()
        .single();
      if (error) {
        console.error("Failed to create death review", error);
        return null;
      }
      await fetchReviews();
      return data as unknown as DeathReview;
    },
    [currentState?.id, currentHospital?.id, fetchReviews]
  );

  const toggleItem = useCallback(
    async (review: DeathReview, item: DeathReviewItem, done: boolean, byName: string) => {
      const now = new Date().toISOString();
      const doneField = `${item}_done` as DeathReviewDoneKey;
      const atField = `${item}_at` as DeathReviewAtKey;
      const byField = `${item}_by` as DeathReviewByKey;
      const updates: DeathReviewUpdate = {
        [doneField]: done,
        [atField]: done ? now : null,
        [byField]: done ? byName : null,
      };

      // IMPORTANT: do NOT auto-set completed_at here, even if every checklist
      // item is now done. Completion (and the consequent removal of the bed
      // ribbon) only happens when the user explicitly confirms deallocation
      // at the end of the farewell flow — mirroring the way alta/transferência
      // only frees the bed when the user presses "Confirmar".
      const { data, error } = await supabase
        .from("death_reviews")
        .update(updates)
        .eq("id", review.id)
        .select()
        .single();
      if (error) {
        console.error("Failed to update death review", error);
        throw error;
      }

      if (data) {
        const updatedReview = data as unknown as DeathReview;
        setReviews((current) => {
          const exists = current.some((r) => r.id === updatedReview.id);
          if (updatedReview.completed_at) {
            return current.filter((r) => r.id !== updatedReview.id);
          }
          if (!exists) return [updatedReview, ...current];
          return current.map((r) => (r.id === updatedReview.id ? updatedReview : r));
        });
      }
      await fetchReviews();
      return data as unknown as DeathReview;
    },
    [fetchReviews]
  );

  /**
   * Mark a review as fully completed. This is the canonical "deallocate bed"
   * step — it sets completed_at on the review, which removes the ÓBITO•REVISAR
   * ribbon from the bed and frees it visually. Should be called only AFTER
   * the user confirms via the farewell action button.
   */
  const completeReview = useCallback(
    async (review: DeathReview) => {
      const now = new Date().toISOString();
      const { data, error } = await supabase
        .from("death_reviews")
        .update({ completed_at: now })
        .eq("id", review.id)
        .select()
        .single();
      if (error) {
        console.error("Failed to complete death review", error);
        throw error;
      }
      setReviews((current) => current.filter((r) => r.id !== review.id));
      await fetchReviews();
      return data as unknown as DeathReview;
    },
    [fetchReviews]
  );

  return {
    reviews,
    pendingCount: reviews.length,
    isLoading,
    createReview,
    toggleItem,
    completeReview,
    refetch: fetchReviews,
    getReviewForBed: (bed: string, dept?: string) =>
      reviews.find(
        (r) => r.patient_bed === bed && (!dept || r.department === dept)
      ),
  };
}
