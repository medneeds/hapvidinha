
CREATE TABLE public.patient_evolutions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  patient_id UUID NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_by UUID,
  created_by_email TEXT,
  hospital_unit_id UUID NOT NULL REFERENCES public.hospital_units(id),
  state_id UUID NOT NULL REFERENCES public.states(id),
  department TEXT NOT NULL DEFAULT 'URGÊNCIA E EMERGÊNCIA ADULTO',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.patient_evolutions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view evolutions"
  ON public.patient_evolutions FOR SELECT
  TO authenticated
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can create evolutions"
  ON public.patient_evolutions FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Admins can delete evolutions"
  ON public.patient_evolutions FOR DELETE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));
