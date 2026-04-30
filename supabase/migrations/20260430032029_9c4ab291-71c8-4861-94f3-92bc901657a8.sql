CREATE UNIQUE INDEX IF NOT EXISTS idx_death_reviews_one_pending_per_bed
ON public.death_reviews (hospital_unit_id, state_id, department, patient_bed)
WHERE completed_at IS NULL;