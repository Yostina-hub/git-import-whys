-- Create function to get user profile with roles
CREATE OR REPLACE FUNCTION public.get_user_with_roles(user_uuid UUID)
RETURNS TABLE (
  id UUID,
  email TEXT,
  first_name TEXT,
  last_name TEXT,
  phone_mobile TEXT,
  status TEXT,
  created_at TIMESTAMPTZ,
  roles TEXT[]
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id,
    au.email,
    p.first_name,
    p.last_name,
    p.phone_mobile,
    p.status,
    p.created_at,
    ARRAY_AGG(ur.role::TEXT) FILTER (WHERE ur.role IS NOT NULL) as roles
  FROM public.profiles p
  JOIN auth.users au ON au.id = p.id
  LEFT JOIN public.user_roles ur ON ur.user_id = p.id
  WHERE p.id = user_uuid
  GROUP BY p.id, au.email, p.first_name, p.last_name, p.phone_mobile, p.status, p.created_at;
END;
$$;

-- Create function to list all users with their roles (admin only)
CREATE OR REPLACE FUNCTION public.list_all_users_with_roles()
RETURNS TABLE (
  id UUID,
  email TEXT,
  first_name TEXT,
  last_name TEXT,
  phone_mobile TEXT,
  status TEXT,
  created_at TIMESTAMPTZ,
  roles TEXT[]
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Check if calling user is admin
  IF NOT has_role(auth.uid(), 'admin'::app_role) THEN
    RAISE EXCEPTION 'Access denied. Admin role required.';
  END IF;

  RETURN QUERY
  SELECT 
    p.id,
    au.email,
    p.first_name,
    p.last_name,
    p.phone_mobile,
    p.status,
    p.created_at,
    ARRAY_AGG(ur.role::TEXT) FILTER (WHERE ur.role IS NOT NULL) as roles
  FROM public.profiles p
  JOIN auth.users au ON au.id = p.id
  LEFT JOIN public.user_roles ur ON ur.user_id = p.id
  GROUP BY p.id, au.email, p.first_name, p.last_name, p.phone_mobile, p.status, p.created_at
  ORDER BY p.created_at DESC;
END;
$$;

-- Create activity_summary table for tracking user activity metrics
CREATE TABLE public.activity_summary (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  summary_date DATE NOT NULL,
  actions_count INTEGER DEFAULT 0,
  patients_viewed INTEGER DEFAULT 0,
  appointments_created INTEGER DEFAULT 0,
  invoices_created INTEGER DEFAULT 0,
  last_login TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, summary_date)
);

ALTER TABLE public.activity_summary ENABLE ROW LEVEL SECURITY;

-- RLS for activity_summary
CREATE POLICY "Users can view their own activity summary"
ON public.activity_summary FOR SELECT
TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "Admins can view all activity summaries"
ON public.activity_summary FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'manager'::app_role));

CREATE POLICY "System can manage activity summaries"
ON public.activity_summary FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

-- Add trigger for activity_summary updated_at
CREATE TRIGGER update_activity_summary_updated_at
BEFORE UPDATE ON public.activity_summary
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create indexes
CREATE INDEX idx_activity_summary_user_date ON public.activity_summary(user_id, summary_date DESC);
CREATE INDEX idx_activity_summary_date ON public.activity_summary(summary_date DESC);

-- Add additional profile fields for staff management
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS department TEXT,
ADD COLUMN IF NOT EXISTS job_title TEXT,
ADD COLUMN IF NOT EXISTS license_number TEXT,
ADD COLUMN IF NOT EXISTS hire_date DATE,
ADD COLUMN IF NOT EXISTS last_login TIMESTAMPTZ;