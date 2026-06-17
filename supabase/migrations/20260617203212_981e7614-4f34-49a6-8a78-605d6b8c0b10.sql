
-- 1) password_reset_requests: drop wide-open insert, replace with restricted (no user_id allowed)
DROP POLICY IF EXISTS "Anyone can request password reset" ON public.password_reset_requests;
CREATE POLICY "Anon can request password reset without user_id"
  ON public.password_reset_requests
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (user_id IS NULL);

-- 2) user_roles: drop self-update privilege escalation
DROP POLICY IF EXISTS "Usuários podem atualizar própria role" ON public.user_roles;

-- 3) medical_codes: admin-only writes
DROP POLICY IF EXISTS "Authenticated users can create medical codes" ON public.medical_codes;
DROP POLICY IF EXISTS "Authenticated users can update medical codes" ON public.medical_codes;
DROP POLICY IF EXISTS "Authenticated users can delete medical codes" ON public.medical_codes;

CREATE POLICY "Only admins can create medical codes"
  ON public.medical_codes FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Only admins can update medical codes"
  ON public.medical_codes FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Only admins can delete medical codes"
  ON public.medical_codes FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role));

-- 4) notes_reminders: scope by owner user_id
DROP POLICY IF EXISTS "Usuários autenticados podem visualizar suas anotações" ON public.notes_reminders;
DROP POLICY IF EXISTS "Usuários autenticados podem criar anotações" ON public.notes_reminders;
DROP POLICY IF EXISTS "Usuários autenticados podem atualizar suas anotações" ON public.notes_reminders;
DROP POLICY IF EXISTS "Usuários autenticados podem deletar suas anotações" ON public.notes_reminders;

CREATE POLICY "Users view own notes"
  ON public.notes_reminders FOR SELECT TO authenticated
  USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Users create own notes"
  ON public.notes_reminders FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users update own notes"
  ON public.notes_reminders FOR UPDATE TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users delete own notes"
  ON public.notes_reminders FOR DELETE TO authenticated
  USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'::app_role));

-- 5) internment_requests: enforce hospital scoping on writes
DROP POLICY IF EXISTS "Users can create own internment requests" ON public.internment_requests;
DROP POLICY IF EXISTS "Users can update own internment requests" ON public.internment_requests;

CREATE POLICY "Users can create own internment requests"
  ON public.internment_requests FOR INSERT TO authenticated
  WITH CHECK (
    auth.uid() = created_by
    AND (
      hospital_unit_id IS NULL
      OR EXISTS (
        SELECT 1 FROM public.user_hospital_assignments uha
        WHERE uha.user_id = auth.uid()
          AND uha.hospital_unit_id = internment_requests.hospital_unit_id
      )
      OR public.has_role(auth.uid(), 'admin'::app_role)
    )
  );

CREATE POLICY "Users can update own internment requests"
  ON public.internment_requests FOR UPDATE TO authenticated
  USING (auth.uid() = created_by)
  WITH CHECK (
    auth.uid() = created_by
    AND (
      hospital_unit_id IS NULL
      OR EXISTS (
        SELECT 1 FROM public.user_hospital_assignments uha
        WHERE uha.user_id = auth.uid()
          AND uha.hospital_unit_id = internment_requests.hospital_unit_id
      )
      OR public.has_role(auth.uid(), 'admin'::app_role)
    )
  );

-- 6) storage.objects: scope hospital-files SELECT to users of the same hospital
DROP POLICY IF EXISTS "Auth read hospital-files" ON storage.objects;
CREATE POLICY "Hospital members read hospital-files"
  ON storage.objects FOR SELECT TO authenticated
  USING (
    bucket_id = 'hospital-files'
    AND (
      public.has_role(auth.uid(), 'admin'::app_role)
      OR auth.uid() = owner
      OR EXISTS (
        SELECT 1
        FROM public.hospital_files hf
        JOIN public.user_hospital_assignments uha
          ON uha.hospital_unit_id = hf.hospital_unit_id
        WHERE hf.storage_path = storage.objects.name
          AND uha.user_id = auth.uid()
      )
    )
  );

-- 7) Revoke EXECUTE on privileged SECURITY DEFINER functions from anon/authenticated
REVOKE EXECUTE ON FUNCTION public.admin_update_user_password(text, text) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.get_auth_user_id_by_email(text) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.setup_visitante_user() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.setup_medicouti_user() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.setup_medicoporta_user() FROM PUBLIC, anon, authenticated;
