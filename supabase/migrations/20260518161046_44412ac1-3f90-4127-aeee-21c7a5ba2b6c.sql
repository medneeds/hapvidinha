
DELETE FROM public.patients
WHERE department = 'UTI'
  AND bed_number !~ '^U(0[1-9]|10)$';

UPDATE public.patients
SET is_vacant = true, bed_status = 'available', name = ''
WHERE department = 'UTI'
  AND bed_number ~ '^U(0[1-9]|10)$'
  AND (name IS NULL OR trim(name) = '')
  AND is_vacant = false;
