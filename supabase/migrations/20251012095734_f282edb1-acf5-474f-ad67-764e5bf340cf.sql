-- Phase 3: Queue Management & Orders System

-- ============================================
-- 1. ENUMS FOR ORDERS & QUEUES
-- ============================================

-- Order types
CREATE TYPE public.order_type AS ENUM ('lab', 'imaging', 'procedure', 'other');

-- Order status
CREATE TYPE public.order_status AS ENUM (
  'draft', 'billed_pending_payment', 'scheduled', 
  'in_progress', 'completed', 'cancelled'
);

-- Queue types
CREATE TYPE public.queue_type AS ENUM (
  'triage', 'doctor', 'lab', 'imaging', 'cashier', 'pharmacy'
);

-- Ticket status
CREATE TYPE public.ticket_status AS ENUM (
  'waiting', 'called', 'no_show', 'served', 'transferred'
);

-- Priority levels
CREATE TYPE public.priority_level AS ENUM ('routine', 'stat', 'vip');

-- ============================================
-- 2. ORDERS TABLE
-- ============================================

CREATE TABLE public.orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID REFERENCES public.patients(id) ON DELETE CASCADE NOT NULL,
  appointment_id UUID REFERENCES public.appointments(id),
  ordered_by UUID REFERENCES auth.users(id) NOT NULL,
  order_type public.order_type NOT NULL,
  status public.order_status DEFAULT 'draft',
  priority public.priority_level DEFAULT 'routine',
  order_payload JSONB NOT NULL DEFAULT '{}',
  notes TEXT,
  linked_invoice_id UUID REFERENCES public.invoices(id),
  scheduled_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  result_payload JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_orders_patient ON public.orders(patient_id);
CREATE INDEX idx_orders_status ON public.orders(status);
CREATE INDEX idx_orders_type ON public.orders(order_type);

ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Staff can view orders"
  ON public.orders FOR SELECT
  TO authenticated
  USING (
    has_role(auth.uid(), 'admin') OR
    has_role(auth.uid(), 'clinician') OR
    has_role(auth.uid(), 'billing') OR
    has_role(auth.uid(), 'manager')
  );

CREATE POLICY "Clinicians can create orders"
  ON public.orders FOR INSERT
  TO authenticated
  WITH CHECK (
    has_role(auth.uid(), 'admin') OR
    has_role(auth.uid(), 'clinician')
  );

CREATE POLICY "Staff can update orders"
  ON public.orders FOR UPDATE
  TO authenticated
  USING (
    has_role(auth.uid(), 'admin') OR
    has_role(auth.uid(), 'clinician') OR
    has_role(auth.uid(), 'billing')
  );

-- ============================================
-- 3. QUEUES TABLE
-- ============================================

