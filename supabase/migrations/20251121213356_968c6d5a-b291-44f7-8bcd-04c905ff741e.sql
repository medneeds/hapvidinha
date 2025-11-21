
-- Remover constraint de unicidade global do bed_number
ALTER TABLE public.patients DROP CONSTRAINT IF EXISTS patients_bed_number_key;

-- Criar constraint de unicidade composta (bed_number + department + sector)
-- Isso permite que cada departamento/setor tenha seus próprios números de leito
ALTER TABLE public.patients 
ADD CONSTRAINT patients_bed_number_department_sector_key 
UNIQUE (bed_number, department, sector);
