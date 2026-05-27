
-- Tabela de metadados dos arquivos do repositório
CREATE TABLE public.hospital_files (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  hospital_unit_id UUID NOT NULL,
  state_id UUID NOT NULL,
  uploaded_by UUID NOT NULL,
  uploaded_by_name TEXT,
  storage_path TEXT NOT NULL UNIQUE,
  file_name TEXT NOT NULL,
  mime_type TEXT,
  size_bytes BIGINT NOT NULL DEFAULT 0,
  description TEXT,
  tags TEXT[] DEFAULT ARRAY[]::TEXT[],
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_hospital_files_hospital ON public.hospital_files(hospital_unit_id, state_id, created_at DESC);
CREATE INDEX idx_hospital_files_uploader ON public.hospital_files(uploaded_by);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.hospital_files TO authenticated;
GRANT ALL ON public.hospital_files TO service_role;

ALTER TABLE public.hospital_files ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Auth can view hospital files"
ON public.hospital_files FOR SELECT
TO authenticated
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Auth can insert hospital files"
ON public.hospital_files FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = uploaded_by);

CREATE POLICY "Owner or admin can update hospital files"
ON public.hospital_files FOR UPDATE
TO authenticated
USING (auth.uid() = uploaded_by OR has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Owner or admin can delete hospital files"
ON public.hospital_files FOR DELETE
TO authenticated
USING (auth.uid() = uploaded_by OR has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER update_hospital_files_updated_at
BEFORE UPDATE ON public.hospital_files
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Bucket privado
INSERT INTO storage.buckets (id, name, public, file_size_limit)
VALUES ('hospital-files', 'hospital-files', false, 26214400)
ON CONFLICT (id) DO NOTHING;

-- Policies de storage: qualquer autenticado lê/envia; só dono/admin altera/remove via metadado
CREATE POLICY "Auth read hospital-files"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'hospital-files');

CREATE POLICY "Auth upload hospital-files"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'hospital-files' AND auth.uid() = owner);

CREATE POLICY "Owner update hospital-files"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'hospital-files' AND (auth.uid() = owner OR has_role(auth.uid(), 'admin'::app_role)));

CREATE POLICY "Owner delete hospital-files"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'hospital-files' AND (auth.uid() = owner OR has_role(auth.uid(), 'admin'::app_role)));
