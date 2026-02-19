
-- Add patient_category column to patients table
ALTER TABLE public.patients 
ADD COLUMN patient_category text DEFAULT NULL;

-- Add comment for documentation
COMMENT ON COLUMN public.patients.patient_category IS 'Patient category: clinico, cirurgico, obstetrico, trauma';
