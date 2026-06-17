
-- audit_logs: replace permissive insert policy
DROP POLICY IF EXISTS "System can insert audit logs" ON public.audit_logs;
CREATE POLICY "Authenticated sessions can insert audit logs"
  ON public.audit_logs FOR INSERT TO authenticated
  WITH CHECK (auth.uid() IS NOT NULL);

-- Revoke execute on internal trigger functions (they are invoked by triggers, not via API)
REVOKE EXECUTE ON FUNCTION public.audit_trigger_function() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
