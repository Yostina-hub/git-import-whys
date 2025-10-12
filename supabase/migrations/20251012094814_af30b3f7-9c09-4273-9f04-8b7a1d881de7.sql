-- Phase 1 MVP: Core Tables for EMR System

-- ============================================
-- 1. ENUMS
-- ============================================

-- App roles enum
CREATE TYPE public.app_role AS ENUM ('admin', 'reception', 'clinician', 'billing', 'manager', 'patient');

-- Sex at birth
CREATE TYPE public.sex_at_birth AS ENUM ('male', 'female', 'intersex', 'unknown');

-- Gender identity
CREATE TYPE public.gender_identity AS ENUM ('male', 'female', 'non_binary', 'prefer_not_to_say', 'other');

-- Appointment status
CREATE TYPE public.appointment_status AS ENUM (
  'booked', 'confirmed', 'arrived', 'in_progress', 
  'completed', 'cancelled', 'no_show', 'rescheduled'
);

-- Appointment source
CREATE TYPE public.appointment_source AS ENUM (
  'call_center', 'website', 'walk_in', 'mobile_app', 'referral'
);

-- Invoice status
CREATE TYPE public.invoice_status AS ENUM (
  'draft', 'issued', 'paid', 'partial', 'refunded', 'void'
);

-- Payment method
CREATE TYPE public.payment_method AS ENUM (
  'cash', 'card', 'bank', 'mobile_money', 'wallet', 'insurance', 'online'
);

-- ============================================
-- 2. PROFILES TABLE (extends auth.users)
-- ============================================

CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  first_name TEXT NOT NULL,
  middle_name TEXT,
  last_name TEXT NOT NULL,
  phone_mobile TEXT,
  phone_alt TEXT,
  specialty TEXT,
  signature_file TEXT,
  status TEXT DEFAULT 'active',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view their own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

-- ============================================
-- 3. USER ROLES TABLE
-- ============================================

CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role public.app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, role)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Security definer function to check roles
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- Policies for user_roles
CREATE POLICY "Users can view their own roles"
  ON public.user_roles FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all roles"
  ON public.user_roles FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

-- ============================================
-- 4. CLINICS TABLE
-- ============================================

CREATE TABLE public.clinics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  timezone TEXT DEFAULT 'UTC',
  address_line1 TEXT,
  address_line2 TEXT,
  city TEXT,
  region TEXT,
  postal_code TEXT,
  country TEXT,
  phone TEXT,
  email TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.clinics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Clinics are viewable by authenticated users"
  ON public.clinics FOR SELECT
  TO authenticated
  USING (TRUE);

CREATE POLICY "Admins can manage clinics"
  ON public.clinics FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

-- ============================================
-- 5. PATIENTS TABLE
-- ============================================

CREATE TABLE public.patients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mrn TEXT UNIQUE NOT NULL,
  first_name TEXT NOT NULL,
  middle_name TEXT,
  last_name TEXT NOT NULL,
  date_of_birth DATE NOT NULL,
  sex_at_birth public.sex_at_birth,
  gender_identity public.gender_identity,
  phone_mobile TEXT NOT NULL,
  phone_alt TEXT,
  email TEXT,
  national_id TEXT,
  passport_no TEXT,
  address_line1 TEXT,
  address_line2 TEXT,
  city TEXT,
  region TEXT,
  postal_code TEXT,
  country TEXT,
  emergency_contact_name TEXT,
  emergency_contact_relationship TEXT,
  emergency_contact_phone TEXT,
  preferred_language TEXT DEFAULT 'en',
  marketing_opt_in BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create index for search performance
CREATE INDEX idx_patients_mrn ON public.patients(mrn);
CREATE INDEX idx_patients_phone ON public.patients(phone_mobile);
CREATE INDEX idx_patients_name ON public.patients(last_name, first_name, date_of_birth);

-- Auto-generate MRN function
CREATE OR REPLACE FUNCTION public.generate_mrn()
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
  new_mrn TEXT;
  counter INTEGER;
BEGIN
  counter := (SELECT COUNT(*) FROM public.patients) + 1;
  new_mrn := 'MRN' || LPAD(counter::TEXT, 6, '0');
  RETURN new_mrn;
END;
$$;

ALTER TABLE public.patients ENABLE ROW LEVEL SECURITY;

-- Patients policies
CREATE POLICY "Staff can view all patients"
  ON public.patients FOR SELECT
  TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin') OR
    public.has_role(auth.uid(), 'reception') OR
    public.has_role(auth.uid(), 'clinician') OR
    public.has_role(auth.uid(), 'billing') OR
    public.has_role(auth.uid(), 'manager')
  );

CREATE POLICY "Staff can create patients"
  ON public.patients FOR INSERT
  TO authenticated
  WITH CHECK (
    public.has_role(auth.uid(), 'admin') OR
    public.has_role(auth.uid(), 'reception')
  );

CREATE POLICY "Staff can update patients"
  ON public.patients FOR UPDATE
  TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin') OR
    public.has_role(auth.uid(), 'reception') OR
    public.has_role(auth.uid(), 'clinician')
  );

-- ============================================
-- 6. SERVICES TABLE
-- ============================================

CREATE TABLE public.services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  code TEXT UNIQUE NOT NULL,
  type TEXT NOT NULL, -- consultation, treatment, package, consumable
  unit_price DECIMAL(10,2) NOT NULL,
  tax_rate DECIMAL(5,2) DEFAULT 0,
  description TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Services are viewable by authenticated users"
  ON public.services FOR SELECT
  TO authenticated
  USING (TRUE);

