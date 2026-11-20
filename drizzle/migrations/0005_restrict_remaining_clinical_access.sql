-- Clinical reads: approved staff only
DROP POLICY IF EXISTS "Médicos podem visualizar todos os pacientes" ON public.patients;
CREATE POLICY "Approved staff can view patients" ON public.patients FOR SELECT TO authenticated USING (public.is_approved_user(auth.uid()));

DROP POLICY IF EXISTS "Auth users can view stroke protocols" ON public.stroke_protocols;
CREATE POLICY "Approved staff can view stroke protocols" ON public.stroke_protocols FOR SELECT TO authenticated USING (public.is_approved_user(auth.uid()));

DROP POLICY IF EXISTS "Auth users can view chest pain protocols" ON public.chest_pain_protocols;
CREATE POLICY "Approved staff can view chest pain protocols" ON public.chest_pain_protocols FOR SELECT TO authenticated USING (public.is_approved_user(auth.uid()));

DROP POLICY IF EXISTS "Authenticated users can view medical reports" ON public.medical_reports;
CREATE POLICY "Approved staff can view medical reports" ON public.medical_reports FOR SELECT TO authenticated USING (public.is_approved_user(auth.uid()));

-- DHD patients
DROP POLICY IF EXISTS "Authenticated users can view DHD patients" ON public.dhd_patients;
CREATE POLICY "Approved staff can view DHD patients" ON public.dhd_patients FOR SELECT TO authenticated USING (public.is_approved_user(auth.uid()));
DROP POLICY IF EXISTS "Authenticated users can update DHD patients" ON public.dhd_patients;
CREATE POLICY "Approved clinical staff update DHD patients" ON public.dhd_patients FOR UPDATE TO authenticated
  USING (public.is_approved_user(auth.uid()) AND public.is_clinical_staff(auth.uid()))
  WITH CHECK (public.is_approved_user(auth.uid()) AND public.is_clinical_staff(auth.uid()));

-- UTI priorities
DROP POLICY IF EXISTS "Usuários autenticados visualizam prioridades UTI" ON public.uti_priorities;
CREATE POLICY "Approved staff can view UTI priorities" ON public.uti_priorities FOR SELECT TO authenticated USING (public.is_approved_user(auth.uid()));
DROP POLICY IF EXISTS "Usuários autenticados criam prioridades UTI" ON public.uti_priorities;
CREATE POLICY "Approved clinical staff create UTI priorities" ON public.uti_priorities FOR INSERT TO authenticated
  WITH CHECK (public.is_approved_user(auth.uid()) AND public.is_clinical_staff(auth.uid()) AND (added_by IS NULL OR added_by = auth.uid()));
DROP POLICY IF EXISTS "Usuários autenticados removem prioridades UTI" ON public.uti_priorities;
CREATE POLICY "Approved clinical staff delete UTI priorities" ON public.uti_priorities FOR DELETE TO authenticated
  USING (public.is_approved_user(auth.uid()) AND public.is_clinical_staff(auth.uid()));

-- Custom medical codes (shared per unit among approved staff)
DROP POLICY IF EXISTS "Authenticated view custom codes" ON public.custom_medical_codes;
CREATE POLICY "Approved staff can view custom codes" ON public.custom_medical_codes FOR SELECT TO authenticated USING (public.is_approved_user(auth.uid()));
DROP POLICY IF EXISTS "Authenticated insert custom codes" ON public.custom_medical_codes;
CREATE POLICY "Approved staff create own custom codes" ON public.custom_medical_codes FOR INSERT TO authenticated
  WITH CHECK (public.is_approved_user(auth.uid()) AND public.is_staff(auth.uid()) AND created_by = auth.uid());
DROP POLICY IF EXISTS "Authenticated update custom codes" ON public.custom_medical_codes;
CREATE POLICY "Approved staff update custom codes" ON public.custom_medical_codes FOR UPDATE TO authenticated
  USING (public.is_approved_user(auth.uid()) AND public.is_staff(auth.uid()))
  WITH CHECK (public.is_approved_user(auth.uid()) AND public.is_staff(auth.uid()));

-- Unit checklist (shared per unit among approved staff)
DROP POLICY IF EXISTS "Authenticated view unit checklist" ON public.unit_checklist_items;
CREATE POLICY "Approved staff can view unit checklist" ON public.unit_checklist_items FOR SELECT TO authenticated USING (public.is_approved_user(auth.uid()));
DROP POLICY IF EXISTS "Authenticated insert unit checklist" ON public.unit_checklist_items;
CREATE POLICY "Approved staff create own unit checklist items" ON public.unit_checklist_items FOR INSERT TO authenticated
  WITH CHECK (public.is_approved_user(auth.uid()) AND public.is_staff(auth.uid()) AND created_by = auth.uid());
DROP POLICY IF EXISTS "Authenticated update unit checklist" ON public.unit_checklist_items;
CREATE POLICY "Approved staff update unit checklist" ON public.unit_checklist_items FOR UPDATE TO authenticated
  USING (public.is_approved_user(auth.uid()) AND public.is_staff(auth.uid()))
  WITH CHECK (public.is_approved_user(auth.uid()) AND public.is_staff(auth.uid()));

-- Unit shared notes (shared per unit among approved staff)
DROP POLICY IF EXISTS "Authenticated view unit notes" ON public.unit_shared_notes;
CREATE POLICY "Approved staff can view unit notes" ON public.unit_shared_notes FOR SELECT TO authenticated USING (public.is_approved_user(auth.uid()));
DROP POLICY IF EXISTS "Authenticated insert unit notes" ON public.unit_shared_notes;
CREATE POLICY "Approved staff create unit notes" ON public.unit_shared_notes FOR INSERT TO authenticated
  WITH CHECK (public.is_approved_user(auth.uid()) AND public.is_staff(auth.uid()) AND updated_by = auth.uid());
DROP POLICY IF EXISTS "Authenticated update unit notes" ON public.unit_shared_notes;
CREATE POLICY "Approved staff update unit notes" ON public.unit_shared_notes FOR UPDATE TO authenticated
  USING (public.is_approved_user(auth.uid()) AND public.is_staff(auth.uid()))
  WITH CHECK (public.is_approved_user(auth.uid()) AND public.is_staff(auth.uid()) AND updated_by = auth.uid());

-- Institution branding: not needed before sign-in
DROP POLICY IF EXISTS "Anyone can view institution branding" ON public.institution_branding;
CREATE POLICY "Approved staff can view institution branding" ON public.institution_branding FOR SELECT TO authenticated USING (public.is_approved_user(auth.uid()));