CREATE TABLE public.queues (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  clinic_id UUID REFERENCES public.clinics(id) NOT NULL,
  queue_type public.queue_type NOT NULL,
  sla_minutes INTEGER DEFAULT 30,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.queues ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Queues are viewable by authenticated users"
  ON public.queues FOR SELECT
  TO authenticated
  USING (TRUE);

CREATE POLICY "Admins can manage queues"
  ON public.queues FOR ALL
  USING (has_role(auth.uid(), 'admin'));

-- ============================================
-- 4. TICKETS TABLE
-- ============================================

CREATE TABLE public.tickets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  token_number TEXT NOT NULL,
  patient_id UUID REFERENCES public.patients(id) ON DELETE CASCADE NOT NULL,
  appointment_id UUID REFERENCES public.appointments(id),
  queue_id UUID REFERENCES public.queues(id) NOT NULL,
  priority public.priority_level DEFAULT 'routine',
  status public.ticket_status DEFAULT 'waiting',
  called_at TIMESTAMPTZ,
  served_at TIMESTAMPTZ,
  served_by UUID REFERENCES auth.users(id),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_tickets_queue ON public.tickets(queue_id);
CREATE INDEX idx_tickets_patient ON public.tickets(patient_id);
CREATE INDEX idx_tickets_status ON public.tickets(status);

ALTER TABLE public.tickets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Staff can view tickets"
  ON public.tickets FOR SELECT
  TO authenticated
  USING (
    has_role(auth.uid(), 'admin') OR
    has_role(auth.uid(), 'reception') OR
    has_role(auth.uid(), 'clinician') OR
    has_role(auth.uid(), 'billing')
  );

CREATE POLICY "Staff can manage tickets"
  ON public.tickets FOR ALL
  USING (
    has_role(auth.uid(), 'admin') OR
    has_role(auth.uid(), 'reception')
  );

-- ============================================
-- 5. REFUNDS TABLE
-- ============================================

CREATE TABLE public.refunds (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  payment_id UUID REFERENCES public.payments(id) ON DELETE CASCADE NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  reason TEXT NOT NULL,
  approved_by UUID REFERENCES auth.users(id),
  processed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.refunds ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Staff can view refunds"
  ON public.refunds FOR SELECT
  TO authenticated
  USING (
    has_role(auth.uid(), 'admin') OR
    has_role(auth.uid(), 'billing') OR
    has_role(auth.uid(), 'manager')
  );

CREATE POLICY "Managers can manage refunds"
  ON public.refunds FOR ALL
  USING (
    has_role(auth.uid(), 'admin') OR
    has_role(auth.uid(), 'manager')
  );

-- ============================================
-- 6. PACKAGES TABLE
-- ============================================

CREATE TABLE public.packages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  code TEXT UNIQUE NOT NULL,
  components JSONB NOT NULL DEFAULT '[]',
  bundle_price DECIMAL(10,2) NOT NULL,
  validity_days INTEGER,
  description TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.packages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Packages are viewable by authenticated users"
  ON public.packages FOR SELECT
  TO authenticated
  USING (TRUE);

CREATE POLICY "Admins can manage packages"
  ON public.packages FOR ALL
  USING (has_role(auth.uid(), 'admin'));

-- ============================================
-- 7. VISITS TABLE (for tracking patient visits)
-- ============================================

CREATE TABLE public.visits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID REFERENCES public.patients(id) ON DELETE CASCADE NOT NULL,
  visit_type TEXT DEFAULT 'walk_in',
  state TEXT DEFAULT 'initiated',
  opened_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  closed_at TIMESTAMPTZ,
  primary_provider_id UUID REFERENCES auth.users(id),
  linked_invoice_id UUID REFERENCES public.invoices(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_visits_patient ON public.visits(patient_id);

ALTER TABLE public.visits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Staff can view visits"
  ON public.visits FOR SELECT
  TO authenticated
  USING (
    has_role(auth.uid(), 'admin') OR
    has_role(auth.uid(), 'reception') OR
    has_role(auth.uid(), 'clinician') OR
    has_role(auth.uid(), 'billing')
  );

CREATE POLICY "Staff can manage visits"
  ON public.visits FOR ALL
  USING (
    has_role(auth.uid(), 'admin') OR
    has_role(auth.uid(), 'reception')
  );

-- ============================================
-- 8. TRIGGERS
-- ============================================

CREATE TRIGGER update_orders_updated_at
  BEFORE UPDATE ON public.orders
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_queues_updated_at
  BEFORE UPDATE ON public.queues
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_tickets_updated_at
  BEFORE UPDATE ON public.tickets
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_packages_updated_at
  BEFORE UPDATE ON public.packages
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_visits_updated_at
  BEFORE UPDATE ON public.visits
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================
-- 9. FUNCTIONS
-- ============================================

-- Function to generate ticket token
CREATE OR REPLACE FUNCTION public.generate_ticket_token(queue_prefix TEXT)
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
  counter INTEGER;
  new_token TEXT;
BEGIN
  counter := (SELECT COUNT(*) FROM public.tickets WHERE created_at::date = CURRENT_DATE) + 1;
  new_token := queue_prefix || LPAD(counter::TEXT, 4, '0');
  RETURN new_token;
END;
$$;

-- Function to auto-update invoice balance when payment is added
CREATE OR REPLACE FUNCTION public.update_invoice_balance()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  total_paid DECIMAL(10,2);
  invoice_total DECIMAL(10,2);
BEGIN
  -- Calculate total payments for this invoice
  SELECT COALESCE(SUM(amount), 0) INTO total_paid
  FROM public.payments
  WHERE invoice_id = NEW.invoice_id;

  -- Get invoice total
  SELECT total_amount INTO invoice_total
  FROM public.invoices
  WHERE id = NEW.invoice_id;

  -- Update invoice balance and status
  UPDATE public.invoices
  SET 
    balance_due = invoice_total - total_paid,
    status = CASE
      WHEN invoice_total - total_paid <= 0 THEN 'paid'::invoice_status
      WHEN total_paid > 0 THEN 'partial'::invoice_status
      ELSE status
    END,
    updated_at = NOW()
  WHERE id = NEW.invoice_id;

  RETURN NEW;
END;
$$;

CREATE TRIGGER on_payment_inserted
  AFTER INSERT ON public.payments
  FOR EACH ROW
  EXECUTE FUNCTION public.update_invoice_balance();

-- ============================================
-- 10. SEED DATA
-- ============================================

-- Seed default queues for main clinic
INSERT INTO public.queues (name, clinic_id, queue_type, sla_minutes)
SELECT 
  'Triage Queue', id, 'triage'::queue_type, 15
FROM public.clinics
WHERE name = 'Main Clinic'
LIMIT 1;

INSERT INTO public.queues (name, clinic_id, queue_type, sla_minutes)
SELECT 
  'Doctor Queue', id, 'doctor'::queue_type, 30
FROM public.clinics
WHERE name = 'Main Clinic'
LIMIT 1;

INSERT INTO public.queues (name, clinic_id, queue_type, sla_minutes)
SELECT 
  'Lab Queue', id, 'lab'::queue_type, 45
FROM public.clinics
WHERE name = 'Main Clinic'
LIMIT 1;

INSERT INTO public.queues (name, clinic_id, queue_type, sla_minutes)
SELECT 
  'Imaging Queue', id, 'imaging'::queue_type, 60
FROM public.clinics
WHERE name = 'Main Clinic'
LIMIT 1;

INSERT INTO public.queues (name, clinic_id, queue_type, sla_minutes)
SELECT 
  'Billing Queue', id, 'cashier'::queue_type, 20
FROM public.clinics
WHERE name = 'Main Clinic'
LIMIT 1;

-- Seed sample packages
INSERT INTO public.packages (name, code, components, bundle_price, validity_days, description)
VALUES 
  (
    'SONIK 6-Session Package',
    'PKG-SONIK-6',
    '[
      {"service_code": "TREAT-001", "quantity": 6}
    ]',
    1000.00,
    90,
    'Package of 6 SONIK treatment sessions - Save $200'
  ),
  (
    'Initial Consultation + 3 Treatments',
    'PKG-STARTER',
    '[
      {"service_code": "CONS-001", "quantity": 1},
      {"service_code": "TREAT-001", "quantity": 3}
    ]',
    650.00,
    60,
    'Starter package with consultation and 3 treatments'
  );