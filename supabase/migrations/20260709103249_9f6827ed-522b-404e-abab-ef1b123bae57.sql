CREATE OR REPLACE FUNCTION public.block_removed_urgencia_red_beds()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $$
BEGIN
  IF NEW.department = 'URGÊNCIA E EMERGÊNCIA ADULTO'
     AND NEW.sector = 'red'
     AND NEW.bed_number ~ '^V0[3-7]$' THEN
    RAISE EXCEPTION 'Leitos V03–V07 foram descontinuados na Sala de Cuidados Especiais. Use apenas V01 e V02 ou leitos EXTRA.';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_block_removed_urgencia_red_beds ON public.patients;
CREATE TRIGGER trg_block_removed_urgencia_red_beds
BEFORE INSERT OR UPDATE ON public.patients
FOR EACH ROW EXECUTE FUNCTION public.block_removed_urgencia_red_beds();

DELETE FROM patients WHERE department='URGÊNCIA E EMERGÊNCIA ADULTO' AND sector='red' AND bed_number IN ('V03','V04','V05','V06','V07') AND is_vacant=true;