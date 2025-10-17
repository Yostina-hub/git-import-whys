-- Fix RLS policy for user_roles to allow admin, superadmin, and manager to manage roles
DROP POLICY IF EXISTS "Admins can manage all roles" ON public.user_roles;

CREATE POLICY "Admins can manage all roles"
  ON public.user_roles FOR ALL
  USING (
    public.has_role(auth.uid(), 'admin'::app_role) OR 
    public.has_role(auth.uid(), 'superadmin'::app_role) OR 
    public.has_role(auth.uid(), 'manager'::app_role)
  );