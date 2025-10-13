-- Create user_clinic_grant table for managing clinic access permissions
CREATE TABLE IF NOT EXISTS public.user_clinic_grant (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  clinic_id uuid REFERENCES public.clinics(id) ON DELETE CASCADE,
  all_clinics boolean NOT NULL DEFAULT false,
  scope text NOT NULL CHECK (scope IN ('read', 'write')),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT user_clinic_scope_unique UNIQUE (user_id, clinic_id, scope),
  CONSTRAINT clinic_or_all CHECK (
    (clinic_id IS NOT NULL AND all_clinics = false) OR
    (clinic_id IS NULL AND all_clinics = true)
  )
);

-- Enable RLS on user_clinic_grant
ALTER TABLE public.user_clinic_grant ENABLE ROW LEVEL SECURITY;

-- Create policies for user_clinic_grant
CREATE POLICY "Admins can manage clinic grants"
ON public.user_clinic_grant
FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Users can view their own clinic grants"
ON public.user_clinic_grant
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_user_clinic_grant_user_id ON public.user_clinic_grant(user_id);
CREATE INDEX IF NOT EXISTS idx_user_clinic_grant_clinic_id ON public.user_clinic_grant(clinic_id);
CREATE INDEX IF NOT EXISTS idx_user_clinic_grant_scope ON public.user_clinic_grant(scope);

-- Add update trigger for user_clinic_grant
CREATE TRIGGER update_user_clinic_grant_updated_at
BEFORE UPDATE ON public.user_clinic_grant
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();