ALTER TABLE public.patients
DROP CONSTRAINT IF EXISTS patients_internment_status_check;

ALTER TABLE public.patients
ADD CONSTRAINT patients_internment_status_check
CHECK (
  internment_status IS NULL OR internment_status = ANY (ARRAY[
    'SOLICITACAO_PENDENTE'::text,
    'PSM_FAVORAVEL'::text,
    'AGUARDANDO_VAGA'::text,
    'IR_PARA_UTI'::text,
    'IR_PARA_ENFERMARIA'::text
  ])
);