ALTER TABLE public.patients
  ADD COLUMN IF NOT EXISTS transit_target_unit text,
  ADD COLUMN IF NOT EXISTS transit_started_at timestamptz,
  ADD COLUMN IF NOT EXISTS transit_movement_id uuid;

COMMENT ON COLUMN public.patients.transit_target_unit IS 'UTI unit (UTI 1 / UTI 2) indicated by the emergency while the patient waits in the UTI transit area (department UTI, sector outside).';

CREATE INDEX IF NOT EXISTS idx_patients_uti_transit
  ON public.patients (hospital_unit_id, state_id)
  WHERE department = 'UTI' AND sector = 'outside';

-- Step 1: emergency sends the patient to the UTI transit area (UE bed is freed at once).
CREATE OR REPLACE FUNCTION public.send_patient_to_uti_transit(
  p_source_id uuid,
  p_target_unit text,
  p_origin_label text,
  p_delete_source boolean DEFAULT false,
  p_snapshot jsonb DEFAULT NULL,
  p_notes text DEFAULT NULL
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_uid uuid := auth.uid();
  src public.patients%ROWTYPE;
  v_next int;
  v_bed text;
  v_new_id uuid;
  v_movement_id uuid;
BEGIN
  IF v_uid IS NULL OR NOT (public.has_role(v_uid, 'medico') OR public.has_role(v_uid, 'admin')) THEN
    RAISE EXCEPTION 'Apenas médicos ou administradores podem transferir pacientes para a UTI.';
  END IF;
  IF p_target_unit NOT IN ('UTI 1', 'UTI 2') THEN
    RAISE EXCEPTION 'Unidade de UTI inválida.';
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

  SELECT COALESCE(MAX((substring(bed_number from '^T(\d+)$'))::int), 0) + 1 INTO v_next
  FROM public.patients
  WHERE department = 'UTI' AND sector = 'outside'
    AND hospital_unit_id = src.hospital_unit_id AND state_id = src.state_id;
  v_bed := 'T' || lpad(v_next::text, 2, '0');

  INSERT INTO public.patients (
    bed_number, sector, department, state_id, hospital_unit_id, display_order,
    name, age, birth_date, diagnoses, medical_history, relevant_exams, pendencies, uti_daily_conducts,
    highlighted_diagnoses, highlighted_medical_history, highlighted_pendencies, highlighted_conducts,
    admission_history, medical_record_number, attendance_number, cpf, mother_name,
    insurance_company, insurance_plan, insurance_plan_type, insurance_card_number, insurance_duration,
    uti_origin_sector, allocation_status, is_door_patient, is_vacant, bed_status,
    transit_target_unit, transit_started_at, created_by
  ) VALUES (
    v_bed, 'outside', 'UTI', src.state_id, src.hospital_unit_id, v_next,
    src.name, src.age, src.birth_date, src.diagnoses, src.medical_history, src.relevant_exams, src.pendencies, src.uti_daily_conducts,
    COALESCE(src.highlighted_diagnoses, '{}'), COALESCE(src.highlighted_medical_history, '{}'),
    COALESCE(src.highlighted_pendencies, '{}'), COALESCE(src.highlighted_conducts, '{}'),
    src.admission_history, src.medical_record_number, src.attendance_number, src.cpf, src.mother_name,
    src.insurance_company, src.insurance_plan, src.insurance_plan_type, src.insurance_card_number, src.insurance_duration,
    NULLIF(trim(p_origin_label), ''), 'pending', false, false, 'available',
    p_target_unit, now(), v_uid
  ) RETURNING id INTO v_new_id;

  INSERT INTO public.patient_movements (
    patient_id, patient_name, patient_bed, patient_sector, movement_type,
    destination, notes, created_by, patient_snapshot, department, state_id, hospital_unit_id
  ) VALUES (
    src.id, src.name, src.bed_number, src.sector, 'TRANSFERÊNCIA',
    p_target_unit || ' – EM TRÂNSITO', NULLIF(trim(p_notes), ''), v_uid, COALESCE(p_snapshot, to_jsonb(src)),
    src.department, src.state_id, src.hospital_unit_id
  ) RETURNING id INTO v_movement_id;

  UPDATE public.patients SET transit_movement_id = v_movement_id WHERE id = v_new_id;

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

  RETURN jsonb_build_object('transit_id', v_new_id, 'transit_bed', v_bed, 'target_unit', p_target_unit);
END;
$$;

-- Step 2: the UTI places the waiting patient in a specific vacant bed.
CREATE OR REPLACE FUNCTION public.allocate_uti_transit_patient(
  p_transit_id uuid,
  p_target_bed_id uuid
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_uid uuid := auth.uid();
  src public.patients%ROWTYPE;
  tgt public.patients%ROWTYPE;
  v_unit text;
  v_uti_admission timestamptz;
BEGIN
  IF v_uid IS NULL OR NOT (public.has_role(v_uid, 'medico') OR public.has_role(v_uid, 'admin')) THEN
    RAISE EXCEPTION 'Apenas médicos ou administradores podem alocar pacientes na UTI.';
  END IF;

  SELECT * INTO src FROM public.patients WHERE id = p_transit_id FOR UPDATE;
  IF NOT FOUND OR src.department <> 'UTI' OR src.sector <> 'outside' OR src.transit_target_unit IS NULL THEN
    RAISE EXCEPTION 'Paciente em trânsito não encontrado (talvez já tenha sido alocado).';
  END IF;

  SELECT * INTO tgt FROM public.patients WHERE id = p_target_bed_id FOR UPDATE;
  IF NOT FOUND OR tgt.department <> 'UTI' OR tgt.sector NOT IN ('blue', 'red', 'yellow') THEN
    RAISE EXCEPTION 'Leito de UTI não encontrado.';
  END IF;
  IF tgt.hospital_unit_id <> src.hospital_unit_id OR tgt.state_id <> src.state_id THEN
    RAISE EXCEPTION 'O leito de UTI pertence a outra unidade.';
  END IF;
  IF NOT COALESCE(tgt.is_vacant, false) OR COALESCE(tgt.bed_status, 'available') = 'maintenance' THEN
    RAISE EXCEPTION 'O leito % não está mais vago. Escolha outro leito.', tgt.bed_number;
  END IF;

  v_unit := CASE WHEN tgt.sector = 'yellow' THEN 'UTI 2' ELSE 'UTI 1' END;
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
    uti_origin_sector = src.uti_origin_sector,
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
    bed_maintenance_started_by = NULL,
    transit_target_unit = NULL,
    transit_started_at = NULL,
    transit_movement_id = NULL
  WHERE id = tgt.id;

  IF src.transit_movement_id IS NOT NULL THEN
    UPDATE public.patient_movements
      SET destination = v_unit || ' – ' || tgt.bed_number
      WHERE id = src.transit_movement_id;
  END IF;

  DELETE FROM public.patients WHERE id = src.id;

  RETURN jsonb_build_object('target_id', tgt.id, 'target_bed', tgt.bed_number, 'unit', v_unit);
END;
$$;

REVOKE ALL ON FUNCTION public.send_patient_to_uti_transit(uuid, text, text, boolean, jsonb, text) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.allocate_uti_transit_patient(uuid, uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.send_patient_to_uti_transit(uuid, text, text, boolean, jsonb, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.allocate_uti_transit_patient(uuid, uuid) TO authenticated;