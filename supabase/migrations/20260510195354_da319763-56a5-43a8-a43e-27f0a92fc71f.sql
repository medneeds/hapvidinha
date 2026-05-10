
-- 1) Novas categorias de usuário
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'hotelaria';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'condutor';

-- 2) managed_beds
CREATE TABLE public.managed_beds (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  hospital_unit_id uuid NOT NULL,
  state_id uuid NOT NULL,
  sector text NOT NULL,
  bed_number text NOT NULL,
  bed_type text NOT NULL DEFAULT 'enfermaria',
  current_status text NOT NULL DEFAULT 'available',
  current_patient_name text,
  current_patient_id uuid,
  current_cycle_id uuid,
  status_changed_at timestamptz NOT NULL DEFAULT now(),
  is_blocked boolean NOT NULL DEFAULT false,
  block_reason text,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid,
  UNIQUE (hospital_unit_id, sector, bed_number)
);

ALTER TABLE public.managed_beds ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Auth can view managed beds"
  ON public.managed_beds FOR SELECT
  TO authenticated USING (auth.uid() IS NOT NULL);

CREATE POLICY "Admins/gestao manage beds"
  ON public.managed_beds FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Auth can update bed status"
  ON public.managed_beds FOR UPDATE
  TO authenticated USING (auth.uid() IS NOT NULL);

CREATE TRIGGER update_managed_beds_updated_at
  BEFORE UPDATE ON public.managed_beds
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 3) bed_sla_configs
CREATE TABLE public.bed_sla_configs (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  hospital_unit_id uuid NOT NULL,
  state_id uuid NOT NULL,
  sector text NOT NULL,
  stage text NOT NULL,
  sla_minutes integer NOT NULL DEFAULT 60,
  warning_pct integer NOT NULL DEFAULT 80,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (hospital_unit_id, sector, stage)
);

ALTER TABLE public.bed_sla_configs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Auth can view sla"
  ON public.bed_sla_configs FOR SELECT
  TO authenticated USING (auth.uid() IS NOT NULL);

CREATE POLICY "Admins manage sla"
  ON public.bed_sla_configs FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER update_bed_sla_configs_updated_at
  BEFORE UPDATE ON public.bed_sla_configs
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 4) bed_requests
CREATE TABLE public.bed_requests (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  hospital_unit_id uuid NOT NULL,
  state_id uuid NOT NULL,
  request_type text NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  priority text NOT NULL DEFAULT 'normal',
  patient_name text NOT NULL,
  patient_age text,
  patient_id uuid,
  origin_sector text,
  origin_bed text,
  destination_sector text,
  destination_bed text,
  target_bed_id uuid REFERENCES public.managed_beds(id) ON DELETE SET NULL,
  clinical_summary text,
  notes text,
  requested_by uuid,
  requested_by_name text,
  accepted_by uuid,
  accepted_by_name text,
  accepted_at timestamptz,
  started_at timestamptz,
  completed_at timestamptz,
  cancelled_at timestamptz,
  cancellation_reason text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.bed_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Auth can view bed requests"
  ON public.bed_requests FOR SELECT
  TO authenticated USING (auth.uid() IS NOT NULL);

CREATE POLICY "Auth can create bed requests"
  ON public.bed_requests FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = requested_by);

CREATE POLICY "Auth can update bed requests"
  ON public.bed_requests FOR UPDATE
  TO authenticated USING (auth.uid() IS NOT NULL);

CREATE POLICY "Admins delete bed requests"
  ON public.bed_requests FOR DELETE
  TO authenticated USING (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER update_bed_requests_updated_at
  BEFORE UPDATE ON public.bed_requests
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 5) transport_assignments
CREATE TABLE public.transport_assignments (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  request_id uuid NOT NULL REFERENCES public.bed_requests(id) ON DELETE CASCADE,
  conductor_user_id uuid,
  conductor_name text,
  status text NOT NULL DEFAULT 'pending',
  acknowledged_at timestamptz,
  started_at timestamptz,
  finished_at timestamptz,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.transport_assignments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Auth view transport"
  ON public.transport_assignments FOR SELECT
  TO authenticated USING (auth.uid() IS NOT NULL);

CREATE POLICY "Auth create transport"
  ON public.transport_assignments FOR INSERT
  TO authenticated WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Auth update transport"
  ON public.transport_assignments FOR UPDATE
  TO authenticated USING (auth.uid() IS NOT NULL);

CREATE POLICY "Admins delete transport"
  ON public.transport_assignments FOR DELETE
  TO authenticated USING (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER update_transport_assignments_updated_at
  BEFORE UPDATE ON public.transport_assignments
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 6) Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.managed_beds;
ALTER PUBLICATION supabase_realtime ADD TABLE public.bed_requests;
ALTER PUBLICATION supabase_realtime ADD TABLE public.transport_assignments;
ALTER TABLE public.managed_beds REPLICA IDENTITY FULL;
ALTER TABLE public.bed_requests REPLICA IDENTITY FULL;
ALTER TABLE public.transport_assignments REPLICA IDENTITY FULL;
