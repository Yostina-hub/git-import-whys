-- Fix the list_all_users_with_roles function to properly cast email type
DROP FUNCTION IF EXISTS public.list_all_users_with_roles();

CREATE OR REPLACE FUNCTION public.list_all_users_with_roles()
RETURNS TABLE(
  id uuid,
  email text,
  first_name text,
  last_name text,
  phone_mobile text,
  status text,
  created_at timestamp with time zone,
  roles text[]
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- Check if calling user is admin
  IF NOT has_role(auth.uid(), 'admin'::app_role) THEN
    RAISE EXCEPTION 'Access denied. Admin role required.';
  END IF;

  RETURN QUERY
  SELECT 
    p.id,
    au.email::text,
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
$function$;

-- Create audit_logs table
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES public.profiles(id),
  action text NOT NULL,
  resource_type text NOT NULL,
  resource_id uuid,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS on audit_logs
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Create policies for audit_logs
CREATE POLICY "Admins and managers can view audit logs"
ON public.audit_logs
FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'manager'::app_role));

CREATE POLICY "System can create audit logs"
ON public.audit_logs
FOR INSERT
TO authenticated
WITH CHECK (true);

-- Create index on audit_logs for better performance
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON public.audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON public.audit_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_resource ON public.audit_logs(resource_type, resource_id);

-- Create system_settings table
CREATE TABLE IF NOT EXISTS public.system_settings (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  setting_key text NOT NULL UNIQUE,
  setting_value jsonb NOT NULL,
  setting_type text NOT NULL,
  category text NOT NULL,
  description text,
  updated_by uuid REFERENCES public.profiles(id),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS on system_settings
ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;

-- Create policies for system_settings
CREATE POLICY "Admins can manage system settings"
ON public.system_settings
FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Authenticated users can view system settings"
ON public.system_settings
FOR SELECT
TO authenticated
USING (true);

-- Insert some default system settings
INSERT INTO public.system_settings (setting_key, setting_value, setting_type, category, description)
VALUES
  ('appointment_duration', '30'::jsonb, 'number', 'appointments', 'Default appointment duration in minutes'),
  ('enable_sms_notifications', 'false'::jsonb, 'boolean', 'notifications', 'Enable SMS notifications for patients'),
  ('enable_email_notifications', 'true'::jsonb, 'boolean', 'notifications', 'Enable email notifications for patients'),
  ('auto_confirm_appointments', 'false'::jsonb, 'boolean', 'appointments', 'Automatically confirm new appointments'),
  ('max_advance_booking_days', '90'::jsonb, 'number', 'appointments', 'Maximum days in advance for booking'),
  ('clinic_name', '"Main Clinic"'::jsonb, 'string', 'general', 'Clinic name for communications'),
  ('clinic_phone', '"+1234567890"'::jsonb, 'string', 'general', 'Main clinic phone number'),
  ('clinic_email', '"info@clinic.com"'::jsonb, 'string', 'general', 'Main clinic email address')
ON CONFLICT (setting_key) DO NOTHING;

-- Add update trigger for system_settings
CREATE TRIGGER update_system_settings_updated_at
BEFORE UPDATE ON public.system_settings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();