CREATE POLICY "Admins can manage services"
  ON public.services FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

-- ============================================
-- 7. APPOINTMENTS TABLE
-- ============================================

CREATE TABLE public.appointments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID REFERENCES public.patients(id) ON DELETE CASCADE NOT NULL,
  clinic_id UUID REFERENCES public.clinics(id) NOT NULL,
  provider_id UUID REFERENCES auth.users(id),
  scheduled_start TIMESTAMPTZ NOT NULL,
  scheduled_end TIMESTAMPTZ NOT NULL,
  status public.appointment_status DEFAULT 'booked',
  source public.appointment_source DEFAULT 'walk_in',
  reason_for_visit TEXT,
  service_id UUID REFERENCES public.services(id),
  notes TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_appointments_patient ON public.appointments(patient_id);
CREATE INDEX idx_appointments_provider ON public.appointments(provider_id);
CREATE INDEX idx_appointments_date ON public.appointments(scheduled_start);

ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Staff can view appointments"
  ON public.appointments FOR SELECT
  TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin') OR
    public.has_role(auth.uid(), 'reception') OR
    public.has_role(auth.uid(), 'clinician') OR
    public.has_role(auth.uid(), 'billing') OR
    public.has_role(auth.uid(), 'manager')
  );

CREATE POLICY "Staff can create appointments"
  ON public.appointments FOR INSERT
  TO authenticated
  WITH CHECK (
    public.has_role(auth.uid(), 'admin') OR
    public.has_role(auth.uid(), 'reception')
  );

CREATE POLICY "Staff can update appointments"
  ON public.appointments FOR UPDATE
  TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin') OR
    public.has_role(auth.uid(), 'reception') OR
    public.has_role(auth.uid(), 'clinician')
  );

-- ============================================
-- 8. INVOICES TABLE
-- ============================================

CREATE TABLE public.invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID REFERENCES public.patients(id) ON DELETE CASCADE NOT NULL,
  appointment_id UUID REFERENCES public.appointments(id),
  status public.invoice_status DEFAULT 'draft',
  lines JSONB NOT NULL DEFAULT '[]',
  subtotal DECIMAL(10,2) DEFAULT 0,
  tax_amount DECIMAL(10,2) DEFAULT 0,
  total_amount DECIMAL(10,2) DEFAULT 0,
  balance_due DECIMAL(10,2) DEFAULT 0,
  issued_at TIMESTAMPTZ,
  due_date DATE,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_invoices_patient ON public.invoices(patient_id);
CREATE INDEX idx_invoices_status ON public.invoices(status);

ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Staff can view invoices"
  ON public.invoices FOR SELECT
  TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin') OR
    public.has_role(auth.uid(), 'reception') OR
    public.has_role(auth.uid(), 'billing') OR
    public.has_role(auth.uid(), 'manager')
  );

CREATE POLICY "Staff can manage invoices"
  ON public.invoices FOR ALL
  USING (
    public.has_role(auth.uid(), 'admin') OR
    public.has_role(auth.uid(), 'billing')
  );

-- ============================================
-- 9. PAYMENTS TABLE
-- ============================================

CREATE TABLE public.payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id UUID REFERENCES public.invoices(id) ON DELETE CASCADE NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  currency TEXT DEFAULT 'USD',
  method public.payment_method NOT NULL,
  transaction_ref TEXT,
  received_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  received_by UUID REFERENCES auth.users(id),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_payments_invoice ON public.payments(invoice_id);

ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Staff can view payments"
  ON public.payments FOR SELECT
  TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin') OR
    public.has_role(auth.uid(), 'billing') OR
    public.has_role(auth.uid(), 'manager')
  );

CREATE POLICY "Billing staff can manage payments"
  ON public.payments FOR ALL
  USING (
    public.has_role(auth.uid(), 'admin') OR
    public.has_role(auth.uid(), 'billing')
  );

-- ============================================
-- 10. TRIGGERS & FUNCTIONS
-- ============================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

-- Apply updated_at triggers
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_clinics_updated_at
  BEFORE UPDATE ON public.clinics
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_patients_updated_at
  BEFORE UPDATE ON public.patients
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_services_updated_at
  BEFORE UPDATE ON public.services
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_appointments_updated_at
  BEFORE UPDATE ON public.appointments
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_invoices_updated_at
  BEFORE UPDATE ON public.invoices
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Auto-create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, first_name, last_name)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'first_name', 'User'),
    COALESCE(NEW.raw_user_meta_data->>'last_name', '')
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================
-- 11. SEED DATA
-- ============================================

-- Insert default clinic
INSERT INTO public.clinics (name, timezone, city, country, phone)
VALUES ('Main Clinic', 'UTC', 'City', 'Country', '+1234567890');

-- Insert default services
INSERT INTO public.services (name, code, type, unit_price, description)
VALUES
  ('Initial Consultation', 'CONS-001', 'consultation', 100.00, 'First patient consultation'),
  ('Follow-up Consultation', 'CONS-002', 'consultation', 75.00, 'Follow-up visit'),
  ('SONIK Treatment Session', 'TREAT-001', 'treatment', 200.00, 'SONIK treatment session'),
  ('Registration Fee', 'FEE-001', 'consumable', 25.00, 'Patient registration fee');