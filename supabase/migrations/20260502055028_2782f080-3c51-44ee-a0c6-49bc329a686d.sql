-- ============================================
-- PROTOCOLO AVC (Acidente Vascular Cerebral)
-- ============================================
CREATE TABLE public.stroke_protocols (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  
  -- Identificação
  patient_id UUID,
  patient_name TEXT NOT NULL,
  attendance_number TEXT,
  birth_date DATE,
  patient_weight NUMERIC,
  hospital TEXT,
  responsible_name TEXT,
  
  -- Tempos críticos
  last_seen_well_date DATE,
  last_seen_well_time TIME,
  arrival_date DATE,
  arrival_time TIME,
  opening_date DATE,
  opening_time TIME,
  
  -- Cincinnati (FAST)
  cincinnati_facial_droop BOOLEAN DEFAULT false,
  cincinnati_arm_weakness BOOLEAN DEFAULT false,
  cincinnati_speech_abnormal BOOLEAN DEFAULT false,
  
  -- NIHSS (15 itens, 0-42)
  nihss_1a_consciousness INTEGER,
  nihss_1b_questions INTEGER,
  nihss_1c_commands INTEGER,
  nihss_2_gaze INTEGER,
  nihss_3_visual_fields INTEGER,
  nihss_4_facial_palsy INTEGER,
  nihss_5a_left_arm INTEGER,
  nihss_5b_right_arm INTEGER,
  nihss_6a_left_leg INTEGER,
  nihss_6b_right_leg INTEGER,
  nihss_7_ataxia INTEGER,
  nihss_8_sensory INTEGER,
  nihss_9_language INTEGER,
  nihss_10_dysarthria INTEGER,
  nihss_11_extinction INTEGER,
  nihss_total INTEGER,
  
  -- Elegibilidade trombólise
  thrombolysis_eligible BOOLEAN,
  exclusion_age BOOLEAN DEFAULT false,
  exclusion_window BOOLEAN DEFAULT false,
  exclusion_previous_stroke BOOLEAN DEFAULT false,
  exclusion_anticoagulation BOOLEAN DEFAULT false,
  exclusion_bp_high BOOLEAN DEFAULT false,
  exclusion_glucose BOOLEAN DEFAULT false,
  exclusion_platelets_low BOOLEAN DEFAULT false,
  exclusion_inr_high BOOLEAN DEFAULT false,
  exclusion_recent_surgery BOOLEAN DEFAULT false,
  exclusion_active_bleeding BOOLEAN DEFAULT false,
  exclusion_other TEXT,
  
  bp_systolic NUMERIC,
  bp_diastolic NUMERIC,
  glucose NUMERIC,
  platelets NUMERIC,
  inr NUMERIC,
  
  -- Neuroimagem
  ct_date DATE,
  ct_time TIME,
  ct_aspects INTEGER,
  ct_hemorrhage BOOLEAN,
  ct_findings TEXT,
  
  -- Conduta
  conduct TEXT, -- 'trombolise' | 'trombectomia' | 'conservador' | 'contraindicado'
  thrombolysis_drug TEXT, -- 'alteplase' | 'tenecteplase'
  thrombolysis_date DATE,
  thrombolysis_time TIME,
  thrombolysis_dose NUMERIC,
  
  -- Desfecho
  outcome TEXT,
  outcome_date DATE,
  outcome_time TIME,
  destination TEXT,
  destination_date DATE,
  destination_time TIME,
  
  notes TEXT,
  deletion_reason TEXT,
  
  -- Hierarquia
  state_id UUID NOT NULL,
  hospital_unit_id UUID NOT NULL,
  
  created_by UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.stroke_protocols ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Auth users can view stroke protocols"
  ON public.stroke_protocols FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Auth users can create stroke protocols"
  ON public.stroke_protocols FOR INSERT
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Auth users can update stroke protocols"
  ON public.stroke_protocols FOR UPDATE
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Admins can update any stroke protocol"
  ON public.stroke_protocols FOR UPDATE
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Creators can delete only open stroke protocols"
  ON public.stroke_protocols FOR DELETE
  USING ((auth.uid() = created_by) AND (outcome IS NULL));

CREATE POLICY "Admins can delete any stroke protocol"
  ON public.stroke_protocols FOR DELETE
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER update_stroke_protocols_updated_at
  BEFORE UPDATE ON public.stroke_protocols
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX idx_stroke_protocols_patient ON public.stroke_protocols(patient_id);
CREATE INDEX idx_stroke_protocols_unit ON public.stroke_protocols(hospital_unit_id, state_id);
CREATE INDEX idx_stroke_protocols_active ON public.stroke_protocols(patient_id) WHERE outcome IS NULL;

-- ============================================
-- PROTOCOLO DOR TORÁCICA
-- ============================================
CREATE TABLE public.chest_pain_protocols (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  
  -- Identificação
  patient_id UUID,
  patient_name TEXT NOT NULL,
  attendance_number TEXT,
  birth_date DATE,
  patient_weight NUMERIC,
  hospital TEXT,
  responsible_name TEXT,
  
  -- Tempos críticos
  pain_onset_date DATE,
  pain_onset_time TIME,
  arrival_date DATE,
  arrival_time TIME,
  opening_date DATE,
  opening_time TIME,
  
  -- Caracterização da dor
  pain_classification TEXT, -- 'A' | 'B' | 'C' | 'D'
  pain_location TEXT,
  pain_irradiation TEXT,
  pain_duration TEXT,
  pain_triggering_factors TEXT,
  pain_relieving_factors TEXT,
  associated_symptoms TEXT,
  
  -- ECG
  ecg_date DATE,
  ecg_time TIME,
  ecg_st_elevation BOOLEAN DEFAULT false,
  ecg_st_depression BOOLEAN DEFAULT false,
  ecg_new_lbbb BOOLEAN DEFAULT false,
  ecg_t_inversion BOOLEAN DEFAULT false,
  ecg_normal BOOLEAN DEFAULT false,
  ecg_findings TEXT,
  
  -- HEART Score
  heart_history INTEGER,        -- 0-2
  heart_ecg INTEGER,            -- 0-2
  heart_age INTEGER,            -- 0-2
  heart_risk_factors INTEGER,   -- 0-2
  heart_troponin INTEGER,       -- 0-2
  heart_total INTEGER,
  heart_risk_level TEXT,        -- 'baixo' | 'moderado' | 'alto'
  
  -- Troponinas seriadas
  troponin_0h_value NUMERIC,
  troponin_0h_date DATE,
  troponin_0h_time TIME,
  troponin_3h_value NUMERIC,
  troponin_3h_date DATE,
  troponin_3h_time TIME,
  
  -- STEMI
  is_stemi BOOLEAN DEFAULT false,
  killip_class TEXT,            -- 'I' | 'II' | 'III' | 'IV'
  reperfusion_strategy TEXT,    -- 'angioplastia' | 'fibrinolise' | 'conservador'
  fibrinolytic_drug TEXT,
  fibrinolytic_date DATE,
  fibrinolytic_time TIME,
  balloon_date DATE,
  balloon_time TIME,
  
  -- MONABCH (terapia)
  therapy_morphine BOOLEAN DEFAULT false,
  therapy_oxygen BOOLEAN DEFAULT false,
  therapy_nitrate BOOLEAN DEFAULT false,
  therapy_aas BOOLEAN DEFAULT false,
  therapy_betablocker BOOLEAN DEFAULT false,
  therapy_clopidogrel BOOLEAN DEFAULT false,
  therapy_heparin BOOLEAN DEFAULT false,
  therapy_statin BOOLEAN DEFAULT false,
  
  -- Desfecho
  outcome TEXT,
  outcome_date DATE,
  outcome_time TIME,
  destination TEXT,             -- 'hemodinamica' | 'uti' | 'unidade_dor' | 'alta' | 'obito'
  destination_date DATE,
  destination_time TIME,
  
  notes TEXT,
  deletion_reason TEXT,
  
  -- Hierarquia
  state_id UUID NOT NULL,
  hospital_unit_id UUID NOT NULL,
  
  created_by UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.chest_pain_protocols ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Auth users can view chest pain protocols"
  ON public.chest_pain_protocols FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Auth users can create chest pain protocols"
  ON public.chest_pain_protocols FOR INSERT
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Auth users can update chest pain protocols"
  ON public.chest_pain_protocols FOR UPDATE
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Admins can update any chest pain protocol"
  ON public.chest_pain_protocols FOR UPDATE
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Creators can delete only open chest pain protocols"
  ON public.chest_pain_protocols FOR DELETE
  USING ((auth.uid() = created_by) AND (outcome IS NULL));

CREATE POLICY "Admins can delete any chest pain protocol"
  ON public.chest_pain_protocols FOR DELETE
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER update_chest_pain_protocols_updated_at
  BEFORE UPDATE ON public.chest_pain_protocols
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX idx_chest_pain_protocols_patient ON public.chest_pain_protocols(patient_id);
CREATE INDEX idx_chest_pain_protocols_unit ON public.chest_pain_protocols(hospital_unit_id, state_id);
CREATE INDEX idx_chest_pain_protocols_active ON public.chest_pain_protocols(patient_id) WHERE outcome IS NULL;