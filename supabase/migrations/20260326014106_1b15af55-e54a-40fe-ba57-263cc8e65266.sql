ALTER TABLE public.sepsis_protocols 
  ADD COLUMN IF NOT EXISTS antibiotic_administration_date date,
  ADD COLUMN IF NOT EXISTS antibiotic_administration_time time without time zone,
  ADD COLUMN IF NOT EXISTS antibiotic_names text;