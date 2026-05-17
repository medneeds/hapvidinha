UPDATE public.patients
SET display_order = CAST(SUBSTRING(bed_number FROM 2) AS INTEGER)
WHERE department = 'UTI'
  AND bed_number ~ '^U(0[1-9]|10)$';