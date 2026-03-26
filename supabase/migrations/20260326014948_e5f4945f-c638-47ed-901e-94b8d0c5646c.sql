
-- Remove old test protocols that were linked to wrong department patients
DELETE FROM sepsis_protocols WHERE patient_id IN (
  'cae1e145-ad4b-4bfd-9642-52d6d8c0193c',
  '5739128e-d8fd-4d76-9723-139ced224811',
  'aaaaaaaa-bbbb-cccc-dddd-eeeeeeee0001'
);

-- Remove fictional test patient
DELETE FROM patients WHERE id = 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeee0001';

-- Insert sepsis protocol for JOSE AUGUSTO MONTEIRO (yellow A01 - ADULTO)
INSERT INTO sepsis_protocols (
  patient_id, patient_name, hospital_unit_id, state_id,
  opening_date, opening_time,
  sirs_temp_high, sirs_heart_rate,
  has_infection, has_organic_dysfunction,
  created_by
) VALUES (
  '9e0200b5-bdd8-408b-9369-d4995b36ea57',
  'JOSE AUGUSTO MONTEIRO',
  'c6363372-65c0-4dd2-955c-7cd3bfa23dd3',
  'c286ecc8-c509-4f90-b3cd-0cf68efd3733',
  CURRENT_DATE, CURRENT_TIME,
  true, true,
  true, true,
  'e6fc50f9-4e4a-4586-82bc-d414fb2ec98a'
);

-- Insert sepsis protocol for LIVIA MARIA REGO SANTOS (blue F07 - ADULTO) with HC+ATB
INSERT INTO sepsis_protocols (
  patient_id, patient_name, hospital_unit_id, state_id,
  opening_date, opening_time,
  sirs_temp_high, sirs_respiratory_rate,
  has_infection, has_organic_dysfunction,
  focus_urinary,
  blood_culture_date, blood_culture_time,
  antibiotic_prescription_date, antibiotic_prescription_time,
  created_by
) VALUES (
  '8d033576-fcdc-4f61-9a80-03df79a2d193',
  'LIVIA MARIA REGO SANTOS',
  'c6363372-65c0-4dd2-955c-7cd3bfa23dd3',
  'c286ecc8-c509-4f90-b3cd-0cf68efd3733',
  CURRENT_DATE, CURRENT_TIME,
  true, true,
  true, true,
  true,
  CURRENT_DATE, CURRENT_TIME,
  CURRENT_DATE, CURRENT_TIME,
  'e6fc50f9-4e4a-4586-82bc-d414fb2ec98a'
);
