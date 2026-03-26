CREATE POLICY "Usuários autenticados podem atualizar protocolos de sepse"
ON public.sepsis_protocols
FOR UPDATE
TO authenticated
USING (auth.uid() IS NOT NULL)
WITH CHECK (auth.uid() IS NOT NULL);