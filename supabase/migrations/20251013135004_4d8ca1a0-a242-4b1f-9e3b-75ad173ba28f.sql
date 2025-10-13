-- Add nurse role to app_role enum if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'nurse' AND enumtypid = 'public.app_role'::regtype) THEN
        ALTER TYPE public.app_role ADD VALUE 'nurse';
    END IF;
END $$;