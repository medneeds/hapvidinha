-- Closes a UTI transfer request that is waiting for allocation (sent by mistake or filled in wrong).
-- The waiting row leaves the list and the original movement is kept, marked as cancelled, for the audit trail.
CREATE OR REPLACE FUNCTION public.cancel_uti_transit_patient(
  p_transit_id uuid,
  p_reason text DEFAULT NULL
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_uid uuid := auth.uid();
  src public.patients%ROWTYPE;
  v_reason text := NULLIF(upper(trim(COALESCE(p_reason, ''))), '');
BEGIN
  IF v_uid IS NULL OR NOT (public.has_role(v_uid, 'medico') OR public.has_role(v_uid, 'admin')) THEN
    RAISE EXCEPTION 'Apenas médicos ou administradores podem encerrar pedidos de transferência.';
  END IF;

  SELECT * INTO src FROM public.patients WHERE id = p_transit_id FOR UPDATE;
  IF NOT FOUND OR src.department <> 'UTI' OR src.sector <> 'outside' OR src.transit_target_unit IS NULL THEN
    RAISE EXCEPTION 'Paciente em trânsito não encontrado (talvez já tenha sido alocado ou encerrado).';
  END IF;

  IF src.transit_movement_id IS NOT NULL THEN
    UPDATE public.patient_movements
      SET destination = src.transit_target_unit || ' – TRANSFERÊNCIA CANCELADA',
          notes = concat_ws(' | ', NULLIF(trim(COALESCE(notes, '')), ''), 'ENCERRADO NA ESPERA DA UTI' || COALESCE(': ' || v_reason, ''))
      WHERE id = src.transit_movement_id;
  END IF;

  DELETE FROM public.patients WHERE id = src.id;

  RETURN jsonb_build_object('cancelled_id', src.id, 'name', src.name, 'target_unit', src.transit_target_unit);
END;
$$;

REVOKE ALL ON FUNCTION public.cancel_uti_transit_patient(uuid, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.cancel_uti_transit_patient(uuid, text) TO authenticated;