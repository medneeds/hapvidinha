ALTER TABLE public.sepsis_protocols
  ADD COLUMN IF NOT EXISTS medical_evaluation_date date,
  ADD COLUMN IF NOT EXISTS medical_evaluation_time time,
  ADD COLUMN IF NOT EXISTS lactate_result text,
  ADD COLUMN IF NOT EXISTS lactate_result_date date,
  ADD COLUMN IF NOT EXISTS lactate_result_time time,
  ADD COLUMN IF NOT EXISTS second_lactate_date date,
  ADD COLUMN IF NOT EXISTS second_lactate_time time,
  ADD COLUMN IF NOT EXISTS second_lactate_result text,
  ADD COLUMN IF NOT EXISTS second_lactate_result_date date,
  ADD COLUMN IF NOT EXISTS second_lactate_result_time time,
  ADD COLUMN IF NOT EXISTS fluid_date date,
  ADD COLUMN IF NOT EXISTS fluid_time time,
  ADD COLUMN IF NOT EXISTS fluid_solution text,
  ADD COLUMN IF NOT EXISTS destination_hospital text;

COMMENT ON COLUMN public.sepsis_protocols.medical_evaluation_date IS 'Ficha de sepse (verso): avaliação médica.';
COMMENT ON COLUMN public.sepsis_protocols.second_lactate_date IS 'Ficha de sepse (verso): coleta do segundo lactato.';
COMMENT ON COLUMN public.sepsis_protocols.fluid_solution IS 'Ficha de sepse (verso): solução da reposição volêmica.';