
CREATE TABLE public.clinicus_access (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL UNIQUE,
  enabled boolean NOT NULL DEFAULT false,
  enabled_by uuid,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.clinicus_access ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage clinicus access"
ON public.clinicus_access
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can view own clinicus access"
ON public.clinicus_access
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE TRIGGER update_clinicus_access_updated_at
BEFORE UPDATE ON public.clinicus_access
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
