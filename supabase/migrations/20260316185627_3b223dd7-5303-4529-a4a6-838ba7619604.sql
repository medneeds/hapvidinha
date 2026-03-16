CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  user_role text;
  username text;
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
  
  username := COALESCE(NEW.raw_user_meta_data->>'username', SPLIT_PART(NEW.email, '@', 1));
  user_role := NEW.raw_user_meta_data->>'role';
  
  IF UPPER(username) = 'VISITANTE' THEN
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'visitante');
  ELSIF UPPER(username) = 'MEDICOPORTA' THEN
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'porta');
  ELSIF UPPER(username) = 'MEDICOUTI' THEN
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'medico');
    INSERT INTO public.user_departments (user_id, department) VALUES (NEW.id, 'UTI');
  ELSIF UPPER(username) = 'COORDENADOR' THEN
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'admin');
  ELSIF user_role = 'porta' THEN
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'porta');
  ELSIF user_role = 'visitante' THEN
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'visitante');
  ELSIF user_role = 'admin' THEN
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'admin');
  ELSIF user_role = 'prescritor' THEN
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'prescritor');
  ELSIF user_role = 'uti' THEN
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'uti');
  ELSIF user_role = 'recepcao' THEN
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'recepcao');
  ELSIF user_role = 'enfermagem' THEN
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'enfermagem');
  ELSE
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'medico');
  END IF;
  
  RETURN NEW;
END;
$function$;