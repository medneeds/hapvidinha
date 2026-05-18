CREATE OR REPLACE FUNCTION public.protect_fixed_uti_beds()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF OLD.department = 'UTI'
     AND OLD.sector IN ('blue', 'yellow')
     AND OLD.bed_number ~ '^U(0[1-9]|10)$' THEN
    IF TG_OP = 'DELETE' THEN
      RAISE EXCEPTION 'Leitos fixos da UTI (U01-U10) não podem ser excluídos; libere o leito como vago.';
    END IF;

    IF TG_OP = 'UPDATE' THEN
      IF NEW.department IS DISTINCT FROM OLD.department
         OR NEW.sector IS DISTINCT FROM OLD.sector
         OR NEW.bed_number IS DISTINCT FROM OLD.bed_number THEN
        RAISE EXCEPTION 'Número/setor de leitos fixos da UTI (U01-U10) não podem ser alterados; use realocação por leito vago.';
      END IF;
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS protect_fixed_uti_beds_trigger ON public.patients;

CREATE TRIGGER protect_fixed_uti_beds_trigger
BEFORE UPDATE OR DELETE ON public.patients
FOR EACH ROW
EXECUTE FUNCTION public.protect_fixed_uti_beds();