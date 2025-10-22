-- Ensure has_role function exists and is SECURITY DEFINER (prevents recursion issues)
create or replace function public.has_role(_user_id uuid, _role app_role)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.user_roles
    where user_id = _user_id
      and role = _role
  )
$$;

-- Ensure RLS is enabled on user_roles
alter table if exists public.user_roles enable row level security;

-- Clean up any existing conflicting policies
drop policy if exists "Admins can manage all roles" on public.user_roles;
drop policy if exists "Admins can manage roles" on public.user_roles;
drop policy if exists "Admins can update roles" on public.user_roles;
drop policy if exists "Admins can delete roles" on public.user_roles;
drop policy if exists "Admins and managers can view all roles" on public.user_roles;
drop policy if exists "Users can view their own roles" on public.user_roles;

-- View policies
create policy "Users can view their own roles"
  on public.user_roles for select
  using (user_id = auth.uid());

create policy "Admins and managers can view all roles"
  on public.user_roles for select
  using (
    public.has_role(auth.uid(), 'admin'::app_role) OR
    public.has_role(auth.uid(), 'superadmin'::app_role) OR 
    public.has_role(auth.uid(), 'manager'::app_role)
  );

-- Manage policies (explicit WITH CHECK for INSERT/UPDATE)
create policy "Admins can insert roles"
  on public.user_roles for insert
  with check (
    public.has_role(auth.uid(), 'admin'::app_role) OR
    public.has_role(auth.uid(), 'superadmin'::app_role) OR 
    public.has_role(auth.uid(), 'manager'::app_role)
  );

create policy "Admins can update roles"
  on public.user_roles for update
  using (
    public.has_role(auth.uid(), 'admin'::app_role) OR
    public.has_role(auth.uid(), 'superadmin'::app_role) OR 
    public.has_role(auth.uid(), 'manager'::app_role)
  )
  with check (
    public.has_role(auth.uid(), 'admin'::app_role) OR
    public.has_role(auth.uid(), 'superadmin'::app_role) OR 
    public.has_role(auth.uid(), 'manager'::app_role)
  );

create policy "Admins can delete roles"
  on public.user_roles for delete
  using (
    public.has_role(auth.uid(), 'admin'::app_role) OR
    public.has_role(auth.uid(), 'superadmin'::app_role) OR 
    public.has_role(auth.uid(), 'manager'::app_role)
  );
