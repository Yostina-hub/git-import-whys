-- Insert Registration Fee service if it doesn't exist
INSERT INTO public.services (code, name, description, type, unit_price, tax_rate, is_active)
VALUES (
  'REG-FEE',
  'Patient Registration Fee',
  'One-time fee charged during patient registration',
  'administrative',
  50.00,
  0,
  true
)
ON CONFLICT (code) DO NOTHING;