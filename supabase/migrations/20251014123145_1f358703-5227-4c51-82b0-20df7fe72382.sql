-- Add superadmin role to app_role enum
ALTER TYPE app_role ADD VALUE IF NOT EXISTS 'superadmin';

-- Create function to delete user (superadmin only)
CREATE OR REPLACE FUNCTION public.delete_user(user_id_to_delete UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Check if calling user is superadmin
  IF NOT has_role(auth.uid(), 'superadmin'::app_role) THEN
    RAISE EXCEPTION 'Access denied. Superadmin role required.';
  END IF;

  -- Prevent self-deletion
  IF auth.uid() = user_id_to_delete THEN
    RAISE EXCEPTION 'Cannot delete your own account.';
  END IF;

  -- Delete user from auth.users (cascade will handle related records)
  DELETE FROM auth.users WHERE id = user_id_to_delete;
END;
$$;