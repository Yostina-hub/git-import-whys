-- Create business rules table
CREATE TABLE IF NOT EXISTS public.business_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  code TEXT NOT NULL UNIQUE,
  description TEXT,
  rule_type TEXT NOT NULL, -- 'discount', 'exemption', 'automation', 'validation'
  category TEXT, -- 'billing', 'clinical', 'administrative'
  is_active BOOLEAN DEFAULT true,
  priority INTEGER DEFAULT 0,
  conditions JSONB NOT NULL DEFAULT '[]'::jsonb, -- Array of condition objects
  actions JSONB NOT NULL DEFAULT '[]'::jsonb, -- Array of action objects
  valid_from TIMESTAMP WITH TIME ZONE,
  valid_to TIMESTAMP WITH TIME ZONE,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create discount policies table
CREATE TABLE IF NOT EXISTS public.discount_policies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  code TEXT NOT NULL UNIQUE,
  description TEXT,
  discount_type TEXT NOT NULL, -- 'percentage', 'fixed_amount'
  discount_value NUMERIC(10,2) NOT NULL,
  max_discount_amount NUMERIC(10,2),
  min_purchase_amount NUMERIC(10,2) DEFAULT 0,
  applicable_to TEXT NOT NULL, -- 'all', 'services', 'packages', 'specific_items'
  applicable_items JSONB DEFAULT '[]'::jsonb, -- Array of service/package IDs
  customer_eligibility JSONB DEFAULT '{}'::jsonb, -- Eligibility criteria
  usage_limit INTEGER, -- Max uses per customer
  requires_approval BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  valid_from DATE NOT NULL,
  valid_to DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create exemption policies table
CREATE TABLE IF NOT EXISTS public.exemption_policies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  code TEXT NOT NULL UNIQUE,
  description TEXT,
  exemption_type TEXT NOT NULL, -- 'full_waiver', 'partial_waiver', 'deferred_payment'
  exemption_percentage NUMERIC(5,2), -- For partial waivers
  applies_to TEXT NOT NULL, -- 'all_charges', 'specific_services', 'specific_categories'
  applicable_items JSONB DEFAULT '[]'::jsonb,
  eligibility_criteria JSONB NOT NULL DEFAULT '{}'::jsonb, -- Conditions for eligibility
  requires_documentation BOOLEAN DEFAULT true,
  required_documents JSONB DEFAULT '[]'::jsonb, -- List of required document types
  approval_workflow JSONB DEFAULT '{}'::jsonb, -- Approval chain configuration
  is_active BOOLEAN DEFAULT true,
  valid_from DATE NOT NULL,
  valid_to DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create rule execution log table
CREATE TABLE IF NOT EXISTS public.rule_execution_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rule_id UUID REFERENCES public.business_rules(id) ON DELETE CASCADE,
  executed_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  execution_context JSONB, -- Context data when rule was executed
  conditions_met JSONB, -- Which conditions were satisfied
  actions_taken JSONB, -- Which actions were executed
  result TEXT, -- 'success', 'failure', 'partial'
  error_message TEXT,
  executed_by UUID REFERENCES auth.users(id)
);

-- Enable RLS
ALTER TABLE public.business_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.discount_policies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exemption_policies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rule_execution_log ENABLE ROW LEVEL SECURITY;

-- RLS Policies for business_rules
CREATE POLICY "Business rules are viewable by authenticated users"
  ON public.business_rules FOR SELECT
  USING (true);

CREATE POLICY "Admins can manage business rules"
  ON public.business_rules FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role));

-- RLS Policies for discount_policies
CREATE POLICY "Discount policies are viewable by staff"
  ON public.discount_policies FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'billing'::app_role) OR has_role(auth.uid(), 'reception'::app_role));

CREATE POLICY "Admins can manage discount policies"
  ON public.discount_policies FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role));

-- RLS Policies for exemption_policies
CREATE POLICY "Exemption policies are viewable by staff"
  ON public.exemption_policies FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'billing'::app_role) OR has_role(auth.uid(), 'manager'::app_role));

CREATE POLICY "Admins and managers can manage exemption policies"
  ON public.exemption_policies FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'manager'::app_role));

-- RLS Policies for rule_execution_log
CREATE POLICY "Admins can view rule execution logs"
  ON public.rule_execution_log FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'manager'::app_role));

CREATE POLICY "System can create rule execution logs"
  ON public.rule_execution_log FOR INSERT
  WITH CHECK (true);

-- Add triggers for updated_at
CREATE TRIGGER update_business_rules_updated_at
  BEFORE UPDATE ON public.business_rules
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_discount_policies_updated_at
  BEFORE UPDATE ON public.discount_policies
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_exemption_policies_updated_at
  BEFORE UPDATE ON public.exemption_policies
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();