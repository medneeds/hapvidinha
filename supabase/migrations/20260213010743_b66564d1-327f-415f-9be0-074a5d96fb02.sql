
-- Create institution_branding table for white-label support
CREATE TABLE public.institution_branding (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  hospital_unit_id UUID NOT NULL UNIQUE REFERENCES public.hospital_units(id) ON DELETE CASCADE,
  abbreviation TEXT NOT NULL,
  logo_url TEXT,
  primary_color TEXT DEFAULT '221 83% 53%',
  accent_color TEXT DEFAULT '262 83% 58%',
  secondary_color TEXT DEFAULT '210 40% 96%',
  tagline TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.institution_branding ENABLE ROW LEVEL SECURITY;

-- Public read access (needed for login/branding)
CREATE POLICY "Anyone can view institution branding"
ON public.institution_branding
FOR SELECT
USING (true);

-- Only admins can manage branding
CREATE POLICY "Admins can manage institution branding"
ON public.institution_branding
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Trigger for updated_at
CREATE TRIGGER update_institution_branding_updated_at
BEFORE UPDATE ON public.institution_branding
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
