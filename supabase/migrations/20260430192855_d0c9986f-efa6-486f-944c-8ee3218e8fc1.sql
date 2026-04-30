ALTER TABLE public.sepsis_protocols
  DROP CONSTRAINT sepsis_protocols_patient_id_fkey;

ALTER TABLE public.sepsis_protocols
  ADD CONSTRAINT sepsis_protocols_patient_id_fkey
  FOREIGN KEY (patient_id) REFERENCES public.patients(id) ON DELETE SET NULL;