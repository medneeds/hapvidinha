-- 1. Add deletion_reason column for soft tracking via audit logs
ALTER TABLE public.sepsis_protocols
  ADD COLUMN IF NOT EXISTS deletion_reason text;

-- 2. Replace DELETE policies: admin always, creator only if still open
DROP POLICY IF EXISTS "Admins podem deletar protocolos" ON public.sepsis_protocols;
DROP POLICY IF EXISTS "Criador pode deletar próprio protocolo" ON public.sepsis_protocols;

CREATE POLICY "Admins can delete any sepsis protocol"
ON public.sepsis_protocols
FOR DELETE
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Creators can delete only open sepsis protocols"
ON public.sepsis_protocols
FOR DELETE
TO authenticated
USING (auth.uid() = created_by AND outcome IS NULL);

-- 3. Attach audit trigger to sepsis_protocols (immutable trail per LGPD/CFM)
DROP TRIGGER IF EXISTS audit_sepsis_protocols ON public.sepsis_protocols;
CREATE TRIGGER audit_sepsis_protocols
AFTER INSERT OR UPDATE OR DELETE ON public.sepsis_protocols
FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_function();