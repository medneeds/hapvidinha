-- Adicionar papel 'operacional' ao enum app_role
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'operacional';

-- Tabela de chamados de transporte/condutores
CREATE TABLE public.transport_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  hospital_unit_id UUID NOT NULL,
  state_id UUID NOT NULL,
  department TEXT,
  request_type TEXT NOT NULL DEFAULT 'patient', -- 'patient' | 'general'
  patient_id UUID,
  patient_name TEXT,
  patient_bed TEXT,
  origin TEXT NOT NULL,
  destination TEXT NOT NULL,
  description TEXT,
  priority TEXT NOT NULL DEFAULT 'normal', -- 'low' | 'normal' | 'high' | 'urgent'
  status TEXT NOT NULL DEFAULT 'pending', -- 'pending' | 'accepted' | 'in_progress' | 'completed' | 'cancelled'
  requested_by UUID,
  requested_by_name TEXT,
  assigned_to UUID,
  assigned_to_name TEXT,
  accepted_at TIMESTAMP WITH TIME ZONE,
  started_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  cancelled_at TIMESTAMP WITH TIME ZONE,
  cancellation_reason TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.transport_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Auth users can view transport requests"
  ON public.transport_requests FOR SELECT
  TO authenticated
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Auth users can create transport requests"
  ON public.transport_requests FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = requested_by);

CREATE POLICY "Auth users can update transport requests"
  ON public.transport_requests FOR UPDATE
  TO authenticated
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Admins can delete transport requests"
  ON public.transport_requests FOR DELETE
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER update_transport_requests_updated_at
  BEFORE UPDATE ON public.transport_requests
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX idx_transport_requests_status ON public.transport_requests(status);
CREATE INDEX idx_transport_requests_hospital ON public.transport_requests(hospital_unit_id, state_id);
CREATE INDEX idx_transport_requests_assigned ON public.transport_requests(assigned_to);

-- Tabela de eventos do ciclo de vida do leito
CREATE TABLE public.bed_lifecycle_events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  hospital_unit_id UUID NOT NULL,
  state_id UUID NOT NULL,
  department TEXT,
  bed_number TEXT NOT NULL,
  sector TEXT,
  patient_id UUID,
  patient_name TEXT,
  event_type TEXT NOT NULL, -- 'medical_discharge' | 'administrative_discharge' | 'bed_vacated' | 'cleaning_started' | 'cleaning_finished' | 'bed_released' | 'bed_occupied'
  event_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  registered_by UUID,
  registered_by_name TEXT,
  notes TEXT,
  cycle_id UUID, -- agrupa todos os eventos de um mesmo ciclo de giro do leito
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.bed_lifecycle_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Auth users can view bed lifecycle events"
  ON public.bed_lifecycle_events FOR SELECT
  TO authenticated
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Auth users can create bed lifecycle events"
  ON public.bed_lifecycle_events FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = registered_by);

CREATE POLICY "Admins can delete bed lifecycle events"
  ON public.bed_lifecycle_events FOR DELETE
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE INDEX idx_bed_lifecycle_bed ON public.bed_lifecycle_events(hospital_unit_id, state_id, bed_number);
CREATE INDEX idx_bed_lifecycle_cycle ON public.bed_lifecycle_events(cycle_id);
CREATE INDEX idx_bed_lifecycle_event_at ON public.bed_lifecycle_events(event_at DESC);

-- Habilitar realtime
ALTER TABLE public.transport_requests REPLICA IDENTITY FULL;
ALTER TABLE public.bed_lifecycle_events REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.transport_requests;
ALTER PUBLICATION supabase_realtime ADD TABLE public.bed_lifecycle_events;