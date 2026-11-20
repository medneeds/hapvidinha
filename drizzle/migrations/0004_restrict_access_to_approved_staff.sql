CREATE OR REPLACE FUNCTION public.is_approved_user(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT _user_id IS NOT NULL
    AND EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = _user_id AND p.status = 'approved')
    AND EXISTS (SELECT 1 FROM public.user_roles r WHERE r.user_id = _user_id)
$$;

REVOKE EXECUTE ON FUNCTION public.is_approved_user(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_approved_user(uuid) TO authenticated, service_role;

-- Read access: approved staff only
DROP POLICY IF EXISTS "Usuários autenticados podem visualizar protocolos" ON public.sepsis_protocols;
CREATE POLICY "Approved staff can view sepsis protocols" ON public.sepsis_protocols FOR SELECT TO authenticated USING (public.is_approved_user(auth.uid()));

DROP POLICY IF EXISTS "Authenticated users can view evolutions" ON public.patient_evolutions;
CREATE POLICY "Approved staff can view evolutions" ON public.patient_evolutions FOR SELECT TO authenticated USING (public.is_approved_user(auth.uid()));

DROP POLICY IF EXISTS "Usuários autenticados podem visualizar movimentações" ON public.patient_movements;
CREATE POLICY "Approved staff can view movements" ON public.patient_movements FOR SELECT TO authenticated USING (public.is_approved_user(auth.uid()));

DROP POLICY IF EXISTS "Auth can view managed beds" ON public.managed_beds;
CREATE POLICY "Approved staff can view managed beds" ON public.managed_beds FOR SELECT TO authenticated USING (public.is_approved_user(auth.uid()));

DROP POLICY IF EXISTS "Auth can view bed requests" ON public.bed_requests;
CREATE POLICY "Approved staff can view bed requests" ON public.bed_requests FOR SELECT TO authenticated USING (public.is_approved_user(auth.uid()));

DROP POLICY IF EXISTS "Auth view transport" ON public.transport_assignments;
CREATE POLICY "Approved staff can view transport assignments" ON public.transport_assignments FOR SELECT TO authenticated USING (public.is_approved_user(auth.uid()));

DROP POLICY IF EXISTS "Usuários autenticados podem visualizar passagens" ON public.shift_handovers;
CREATE POLICY "Approved staff can view handovers" ON public.shift_handovers FOR SELECT TO authenticated USING (public.is_approved_user(auth.uid()));

DROP POLICY IF EXISTS "Usuários autenticados podem visualizar versões" ON public.patient_versions;
CREATE POLICY "Approved staff can view patient versions" ON public.patient_versions FOR SELECT TO authenticated USING (public.is_approved_user(auth.uid()));

DROP POLICY IF EXISTS "Auth can view sla" ON public.bed_sla_configs;
CREATE POLICY "Approved staff can view sla" ON public.bed_sla_configs FOR SELECT TO authenticated USING (public.is_approved_user(auth.uid()));

DROP POLICY IF EXISTS "All authenticated users can view medical codes" ON public.medical_codes;
CREATE POLICY "Approved staff can view medical codes" ON public.medical_codes FOR SELECT TO authenticated USING (public.is_approved_user(auth.uid()));

DROP POLICY IF EXISTS "Auth users can view transport requests" ON public.transport_requests;
CREATE POLICY "Approved staff can view transport requests" ON public.transport_requests FOR SELECT TO authenticated USING (public.is_approved_user(auth.uid()));

DROP POLICY IF EXISTS "Authenticated users can view conduct history" ON public.conduct_history;
CREATE POLICY "Approved staff can view conduct history" ON public.conduct_history FOR SELECT TO authenticated USING (public.is_approved_user(auth.uid()));

DROP POLICY IF EXISTS "Usuários autenticados podem visualizar solicitações do mesmo" ON public.bed_allocation_requests;
CREATE POLICY "Approved staff can view allocation requests" ON public.bed_allocation_requests FOR SELECT TO authenticated USING (public.is_approved_user(auth.uid()));

DROP POLICY IF EXISTS "Auth users can view bed lifecycle events" ON public.bed_lifecycle_events;
CREATE POLICY "Approved staff can view bed lifecycle events" ON public.bed_lifecycle_events FOR SELECT TO authenticated USING (public.is_approved_user(auth.uid()));

DROP POLICY IF EXISTS "Auth users can view death reviews" ON public.death_reviews;
CREATE POLICY "Approved staff can view death reviews" ON public.death_reviews FOR SELECT TO authenticated USING (public.is_approved_user(auth.uid()));

DROP POLICY IF EXISTS "Authenticated users can view templates" ON public.therapeutic_templates;
CREATE POLICY "Approved staff can view templates" ON public.therapeutic_templates FOR SELECT TO authenticated USING (public.is_approved_user(auth.uid()));

DROP POLICY IF EXISTS "Authenticated can read bed capacities" ON public.sector_bed_capacities;
CREATE POLICY "Approved staff can read bed capacities" ON public.sector_bed_capacities FOR SELECT TO authenticated USING (public.is_approved_user(auth.uid()));

-- Write access: approved staff with an appropriate role
DROP POLICY IF EXISTS "Authenticated delete custom codes" ON public.custom_medical_codes;
CREATE POLICY "Approved staff can delete custom codes" ON public.custom_medical_codes FOR DELETE TO authenticated USING (public.is_approved_user(auth.uid()) AND public.is_staff(auth.uid()));

DROP POLICY IF EXISTS "Authenticated delete unit notes" ON public.unit_shared_notes;
CREATE POLICY "Approved staff can delete unit notes" ON public.unit_shared_notes FOR DELETE TO authenticated USING (public.is_approved_user(auth.uid()) AND public.is_staff(auth.uid()));

DROP POLICY IF EXISTS "Authenticated delete unit checklist" ON public.unit_checklist_items;
CREATE POLICY "Approved staff can delete unit checklist" ON public.unit_checklist_items FOR DELETE TO authenticated USING (public.is_approved_user(auth.uid()) AND public.is_staff(auth.uid()));

DROP POLICY IF EXISTS "Usuários autenticados atualizam prioridades UTI" ON public.uti_priorities;
CREATE POLICY "Approved clinical staff update UTI priorities" ON public.uti_priorities FOR UPDATE TO authenticated
  USING (public.is_approved_user(auth.uid()) AND public.is_clinical_staff(auth.uid()))
  WITH CHECK (public.is_approved_user(auth.uid()) AND public.is_clinical_staff(auth.uid()));

DROP POLICY IF EXISTS "Auth users can update stroke protocols" ON public.stroke_protocols;
CREATE POLICY "Approved clinical staff update stroke protocols" ON public.stroke_protocols FOR UPDATE TO authenticated
  USING (public.is_approved_user(auth.uid()) AND public.is_clinical_staff(auth.uid()))
  WITH CHECK (public.is_approved_user(auth.uid()) AND public.is_clinical_staff(auth.uid()));

DROP POLICY IF EXISTS "Auth users can update chest pain protocols" ON public.chest_pain_protocols;
CREATE POLICY "Approved clinical staff update chest pain protocols" ON public.chest_pain_protocols FOR UPDATE TO authenticated
  USING (public.is_approved_user(auth.uid()) AND public.is_clinical_staff(auth.uid()))
  WITH CHECK (public.is_approved_user(auth.uid()) AND public.is_clinical_staff(auth.uid()));

DROP POLICY IF EXISTS "Authenticated users can delete DHD patients" ON public.dhd_patients;
CREATE POLICY "Approved clinical staff delete DHD patients" ON public.dhd_patients FOR DELETE TO authenticated
  USING (public.is_approved_user(auth.uid()) AND public.is_clinical_staff(auth.uid()));

DROP POLICY IF EXISTS "Authenticated users can create medical reports" ON public.medical_reports;
CREATE POLICY "Approved staff create own medical reports" ON public.medical_reports FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = created_by AND public.is_approved_user(auth.uid()) AND public.is_staff(auth.uid()));

DROP POLICY IF EXISTS "Médicos podem criar pacientes" ON public.patients;
CREATE POLICY "Approved clinical staff create patients" ON public.patients FOR INSERT TO authenticated
  WITH CHECK (public.is_approved_user(auth.uid()) AND public.is_clinical_staff(auth.uid()));