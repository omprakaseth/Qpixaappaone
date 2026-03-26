
-- Server-side credit deduction function (security definer so it bypasses RLS)
CREATE OR REPLACE FUNCTION public.deduct_credit(_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE profiles SET credits = GREATEST(0, credits - 1) WHERE id = _user_id;
END;
$$;

-- Function to mask prompt_text for non-purchasers
CREATE OR REPLACE FUNCTION public.get_marketplace_prompt_text(p_prompt_id uuid)
RETURNS text
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_text text;
  v_price integer;
  v_creator_id uuid;
BEGIN
  SELECT prompt_text, price, creator_id INTO v_text, v_price, v_creator_id
  FROM marketplace_prompts WHERE id = p_prompt_id;
  
  IF v_text IS NULL THEN RETURN NULL; END IF;
  
  -- Free prompts, creators, admins, and purchasers can see full text
  IF v_price = 0 THEN RETURN v_text; END IF;
  IF v_creator_id = auth.uid() THEN RETURN v_text; END IF;
  IF has_role(auth.uid(), 'admin') THEN RETURN v_text; END IF;
  IF EXISTS (SELECT 1 FROM prompt_purchases WHERE user_id = auth.uid() AND prompt_id = p_prompt_id) THEN
    RETURN v_text;
  END IF;
  
  -- Mask for non-purchasers: show first 30 chars + blur indicator
  RETURN LEFT(v_text, 30) || '... [Purchase to reveal full prompt]';
END;
$$;
