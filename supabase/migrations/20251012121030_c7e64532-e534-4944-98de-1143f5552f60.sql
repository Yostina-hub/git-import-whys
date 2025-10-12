-- Create payment types configuration table
CREATE TABLE IF NOT EXISTS public.payment_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  requires_reference BOOLEAN DEFAULT false,
  icon TEXT,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create price lists table
CREATE TABLE IF NOT EXISTS public.price_lists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  code TEXT NOT NULL UNIQUE,
  description TEXT,
  valid_from DATE NOT NULL,
  valid_to DATE,
  is_active BOOLEAN DEFAULT true,
  is_default BOOLEAN DEFAULT false,
  markup_percentage NUMERIC(5,2) DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create price list items table
CREATE TABLE IF NOT EXISTS public.price_list_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  price_list_id UUID NOT NULL REFERENCES public.price_lists(id) ON DELETE CASCADE,
  service_id UUID NOT NULL REFERENCES public.services(id) ON DELETE CASCADE,
  custom_price NUMERIC(10,2) NOT NULL,
  discount_percentage NUMERIC(5,2) DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(price_list_id, service_id)
);

-- Enable RLS
ALTER TABLE public.payment_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.price_lists ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.price_list_items ENABLE ROW LEVEL SECURITY;

-- RLS Policies for payment_types
CREATE POLICY "Payment types are viewable by authenticated users"
  ON public.payment_types FOR SELECT
  USING (true);

CREATE POLICY "Admins can manage payment types"
  ON public.payment_types FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role));

-- RLS Policies for price_lists
CREATE POLICY "Price lists are viewable by authenticated users"
  ON public.price_lists FOR SELECT
  USING (true);

CREATE POLICY "Admins can manage price lists"
  ON public.price_lists FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role));

-- RLS Policies for price_list_items
CREATE POLICY "Price list items are viewable by authenticated users"
  ON public.price_list_items FOR SELECT
  USING (true);

CREATE POLICY "Admins can manage price list items"
  ON public.price_list_items FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Add triggers for updated_at
CREATE TRIGGER update_payment_types_updated_at
  BEFORE UPDATE ON public.payment_types
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_price_lists_updated_at
  BEFORE UPDATE ON public.price_lists
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_price_list_items_updated_at
  BEFORE UPDATE ON public.price_list_items
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default payment types
INSERT INTO public.payment_types (code, name, description, requires_reference, icon, sort_order) VALUES
  ('cash', 'Cash', 'Cash payment', false, 'Banknote', 1),
  ('card', 'Card', 'Credit/Debit card payment', true, 'CreditCard', 2),
  ('mobile', 'Mobile Money', 'Mobile money transfer', true, 'Smartphone', 3),
  ('bank', 'Bank Transfer', 'Direct bank transfer', true, 'Building2', 4),
  ('insurance', 'Insurance', 'Insurance coverage', true, 'Shield', 5),
  ('check', 'Check', 'Check payment', true, 'FileCheck', 6)
ON CONFLICT (code) DO NOTHING;