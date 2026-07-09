CREATE OR REPLACE FUNCTION public.protect_fixed_urgencia_beds()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
BEGIN
  IF OLD.department <> 'UTI'
     AND (
       (OLD.sector = 'red'    AND OLD.bed_number ~ '^V0[1-2]$') OR
       (OLD.sector = 'yellow' AND OLD.bed_number ~ '^A0[1-6]$') OR
       (OLD.sector = 'blue'   AND OLD.bed_number ~ '^Z0[1-6]$')
     ) THEN
    IF TG_OP = 'DELETE' THEN
      IF COALESCE(OLD.is_vacant, false) = true THEN
        RETURN OLD;
      END IF;
      RAISE EXCEPTION 'Leitos fixos da Urgência (V/A/Z) ocupados não podem ser excluídos; libere como vago.';
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