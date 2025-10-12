-- Add code column to clinics table (nullable first)
ALTER TABLE public.clinics ADD COLUMN IF NOT EXISTS code TEXT;

-- Update existing clinics with a default code
UPDATE public.clinics SET code = 'HQ' WHERE code IS NULL;

-- Now make it NOT NULL and UNIQUE
ALTER TABLE public.clinics ALTER COLUMN code SET NOT NULL;
ALTER TABLE public.clinics ADD CONSTRAINT clinics_code_unique UNIQUE (code);

-- Add index for faster lookups
CREATE INDEX IF NOT EXISTS idx_clinics_code ON public.clinics(code);