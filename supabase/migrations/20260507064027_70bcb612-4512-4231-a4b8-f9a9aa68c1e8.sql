ALTER TABLE public.patients
  ADD COLUMN IF NOT EXISTS medical_record_number text,
  ADD COLUMN IF NOT EXISTS attendance_number text,
  ADD COLUMN IF NOT EXISTS cpf text,
  ADD COLUMN IF NOT EXISTS mother_name text,
  ADD COLUMN IF NOT EXISTS insurance_company text,
  ADD COLUMN IF NOT EXISTS insurance_plan text,
  ADD COLUMN IF NOT EXISTS insurance_plan_type text,
  ADD COLUMN IF NOT EXISTS insurance_card_number text,
  ADD COLUMN IF NOT EXISTS insurance_duration text;