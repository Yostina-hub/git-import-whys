-- Create AI usage tracking table
CREATE TABLE IF NOT EXISTS public.ai_usage_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  feature_type TEXT NOT NULL,
  tokens_used INTEGER DEFAULT 0,
  cost_estimate NUMERIC(10,4) DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  metadata JSONB DEFAULT '{}'::jsonb
);

-- Create user AI access table
CREATE TABLE IF NOT EXISTS public.user_ai_access (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE,
  ai_enabled BOOLEAN DEFAULT false,
  daily_limit INTEGER DEFAULT 100,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.ai_usage_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_ai_access ENABLE ROW LEVEL SECURITY;

-- RLS Policies for ai_usage_log
CREATE POLICY "Users can view their own AI usage"
ON public.ai_usage_log
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "Admins can view all AI usage"
ON public.ai_usage_log
FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "System can create usage logs"
ON public.ai_usage_log
FOR INSERT
TO authenticated
WITH CHECK (true);

-- RLS Policies for user_ai_access
CREATE POLICY "Users can view their own AI access"
ON public.user_ai_access
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "Admins can manage AI access"
ON public.user_ai_access
FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

-- Insert system settings for AI control
INSERT INTO public.system_settings (setting_key, setting_value, setting_type, category, description)
VALUES 
  ('ai_globally_enabled', 'true', 'boolean', 'ai', 'Enable or disable AI features globally'),
  ('ai_default_daily_limit', '100', 'number', 'ai', 'Default daily AI request limit per user')
ON CONFLICT (setting_key) DO NOTHING;

-- Function to check AI access
CREATE OR REPLACE FUNCTION public.check_ai_access(_user_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  global_enabled BOOLEAN;
  user_enabled BOOLEAN;
  daily_limit INTEGER;
  usage_today INTEGER;
  result JSONB;
BEGIN
  -- Check global setting
  SELECT (setting_value)::boolean INTO global_enabled
  FROM public.system_settings
  WHERE setting_key = 'ai_globally_enabled';
  
  IF NOT global_enabled THEN
    RETURN jsonb_build_object(
      'allowed', false,
      'reason', 'AI services are globally disabled'
    );
  END IF;
  
  -- Check user access
  SELECT ai_enabled, daily_limit INTO user_enabled, daily_limit
  FROM public.user_ai_access
  WHERE user_id = _user_id;
  
  -- If no record exists, deny access
  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'allowed', false,
      'reason', 'AI access not granted for this user'
    );
  END IF;
  
  IF NOT user_enabled THEN
    RETURN jsonb_build_object(
      'allowed', false,
      'reason', 'AI access disabled for this user'
    );
  END IF;
  
  -- Check daily usage
  SELECT COUNT(*) INTO usage_today
  FROM public.ai_usage_log
  WHERE user_id = _user_id
    AND created_at >= CURRENT_DATE;
  
  IF usage_today >= daily_limit THEN
    RETURN jsonb_build_object(
      'allowed', false,
      'reason', 'Daily AI usage limit reached',
      'usage', usage_today,
      'limit', daily_limit
    );
  END IF;
  
  RETURN jsonb_build_object(
    'allowed', true,
    'usage', usage_today,
    'limit', daily_limit,
    'remaining', daily_limit - usage_today
  );
END;
$$;