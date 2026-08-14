CREATE TABLE public.examinus_ai_queries (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  hospital_unit_id UUID REFERENCES public.hospital_units(id) ON DELETE SET NULL,
  department TEXT,
  patient_id UUID,
  patient_bed TEXT,
  mode TEXT NOT NULL,
  prompt TEXT NOT NULL,
  clinical_context TEXT,
  response TEXT NOT NULL,
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_by_name TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX idx_examinus_ai_queries_patient ON public.examinus_ai_queries (patient_id, created_at DESC);
CREATE INDEX idx_examinus_ai_queries_unit ON public.examinus_ai_queries (hospital_unit_id, created_at DESC);

GRANT SELECT, INSERT ON public.examinus_ai_queries TO authenticated;
GRANT ALL ON public.examinus_ai_queries TO service_role;

ALTER TABLE public.examinus_ai_queries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Clinical staff can view examinus queries"
ON public.examinus_ai_queries FOR SELECT TO authenticated
USING (public.is_clinical_staff(auth.uid()));

CREATE POLICY "Users can insert their own examinus queries"
ON public.examinus_ai_queries FOR INSERT TO authenticated
WITH CHECK (auth.uid() = created_by AND public.is_clinical_staff(auth.uid()));