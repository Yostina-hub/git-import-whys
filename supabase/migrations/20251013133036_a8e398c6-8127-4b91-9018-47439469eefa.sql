-- Add discount tracking columns to invoices table
ALTER TABLE public.invoices 
ADD COLUMN IF NOT EXISTS discount_code TEXT,
ADD COLUMN IF NOT EXISTS discount_amount NUMERIC(10,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS discount_type TEXT;

-- Create a table to track coupon usage
CREATE TABLE IF NOT EXISTS public.coupon_usage (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  coupon_code TEXT NOT NULL,
  invoice_id UUID NOT NULL REFERENCES public.invoices(id),
  patient_id UUID NOT NULL REFERENCES public.patients(id),
  discount_amount NUMERIC(10,2) NOT NULL,
  used_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  used_by UUID REFERENCES public.profiles(id)
);

-- Enable RLS on coupon_usage
ALTER TABLE public.coupon_usage ENABLE ROW LEVEL SECURITY;

-- Create policies for coupon_usage
CREATE POLICY "Staff can view coupon usage" 
ON public.coupon_usage 
FOR SELECT 
USING (
  has_role(auth.uid(), 'admin'::app_role) OR 
  has_role(auth.uid(), 'billing'::app_role) OR 
  has_role(auth.uid(), 'manager'::app_role)
);

CREATE POLICY "Staff can create coupon usage records" 
ON public.coupon_usage 
FOR INSERT 
WITH CHECK (
  has_role(auth.uid(), 'admin'::app_role) OR 
  has_role(auth.uid(), 'billing'::app_role) OR 
  has_role(auth.uid(), 'reception'::app_role)
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_coupon_usage_code ON public.coupon_usage(coupon_code);
CREATE INDEX IF NOT EXISTS idx_coupon_usage_patient ON public.coupon_usage(patient_id);