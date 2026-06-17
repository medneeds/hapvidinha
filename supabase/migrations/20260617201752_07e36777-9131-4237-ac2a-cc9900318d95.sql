
INSERT INTO public.patients (bed_number, sector, name, is_vacant, bed_status, display_order, department, state_id, hospital_unit_id)
SELECT bed, sector, '', true, 'available', ord, 'UTI',
       'c286ecc8-c509-4f90-b3cd-0cf68efd3733'::uuid,
       'c6363372-65c0-4dd2-955c-7cd3bfa23dd3'::uuid
FROM (
  SELECT bed, sector, ord FROM (
    VALUES
      ('U01',1),('U02',2),('U03',3),('U04',4),('U05',5),
      ('U06',6),('U07',7),('U08',8),('U09',9),('U10',10)
  ) AS b(bed, ord)
  CROSS JOIN (VALUES ('blue'),('yellow')) AS s(sector)
) src
WHERE NOT EXISTS (
  SELECT 1 FROM public.patients p
  WHERE p.hospital_unit_id = 'c6363372-65c0-4dd2-955c-7cd3bfa23dd3'::uuid
    AND p.state_id = 'c286ecc8-c509-4f90-b3cd-0cf68efd3733'::uuid
    AND p.department = 'UTI'
    AND p.sector = src.sector
    AND p.bed_number = src.bed
);
