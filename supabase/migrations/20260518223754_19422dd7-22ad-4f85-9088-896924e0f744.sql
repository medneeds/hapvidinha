-- Protect fixed Urgência observation beds (V01-V07 / A01-A06 / Z01-Z06) from DELETE
-- and from bed_number/sector mutation. Mirror of protect_fixed_uti_beds.
CREATE OR REPLACE FUNCTION public.protect_fixed_urgencia_beds()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $function$
BEGIN
  IF OLD.department <> 'UTI'
     AND (
       (OLD.sector = 'red'    AND OLD.bed_number ~ '^V0[1-7]$') OR
       (OLD.sector = 'yellow' AND OLD.bed_number ~ '^A0[1-6]$') OR
       (OLD.sector = 'blue'   AND OLD.bed_number ~ '^Z0[1-6]$')
     ) THEN
    IF TG_OP = 'DELETE' THEN
      RAISE EXCEPTION 'Leitos fixos da Urgência (V01-V07/A01-A06/Z01-Z06) não podem ser excluídos; libere como vago.';
    END IF;

    IF TG_OP = 'UPDATE' THEN
      IF NEW.department IS DISTINCT FROM OLD.department
         OR NEW.sector IS DISTINCT FROM OLD.sector
         OR NEW.bed_number IS DISTINCT FROM OLD.bed_number THEN
        RAISE EXCEPTION 'Número/setor de leitos fixos da Urgência não podem ser alterados; use realocação por leito vago.';
      END IF;
    END IF;
  END IF;

  RETURN COALESCE(NEW, OLD);
END;
$function$;

DROP TRIGGER IF EXISTS trg_protect_fixed_urgencia_beds ON public.patients;
CREATE TRIGGER trg_protect_fixed_urgencia_beds
BEFORE DELETE OR UPDATE ON public.patients
FOR EACH ROW
EXECUTE FUNCTION public.protect_fixed_urgencia_beds();

-- Also ensure UTI trigger is attached (defensive, in case it was dropped)
DROP TRIGGER IF EXISTS trg_protect_fixed_uti_beds ON public.patients;
CREATE TRIGGER trg_protect_fixed_uti_beds
BEFORE DELETE OR UPDATE ON public.patients
FOR EACH ROW
EXECUTE FUNCTION public.protect_fixed_uti_beds();