
-- Backfill missing fixed-bed placeholders for Urgência observation sectors.
-- Sectors: red (V01-V07), yellow (A01-A06), blue (Z01-Z06)
DO $$
DECLARE
  r RECORD;
  i INTEGER;
  bed_label TEXT;
  prefix TEXT;
  max_n INTEGER;
  sector_key TEXT;
BEGIN
  -- For each (hospital_unit_id, state_id) that already has at least one patient row in the dept,
  -- ensure all fixed slots exist (insert missing as is_vacant=true).
  FOR r IN
    SELECT DISTINCT hospital_unit_id, state_id
    FROM public.patients
    WHERE department = 'URGÊNCIA E EMERGÊNCIA ADULTO'
      AND hospital_unit_id IS NOT NULL
      AND state_id IS NOT NULL
  LOOP
    FOREACH sector_key IN ARRAY ARRAY['red','yellow','blue']
    LOOP
      IF sector_key = 'red' THEN prefix := 'V'; max_n := 7;
      ELSIF sector_key = 'yellow' THEN prefix := 'A'; max_n := 6;
      ELSE prefix := 'Z'; max_n := 6;
      END IF;

      FOR i IN 1..max_n LOOP
        bed_label := prefix || LPAD(i::text, 2, '0');
        IF NOT EXISTS (
          SELECT 1 FROM public.patients
          WHERE hospital_unit_id = r.hospital_unit_id
            AND state_id = r.state_id
            AND department = 'URGÊNCIA E EMERGÊNCIA ADULTO'
            AND sector = sector_key
            AND bed_number = bed_label
        ) THEN
          INSERT INTO public.patients (
            hospital_unit_id, state_id, department,
            sector, bed_number, name, is_vacant
          ) VALUES (
            r.hospital_unit_id, r.state_id, 'URGÊNCIA E EMERGÊNCIA ADULTO',
            sector_key, bed_label, '', true
          );
        END IF;
      END LOOP;
    END LOOP;
  END LOOP;
END$$;
