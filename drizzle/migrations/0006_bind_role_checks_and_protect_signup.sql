CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT _user_id IS NOT NULL
    AND (_user_id = auth.uid() OR COALESCE(auth.role(), '') NOT IN ('anon', 'authenticated'))
    AND EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = _user_id AND role = _role
    )
    AND EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = _user_id AND p.status = 'approved'
    )
$function$;

CREATE OR REPLACE FUNCTION public.is_clinical_staff(_user_id uuid)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT _user_id IS NOT NULL
    AND (_user_id = auth.uid() OR COALESCE(auth.role(), '') NOT IN ('anon', 'authenticated'))
    AND EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = _user_id
        AND role IN ('admin','medico','porta','uti','prescritor','enfermagem','fisioterapia','recepcao')
    )
    AND EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = _user_id AND p.status = 'approved'
    )
$function$;

CREATE OR REPLACE FUNCTION public.is_approved_user(_user_id uuid)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT _user_id IS NOT NULL
    AND (_user_id = auth.uid() OR COALESCE(auth.role(), '') NOT IN ('anon', 'authenticated'))
    AND EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = _user_id AND p.status = 'approved')
    AND EXISTS (SELECT 1 FROM public.user_roles r WHERE r.user_id = _user_id)
$function$;

CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  user_role text;
BEGIN
  INSERT INTO public.profiles (id, full_name, email)
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data->>'full_name',
    CASE
      WHEN NEW.email LIKE '%@sistema.local' THEN NULL
      ELSE NEW.email
    END
  );

  user_role := LOWER(COALESCE(NEW.raw_user_meta_data->>'role', ''));

  -- Only non-administrative professional categories can be self-selected.
  -- Every account starts as 'pending' and roles only take effect after approval.
  -- Admin is NEVER granted at sign-up; unknown values get the least-privileged role.
  IF user_role IN ('medico','porta','prescritor','uti','recepcao','enfermagem','fisioterapia','visitante') THEN
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, user_role::app_role);
  ELSE
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'visitante');
  END IF;

  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.protect_profile_approval_fields()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  -- Server tasks (service role / internal) are not restricted.
  IF COALESCE(auth.role(), '') NOT IN ('anon', 'authenticated') THEN
    RETURN NEW;
  END IF;

  IF public.has_role(auth.uid(), 'admin') THEN
    RETURN NEW;
  END IF;

  IF TG_OP = 'INSERT' THEN
    NEW.status := 'pending';
    NEW.approved_at := NULL;
    NEW.approved_by := NULL;
  ELSE
    NEW.status := OLD.status;
    NEW.approved_at := OLD.approved_at;
    NEW.approved_by := OLD.approved_by;
  END IF;

  RETURN NEW;
END;
$function$;

DROP TRIGGER IF EXISTS protect_profile_approval_fields ON public.profiles;
CREATE TRIGGER protect_profile_approval_fields
  BEFORE INSERT OR UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.protect_profile_approval_fields();