
-- ============ CHECKLIST COMPARTILHADO POR UNIDADE ============
CREATE TABLE public.unit_checklist_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  hospital_unit_id UUID NOT NULL,
  state_id UUID NOT NULL,
  department TEXT NOT NULL,
  text TEXT NOT NULL,
  completed BOOLEAN NOT NULL DEFAULT false,
  position INTEGER NOT NULL DEFAULT 0,
  created_by UUID,
  created_by_email TEXT,
  completed_by UUID,
  completed_by_email TEXT,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.unit_checklist_items TO authenticated;
GRANT ALL ON public.unit_checklist_items TO service_role;
ALTER TABLE public.unit_checklist_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated view unit checklist"
  ON public.unit_checklist_items FOR SELECT
  TO authenticated USING (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated insert unit checklist"
  ON public.unit_checklist_items FOR INSERT
  TO authenticated WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated update unit checklist"
  ON public.unit_checklist_items FOR UPDATE
  TO authenticated USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated delete unit checklist"
  ON public.unit_checklist_items FOR DELETE
  TO authenticated USING (auth.uid() IS NOT NULL);

CREATE INDEX idx_unit_checklist_scope
  ON public.unit_checklist_items(hospital_unit_id, state_id, department, position);

CREATE TRIGGER trg_unit_checklist_updated_at
  BEFORE UPDATE ON public.unit_checklist_items
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============ ANOTAÇÕES COMPARTILHADAS POR UNIDADE ============
CREATE TABLE public.unit_shared_notes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  hospital_unit_id UUID NOT NULL,
  state_id UUID NOT NULL,
  department TEXT NOT NULL,
  content TEXT NOT NULL DEFAULT '',
  updated_by UUID,
  updated_by_email TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (hospital_unit_id, state_id, department)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.unit_shared_notes TO authenticated;
GRANT ALL ON public.unit_shared_notes TO service_role;
ALTER TABLE public.unit_shared_notes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated view unit notes"
  ON public.unit_shared_notes FOR SELECT
  TO authenticated USING (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated insert unit notes"
  ON public.unit_shared_notes FOR INSERT
  TO authenticated WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated update unit notes"
  ON public.unit_shared_notes FOR UPDATE
  TO authenticated USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated delete unit notes"
  ON public.unit_shared_notes FOR DELETE
  TO authenticated USING (auth.uid() IS NOT NULL);

CREATE TRIGGER trg_unit_shared_notes_updated_at
  BEFORE UPDATE ON public.unit_shared_notes
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============ CÓDIGOS PERSONALIZADOS POR UNIDADE ============
CREATE TABLE public.custom_medical_codes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  hospital_unit_id UUID NOT NULL,
  state_id UUID NOT NULL,
  category TEXT NOT NULL,
  code TEXT NOT NULL,
  name TEXT NOT NULL,
  system_description TEXT,
  created_by UUID,
  created_by_email TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.custom_medical_codes TO authenticated;
GRANT ALL ON public.custom_medical_codes TO service_role;
ALTER TABLE public.custom_medical_codes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated view custom codes"
  ON public.custom_medical_codes FOR SELECT
  TO authenticated USING (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated insert custom codes"
  ON public.custom_medical_codes FOR INSERT
  TO authenticated WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated update custom codes"
  ON public.custom_medical_codes FOR UPDATE
  TO authenticated USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated delete custom codes"
  ON public.custom_medical_codes FOR DELETE
  TO authenticated USING (auth.uid() IS NOT NULL);

CREATE INDEX idx_custom_medical_codes_scope
  ON public.custom_medical_codes(hospital_unit_id, state_id, category);

CREATE TRIGGER trg_custom_medical_codes_updated_at
  BEFORE UPDATE ON public.custom_medical_codes
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
