-- Add SONIK ID field to patients table for external system linking
ALTER TABLE public.patients
ADD COLUMN sonik_id TEXT;

-- Add unique constraint to ensure SONIK IDs are unique when provided
CREATE UNIQUE INDEX idx_patients_sonik_id 
ON public.patients(sonik_id) 
WHERE sonik_id IS NOT NULL;

-- Add comment for documentation
COMMENT ON COLUMN public.patients.sonik_id IS 'External SONIK system patient identifier for data linking';