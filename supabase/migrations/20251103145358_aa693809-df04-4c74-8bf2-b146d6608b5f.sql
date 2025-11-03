-- Add token-based tracking to user_ai_access
ALTER TABLE public.user_ai_access 
ADD COLUMN IF NOT EXISTS token_balance INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS daily_token_limit INTEGER DEFAULT 10000,
ADD COLUMN IF NOT EXISTS auto_recharge BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS payment_method_id TEXT;

-- Create token purchase history table
CREATE TABLE IF NOT EXISTS public.ai_token_purchases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  tokens_purchased INTEGER NOT NULL,
  amount_paid NUMERIC(10,2) NOT NULL,
  payment_status TEXT NOT NULL DEFAULT 'completed',
  stripe_payment_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.ai_token_purchases ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own purchases"
ON public.ai_token_purchases FOR SELECT
TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "Admins can view all purchases"
ON public.ai_token_purchases FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

-- Update check_ai_access function to include token checking
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
  token_balance INTEGER;
  daily_token_limit INTEGER;
  tokens_used_today INTEGER;
BEGIN
  SELECT (setting_value)::boolean INTO global_enabled
  FROM public.system_settings WHERE setting_key = 'ai_globally_enabled';
  
  IF NOT global_enabled THEN
    RETURN jsonb_build_object('allowed', false, 'reason', 'AI services globally disabled');
  END IF;
  
  SELECT ai_enabled, daily_limit, token_balance, daily_token_limit 
  INTO user_enabled, daily_limit, token_balance, daily_token_limit
  FROM public.user_ai_access WHERE user_id = _user_id;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object('allowed', false, 'reason', 'AI access not granted');
  END IF;
  
  IF NOT user_enabled THEN
    RETURN jsonb_build_object('allowed', false, 'reason', 'AI access disabled');
  END IF;
  
  SELECT COUNT(*), COALESCE(SUM(tokens_used), 0) INTO usage_today, tokens_used_today
  FROM public.ai_usage_log
  WHERE user_id = _user_id AND created_at >= CURRENT_DATE;
  
  IF usage_today >= daily_limit THEN
    RETURN jsonb_build_object('allowed', false, 'reason', 'Daily request limit reached');
  END IF;
  
  IF tokens_used_today >= daily_token_limit THEN
    RETURN jsonb_build_object('allowed', false, 'reason', 'Daily token limit reached');
  END IF;
  
  RETURN jsonb_build_object(
    'allowed', true,
    'usage', usage_today,
    'limit', daily_limit,
    'remaining', daily_limit - usage_today,
    'token_balance', token_balance,
    'tokens_used_today', tokens_used_today,
    'daily_token_limit', daily_token_limit,
    'tokens_remaining_today', daily_token_limit - tokens_used_today
  );
END;
$$;