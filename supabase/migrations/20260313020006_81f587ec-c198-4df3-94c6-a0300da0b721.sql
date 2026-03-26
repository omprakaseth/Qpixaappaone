
-- 1. Remove direct INSERT policy on prompt_purchases (force through purchase_prompt RPC)
DROP POLICY IF EXISTS "Users can insert own purchases" ON public.prompt_purchases;

-- 2. Restrict deduct_credit to only allow deducting own credits
CREATE OR REPLACE FUNCTION public.deduct_credit(_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Only allow service role (no auth.uid) or self-deduction
  IF auth.uid() IS NOT NULL AND auth.uid() != _user_id THEN
    RAISE EXCEPTION 'Cannot deduct credits for another user';
  END IF;
  UPDATE profiles SET credits = GREATEST(0, credits - 1) WHERE id = _user_id;
END;
$$;

-- 3. Create a secure view that excludes prompt_text for marketplace browsing
CREATE OR REPLACE VIEW public.marketplace_prompts_safe AS
SELECT 
  id, creator_id, title, description, preview_image, category, model_type,
  price, rating, sales_count, is_featured, is_trending, created_at
FROM public.marketplace_prompts;

-- Grant access to the view
GRANT SELECT ON public.marketplace_prompts_safe TO anon, authenticated;
