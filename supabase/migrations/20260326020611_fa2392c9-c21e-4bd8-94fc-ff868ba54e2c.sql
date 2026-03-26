
CREATE POLICY "Criador pode deletar próprio protocolo"
ON public.sepsis_protocols
FOR DELETE
TO public
USING (auth.uid() = created_by);
