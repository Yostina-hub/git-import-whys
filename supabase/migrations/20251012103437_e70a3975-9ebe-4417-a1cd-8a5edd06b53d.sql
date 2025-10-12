-- Clean up the incorrectly created admin user
DELETE FROM public.user_roles 
WHERE user_id IN (
  SELECT id FROM auth.users WHERE email = 'admin@hospital.com'
);

DELETE FROM public.profiles 
WHERE id IN (
  SELECT id FROM auth.users WHERE email = 'admin@hospital.com'
);

DELETE FROM auth.users WHERE email = 'admin@hospital.com';

-- Create a helper function to assign admin role after signup
CREATE OR REPLACE FUNCTION public.assign_admin_role(user_email TEXT)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  target_user_id UUID;
BEGIN
  -- Get user ID from email
  SELECT id INTO target_user_id
  FROM auth.users
  WHERE email = user_email;

  -- Check if user exists
  IF target_user_id IS NULL THEN
    RAISE EXCEPTION 'User with email % not found', user_email;
  END IF;

  -- Assign admin role if not already assigned
  INSERT INTO public.user_roles (user_id, role)
  VALUES (target_user_id, 'admin'::app_role)
  ON CONFLICT (user_id, role) DO NOTHING;
END;
$$;