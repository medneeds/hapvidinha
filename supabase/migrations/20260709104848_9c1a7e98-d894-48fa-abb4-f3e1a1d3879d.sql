
CREATE TABLE public.uti_priorities (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  patient_id UUID NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
  hospital_unit_id UUID NOT NULL,
  state_id UUID NOT NULL,
  position INTEGER NOT NULL DEFAULT 0,
  notes TEXT,
  added_by UUID,
  added_by_email TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT uti_priorities_unique_patient UNIQUE (hospital_unit_id, state_id, patient_id)
);

CREATE INDEX idx_uti_priorities_scope ON public.uti_priorities (hospital_unit_id, state_id, position);
CREATE INDEX idx_uti_priorities_patient ON public.uti_priorities (patient_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.uti_priorities TO authenticated;
GRANT ALL ON public.uti_priorities TO service_role;

ALTER TABLE public.uti_priorities ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuários autenticados visualizam prioridades UTI"
  ON public.uti_priorities FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Usuários autenticados criam prioridades UTI"
  ON public.uti_priorities FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Usuários autenticados atualizam prioridades UTI"
  ON public.uti_priorities FOR UPDATE
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Usuários autenticados removem prioridades UTI"
  ON public.uti_priorities FOR DELETE
  USING (auth.uid() IS NOT NULL);

CREATE TRIGGER trg_uti_priorities_updated_at
  BEFORE UPDATE ON public.uti_priorities
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Auto-remove from queue when the patient becomes vacant or loses internment status
CREATE OR REPLACE FUNCTION public.cleanup_uti_priorities_on_patient_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF (COALESCE(NEW.is_vacant, false) = true AND COALESCE(OLD.is_vacant, false) = false)
     OR (NEW.internment_status IS NULL AND OLD.internment_status IS NOT NULL) THEN
    DELETE FROM public.uti_priorities WHERE patient_id = NEW.id;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_cleanup_uti_priorities
  AFTER UPDATE ON public.patients
  FOR EACH ROW EXECUTE FUNCTION public.cleanup_uti_priorities_on_patient_change();
