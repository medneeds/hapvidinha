
ALTER TABLE public.bed_allocation_requests
  ADD COLUMN IF NOT EXISTS sequence_number BIGSERIAL,
  ADD COLUMN IF NOT EXISTS patient_name TEXT,
  ADD COLUMN IF NOT EXISTS requesting_sector TEXT,
  ADD COLUMN IF NOT EXISTS diagnosis TEXT,
  ADD COLUMN IF NOT EXISTS is_isolation BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS accommodation_type TEXT,
  ADD COLUMN IF NOT EXISTS hotelaria_requested_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS hotelaria_released_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS hotelaria_released_by TEXT,
  ADD COLUMN IF NOT EXISTS bed_released_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS bed_released_by TEXT,
  ADD COLUMN IF NOT EXISTS transfer_started_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS transfer_completed_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS non_compliance_reason TEXT;

CREATE INDEX IF NOT EXISTS idx_bed_alloc_req_unit_date ON public.bed_allocation_requests (hospital_unit_id, created_at DESC);
