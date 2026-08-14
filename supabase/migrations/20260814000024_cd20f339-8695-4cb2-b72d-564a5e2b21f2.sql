-- Helper: staff role check (excludes 'visitante')
CREATE OR REPLACE FUNCTION public.is_staff(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id
      AND role <> 'visitante'::app_role
  )
$$;

CREATE OR REPLACE FUNCTION public.is_clinical_staff(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id
      AND role IN ('admin','medico','porta','uti','prescritor','enfermagem','fisioterapia','recepcao')
  )
$$;

REVOKE ALL ON FUNCTION public.is_staff(uuid) FROM anon;
REVOKE ALL ON FUNCTION public.is_clinical_staff(uuid) FROM anon;
GRANT EXECUTE ON FUNCTION public.is_staff(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_clinical_staff(uuid) TO authenticated;

-- bed_allocation_requests
DROP POLICY IF EXISTS "Admins e médicos podem atualizar solicitações" ON public.bed_allocation_requests;
CREATE POLICY "Staff or requester can update allocation requests"
ON public.bed_allocation_requests FOR UPDATE TO authenticated
USING (requested_by = auth.uid() OR public.is_clinical_staff(auth.uid()))
WITH CHECK (requested_by = auth.uid() OR public.is_clinical_staff(auth.uid()));

-- bed_requests
DROP POLICY IF EXISTS "Auth can update bed requests" ON public.bed_requests;
CREATE POLICY "Requester, assignee or staff can update bed requests"
ON public.bed_requests FOR UPDATE TO authenticated
USING (
  requested_by = auth.uid()
  OR accepted_by = auth.uid()
  OR public.is_staff(auth.uid())
)
WITH CHECK (
  requested_by = auth.uid()
  OR accepted_by = auth.uid()
  OR public.is_staff(auth.uid())
);

-- death_reviews
DROP POLICY IF EXISTS "Auth users can update death reviews" ON public.death_reviews;
CREATE POLICY "Author, doctors or admins can update death reviews"
ON public.death_reviews FOR UPDATE TO authenticated
USING (
  created_by = auth.uid()
  OR public.has_role(auth.uid(), 'admin'::app_role)
  OR public.has_role(auth.uid(), 'medico'::app_role)
)
WITH CHECK (
  created_by = auth.uid()
  OR public.has_role(auth.uid(), 'admin'::app_role)
  OR public.has_role(auth.uid(), 'medico'::app_role)
);

-- transport_requests
DROP POLICY IF EXISTS "Auth users can update transport requests" ON public.transport_requests;
CREATE POLICY "Requester, assignee or staff can update transport requests"
ON public.transport_requests FOR UPDATE TO authenticated
USING (
  requested_by = auth.uid()
  OR assigned_to = auth.uid()
  OR public.is_staff(auth.uid())
)
WITH CHECK (
  requested_by = auth.uid()
  OR assigned_to = auth.uid()
  OR public.is_staff(auth.uid())
);

-- transport_assignments
DROP POLICY IF EXISTS "Auth create transport" ON public.transport_assignments;
DROP POLICY IF EXISTS "Auth update transport" ON public.transport_assignments;
CREATE POLICY "Staff or conductor can create transport assignments"
ON public.transport_assignments FOR INSERT TO authenticated
WITH CHECK (conductor_user_id = auth.uid() OR public.is_staff(auth.uid()));
CREATE POLICY "Staff or conductor can update transport assignments"
ON public.transport_assignments FOR UPDATE TO authenticated
USING (conductor_user_id = auth.uid() OR public.is_staff(auth.uid()))
WITH CHECK (conductor_user_id = auth.uid() OR public.is_staff(auth.uid()));

-- conduct_history
DROP POLICY IF EXISTS "Authenticated users can insert conduct history" ON public.conduct_history;
CREATE POLICY "Users can insert own conduct history"
ON public.conduct_history FOR INSERT TO authenticated
WITH CHECK (changed_by = auth.uid());

-- managed_beds
DROP POLICY IF EXISTS "Auth can update bed status" ON public.managed_beds;
CREATE POLICY "Staff can update bed status"
ON public.managed_beds FOR UPDATE TO authenticated
USING (public.is_staff(auth.uid()))
WITH CHECK (public.is_staff(auth.uid()));

-- patients
DROP POLICY IF EXISTS "Médicos podem atualizar pacientes" ON public.patients;
DROP POLICY IF EXISTS "Usuários autenticados podem deletar pacientes" ON public.patients;
CREATE POLICY "Clinical staff can update patients"
ON public.patients FOR UPDATE TO authenticated
USING (public.is_clinical_staff(auth.uid()))
WITH CHECK (public.is_clinical_staff(auth.uid()));
CREATE POLICY "Doctors and admins can delete patients"
ON public.patients FOR DELETE TO authenticated
USING (
  public.has_role(auth.uid(), 'admin'::app_role)
  OR public.has_role(auth.uid(), 'medico'::app_role)
  OR public.has_role(auth.uid(), 'porta'::app_role)
  OR public.has_role(auth.uid(), 'uti'::app_role)
);

-- sepsis_protocols
DROP POLICY IF EXISTS "Profissionais podem atualizar protocolos de sepse" ON public.sepsis_protocols;
CREATE POLICY "Clinical staff can update sepsis protocols"
ON public.sepsis_protocols FOR UPDATE TO authenticated
USING (public.is_clinical_staff(auth.uid()))
WITH CHECK (public.is_clinical_staff(auth.uid()));

-- Lock down administrative SECURITY DEFINER functions
REVOKE ALL ON FUNCTION public.admin_update_user_password(text, text) FROM anon, authenticated;
REVOKE ALL ON FUNCTION public.get_auth_user_id_by_email(text) FROM anon, authenticated;
REVOKE ALL ON FUNCTION public.setup_medicoporta_user() FROM anon, authenticated;
REVOKE ALL ON FUNCTION public.setup_medicouti_user() FROM anon, authenticated;
REVOKE ALL ON FUNCTION public.setup_visitante_user() FROM anon, authenticated;