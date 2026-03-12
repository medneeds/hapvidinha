ALTER TABLE public.patient_evolutions ADD COLUMN IF NOT EXISTS suspended boolean NOT NULL DEFAULT false;
ALTER TABLE public.patient_evolutions ADD COLUMN IF NOT EXISTS suspended_at timestamp with time zone;
ALTER TABLE public.patient_evolutions ADD COLUMN IF NOT EXISTS suspended_by text;