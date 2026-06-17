
-- audit_logs: only allow inserting rows attributed to the acting user
DROP POLICY IF EXISTS "Authenticated sessions can insert audit logs" ON public.audit_logs;
CREATE POLICY "Users can only insert own audit logs"
  ON public.audit_logs FOR INSERT TO authenticated
  WITH CHECK (auth.uid() IS NOT NULL AND (user_id IS NULL OR user_id = auth.uid()));

-- hospital_files: scope SELECT to admin, uploader, or same hospital members
DROP POLICY IF EXISTS "Auth can view hospital files" ON public.hospital_files;
CREATE POLICY "Hospital members can view hospital files"
  ON public.hospital_files FOR SELECT TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin'::app_role)
    OR auth.uid() = uploaded_by
    OR EXISTS (
      SELECT 1 FROM public.user_hospital_assignments uha
      WHERE uha.user_id = auth.uid()
        AND uha.hospital_unit_id = hospital_files.hospital_unit_id
    )
  );

-- patient_evolutions: enforce creator and hospital scope on INSERT
DROP POLICY IF EXISTS "Authenticated users can create evolutions" ON public.patient_evolutions;
CREATE POLICY "Users create evolutions in own hospital"
  ON public.patient_evolutions FOR INSERT TO authenticated
  WITH CHECK (
    auth.uid() = created_by
    AND (
      hospital_unit_id IS NULL
      OR public.has_role(auth.uid(), 'admin'::app_role)
      OR EXISTS (
        SELECT 1 FROM public.user_hospital_assignments uha
        WHERE uha.user_id = auth.uid()
          AND uha.hospital_unit_id = patient_evolutions.hospital_unit_id
      )
    )
  );
