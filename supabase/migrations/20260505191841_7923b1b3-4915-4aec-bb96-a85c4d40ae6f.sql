ALTER TABLE public.patients
ADD COLUMN IF NOT EXISTS bed_status text NOT NULL DEFAULT 'available',
ADD COLUMN IF NOT EXISTS bed_maintenance_reason text,
ADD COLUMN IF NOT EXISTS bed_maintenance_started_at timestamp with time zone,
ADD COLUMN IF NOT EXISTS bed_maintenance_started_by uuid;

CREATE INDEX IF NOT EXISTS idx_patients_bed_status
ON public.patients (hospital_unit_id, state_id, department, sector, bed_status);

COMMENT ON COLUMN public.patients.bed_status IS 'Operational status for the bed slot: available or maintenance.';
COMMENT ON COLUMN public.patients.bed_maintenance_reason IS 'Reason registered when a bed is blocked for maintenance.';
COMMENT ON COLUMN public.patients.bed_maintenance_started_at IS 'Timestamp when bed maintenance block started.';
COMMENT ON COLUMN public.patients.bed_maintenance_started_by IS 'User who registered the bed maintenance block.';