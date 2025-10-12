-- Create default super admin account for first-time login
-- Email: admin@hospital.com
-- Password: Admin@2024!Change

-- Insert admin user into auth.users
INSERT INTO auth.users (
  id,
  instance_id,
  email,
  encrypted_password,
  email_confirmed_at,
  raw_app_meta_data,
  raw_user_meta_data,
  created_at,
  updated_at,
  confirmation_token,
  recovery_token,
  email_change_token_new,
  email_change
)
SELECT
  gen_random_uuid(),
  '00000000-0000-0000-0000-000000000000',
  'admin@hospital.com',
  crypt('Admin@2024!Change', gen_salt('bf')),
  NOW(),
  '{"provider":"email","providers":["email"]}'::jsonb,
  '{"first_name":"System","last_name":"Administrator"}'::jsonb,
  NOW(),
  NOW(),
  '',
  '',
  '',
  ''
WHERE NOT EXISTS (
  SELECT 1 FROM auth.users WHERE email = 'admin@hospital.com'
);

-- Insert profile for admin user
INSERT INTO public.profiles (id, first_name, last_name, job_title, department, status)
SELECT 
  au.id,
  'System',
  'Administrator',
  'System Administrator',
  'IT Administration',
  'active'
FROM auth.users au
WHERE au.email = 'admin@hospital.com'
AND NOT EXISTS (
  SELECT 1 FROM public.profiles WHERE id = au.id
);

-- Assign admin role to the default admin user
INSERT INTO public.user_roles (user_id, role)
SELECT 
  au.id,
  'admin'::app_role
FROM auth.users au
WHERE au.email = 'admin@hospital.com'
AND NOT EXISTS (
  SELECT 1 FROM public.user_roles WHERE user_id = au.id AND role = 'admin'::app_role
);