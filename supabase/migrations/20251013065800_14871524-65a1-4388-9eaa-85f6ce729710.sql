-- Add guardian information columns to consent_forms table
ALTER TABLE public.consent_forms 
ADD COLUMN IF NOT EXISTS guardian_name TEXT,
ADD COLUMN IF NOT EXISTS guardian_relationship TEXT,
ADD COLUMN IF NOT EXISTS guardian_phone TEXT,
ADD COLUMN IF NOT EXISTS guardian_national_id TEXT;