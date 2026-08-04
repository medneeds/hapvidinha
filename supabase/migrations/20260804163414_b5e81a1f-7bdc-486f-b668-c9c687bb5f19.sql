CREATE TABLE public.sector_bed_capacities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  hospital_unit_id uuid NOT NULL REFERENCES public.hospital_units(id) ON DELETE CASCADE,
  state_id uuid NOT NULL REFERENCES public.states(id) ON DELETE CASCADE,
  department text NOT NULL,
  sector text NOT NULL,
  bed_prefix text NOT NULL,
  fixed_bed_count integer NOT NULL DEFAULT 0 CHECK (fixed_bed_count >= 0 AND fixed_bed_count <= 60),
  updated_by uuid,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE (hospital_unit_id, state_id, department, sector)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.sector_bed_capacities TO authenticated;
GRANT ALL ON public.sector_bed_capacities TO service_role;

ALTER TABLE public.sector_bed_capacities ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can read bed capacities"
ON public.sector_bed_capacities FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admins can insert bed capacities"
ON public.sector_bed_capacities FOR INSERT TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update bed capacities"
ON public.sector_bed_capacities FOR UPDATE TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete bed capacities"
ON public.sector_bed_capacities FOR DELETE TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER trg_sector_bed_capacities_updated_at
BEFORE UPDATE ON public.sector_bed_capacities
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();