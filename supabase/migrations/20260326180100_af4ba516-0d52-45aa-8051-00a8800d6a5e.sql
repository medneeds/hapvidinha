DROP POLICY IF EXISTS "Usuários autenticados podem atualizar protocolos de sepse" ON public.sepsis_protocols;

CREATE POLICY "Profissionais podem atualizar protocolos de sepse"
ON public.sepsis_protocols
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.user_roles ur
    WHERE ur.user_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.user_roles ur
    WHERE ur.user_id = auth.uid()
  )
);