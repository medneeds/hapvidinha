-- Death review tracking table
CREATE TABLE public.death_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_movement_id UUID,
  patient_name TEXT NOT NULL,
  patient_bed TEXT NOT NULL,
  patient_sector TEXT,
  department TEXT NOT NULL DEFAULT 'URGÊNCIA E EMERGÊNCIA ADULTO',
  state_id UUID NOT NULL,
  hospital_unit_id UUID NOT NULL,

  death_certificate_done BOOLEAN NOT NULL DEFAULT false,
  death_certificate_at TIMESTAMP WITH TIME ZONE,
  death_certificate_by TEXT,

  family_notified_done BOOLEAN NOT NULL DEFAULT false,
  family_notified_at TIMESTAMP WITH TIME ZONE,
  family_notified_by TEXT,

  belongings_removal_done BOOLEAN NOT NULL DEFAULT false,
  belongings_removal_at TIMESTAMP WITH TIME ZONE,
  belongings_removal_by TEXT,

  chart_finalized_done BOOLEAN NOT NULL DEFAULT false,
  chart_finalized_at TIMESTAMP WITH TIME ZONE,
  chart_finalized_by TEXT,

  completed_at TIMESTAMP WITH TIME ZONE,
  notes TEXT,

  created_by UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX idx_death_reviews_pending
  ON public.death_reviews (hospital_unit_id, state_id, department, completed_at)
  WHERE completed_at IS NULL;

CREATE INDEX idx_death_reviews_bed
  ON public.death_reviews (hospital_unit_id, state_id, department, patient_bed);

ALTER TABLE public.death_reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Auth users can view death reviews"
  ON public.death_reviews FOR SELECT
  TO authenticated
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Auth users can create death reviews"
  ON public.death_reviews FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Auth users can update death reviews"
  ON public.death_reviews FOR UPDATE
  TO authenticated
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Admins can delete death reviews"
  ON public.death_reviews FOR DELETE
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER trg_death_reviews_updated_at
  BEFORE UPDATE ON public.death_reviews
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER trg_death_reviews_audit
  AFTER INSERT OR UPDATE OR DELETE ON public.death_reviews
  FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_function();

ALTER PUBLICATION supabase_realtime ADD TABLE public.death_reviews;