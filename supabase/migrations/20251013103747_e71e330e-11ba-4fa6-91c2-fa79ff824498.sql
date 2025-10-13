-- Add registration status tracking to patients table
CREATE TYPE registration_status AS ENUM ('pending', 'consented', 'paid', 'completed');

ALTER TABLE patients 
ADD COLUMN registration_status registration_status DEFAULT 'pending',
ADD COLUMN consent_completed_at timestamp with time zone,
ADD COLUMN payment_completed_at timestamp with time zone,
ADD COLUMN registration_notes text;

-- Create index for finding incomplete registrations
CREATE INDEX idx_patients_registration_status ON patients(registration_status) 
WHERE registration_status != 'completed';

-- Comment on columns
COMMENT ON COLUMN patients.registration_status IS 'Tracks the current stage of patient registration';
COMMENT ON COLUMN patients.consent_completed_at IS 'Timestamp when consent form was signed';
COMMENT ON COLUMN patients.payment_completed_at IS 'Timestamp when registration payment was made';
COMMENT ON COLUMN patients.registration_notes IS 'Notes about registration status or interruptions';