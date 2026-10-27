-- Atomic transfer of an Emergency (UE) patient into a vacant UTI bed.
-- Copies the clinical record, frees the UE bed and logs the movement in one transaction.
CREATE OR REPLACE FUNCTION public.transfer_patient_to_uti(
  p_source_id uuid,
  p_target_id uuid,
  p_origin_label text,
  p_destination_label text,
  p_delete_source boolean DEFAULT false,
  p_snapshot jsonb DEFAULT NULL,
  p_notes text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_uid uuid := auth.uid();
  src public.patients%ROWTYPE;
  tgt public.patients%ROWTYPE;
  v_uti_admission timestamptz;
BEGIN
  IF v_uid IS NULL OR NOT (public.has_role(v_uid, 'medico') OR public.has_role(v_uid, 'admin')) THEN
    RAISE EXCEPTION 'Apenas médicos ou administradores podem transferir pacientes para a UTI.';
  END IF;

  SELECT * INTO src FROM public.patients WHERE id = p_source_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Paciente de origem não encontrado.';
  END IF;
  IF src.department = 'UTI' THEN
    RAISE EXCEPTION 'O paciente já está na UTI.';
  END IF;
  IF COALESCE(src.is_vacant, false) OR COALESCE(trim(src.name), '') = '' THEN
    RAISE EXCEPTION 'O leito de origem não tem paciente para transferir.';
  END IF;

  SELECT * INTO tgt FROM public.patients WHERE id = p_target_id FOR UPDATE;
  IF NOT FOUND OR tgt.department <> 'UTI' THEN
    RAISE EXCEPTION 'Leito de UTI não encontrado.';
  END IF;
  IF tgt.hospital_unit_id <> src.hospital_unit_id OR tgt.state_id <> src.state_id THEN
    RAISE EXCEPTION 'O leito de UTI pertence a outra unidade.';
  END IF;
  IF NOT COALESCE(tgt.is_vacant, false) OR COALESCE(tgt.bed_status, 'available') = 'maintenance' THEN
    RAISE EXCEPTION 'O leito % não está mais vago. Escolha outro leito.', tgt.bed_number;
  END IF;

  -- UTI admission = today (Brazil), stored at noon UTC like the rest of the app
  v_uti_admission := (((now() AT TIME ZONE 'America/Sao_Paulo')::date)::timestamp + interval '12 hours') AT TIME ZONE 'UTC';

  UPDATE public.patients SET
    name = src.name,
    age = src.age,
    birth_date = src.birth_date,
    diagnoses = src.diagnoses,
    medical_history = src.medical_history,
    relevant_exams = src.relevant_exams,
    pendencies = src.pendencies,
    uti_daily_conducts = src.uti_daily_conducts,
    highlighted_diagnoses = COALESCE(src.highlighted_diagnoses, '{}'),
    highlighted_medical_history = COALESCE(src.highlighted_medical_history, '{}'),
    highlighted_pendencies = COALESCE(src.highlighted_pendencies, '{}'),
    highlighted_conducts = COALESCE(src.highlighted_conducts, '{}'),
    admission_history = src.admission_history,
    medical_record_number = src.medical_record_number,
    attendance_number = src.attendance_number,
    cpf = src.cpf,
    mother_name = src.mother_name,
    insurance_company = src.insurance_company,
    insurance_plan = src.insurance_plan,
    insurance_plan_type = src.insurance_plan_type,
    insurance_card_number = src.insurance_card_number,
    insurance_duration = src.insurance_duration,
    uti_admission_date = v_uti_admission,
    uti_origin_sector = NULLIF(trim(p_origin_label), ''),
    uti_discharge_prediction = NULL,
    uti_allergies = NULL,
    uti_admission_reason = NULL,
    uti_current_status = NULL,
    uti_devices = NULL,
    uti_cultures_antibiotics = NULL,
    uti_specialties = NULL,
    schedule = NULL,
    admission_date = NULL,
    medical_responsibility = NULL,
    internment_status = NULL,
    internment_notes = NULL,
    allocation_status = NULL,
    psm_status = NULL,
    clinical_status = NULL,
    patient_category = NULL,
    is_door_patient = false,
    is_vacant = false,
    bed_status = 'available',
    bed_maintenance_reason = NULL,
    bed_maintenance_started_at = NULL,
    bed_maintenance_started_by = NULL
  WHERE id = tgt.id;

  INSERT INTO public.patient_movements (
    patient_id, patient_name, patient_bed, patient_sector, movement_type,
    destination, notes, created_by, patient_snapshot, department, state_id, hospital_unit_id
  ) VALUES (
    src.id, src.name, src.bed_number, src.sector, 'TRANSFERÊNCIA',
    p_destination_label, NULLIF(trim(p_notes), ''), v_uid, COALESCE(p_snapshot, to_jsonb(src)),
    src.department, src.state_id, src.hospital_unit_id
  );

  IF p_delete_source THEN
    DELETE FROM public.patients WHERE id = src.id;
  ELSE
    UPDATE public.patients SET
      name = '', age = NULL, birth_date = NULL,
      diagnoses = NULL, medical_history = NULL, relevant_exams = NULL, pendencies = NULL,
      schedule = NULL, admission_history = NULL, admission_date = NULL,
      medical_responsibility = NULL, internment_status = NULL, internment_notes = NULL,
      is_door_patient = false, allocation_status = NULL, psm_status = NULL, clinical_status = NULL,
      patient_category = NULL, medical_record_number = NULL, attendance_number = NULL, cpf = NULL,
      mother_name = NULL, insurance_company = NULL, insurance_plan = NULL, insurance_plan_type = NULL,
      insurance_card_number = NULL, insurance_duration = NULL,
      highlighted_pendencies = '{}', highlighted_diagnoses = '{}', highlighted_medical_history = '{}', highlighted_conducts = '{}',
      uti_admission_date = NULL, uti_discharge_prediction = NULL, uti_allergies = NULL, uti_admission_reason = NULL,
      uti_current_status = NULL, uti_devices = NULL, uti_cultures_antibiotics = NULL, uti_specialties = NULL,
      uti_origin_sector = NULL, uti_daily_conducts = NULL,
      is_vacant = true, bed_status = 'available',
      bed_maintenance_reason = NULL, bed_maintenance_started_at = NULL, bed_maintenance_started_by = NULL
    WHERE id = src.id;
  END IF;

  RETURN jsonb_build_object('target_id', tgt.id, 'target_bed', tgt.bed_number);
END;
$function$;

REVOKE ALL ON FUNCTION public.transfer_patient_to_uti(uuid, uuid, text, text, boolean, jsonb, text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.transfer_patient_to_uti(uuid, uuid, text, text, boolean, jsonb, text) FROM anon;
GRANT EXECUTE ON FUNCTION public.transfer_patient_to_uti(uuid, uuid, text, text, boolean, jsonb, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.transfer_patient_to_uti(uuid, uuid, text, text, boolean, jsonb, text) TO service_role;