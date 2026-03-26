
-- Create marketplace_prompts table
CREATE TABLE public.marketplace_prompts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id uuid NOT NULL,
  title text NOT NULL,
  description text NOT NULL DEFAULT '',
  prompt_text text NOT NULL,
  preview_image text,
  category text NOT NULL DEFAULT 'General',
  model_type text NOT NULL DEFAULT 'DALL-E',
  price integer NOT NULL DEFAULT 0,
  rating numeric NOT NULL DEFAULT 0,
  sales_count integer NOT NULL DEFAULT 0,
  is_featured boolean NOT NULL DEFAULT false,
  is_trending boolean NOT NULL DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Create prompt_purchases table
CREATE TABLE public.prompt_purchases (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  prompt_id uuid NOT NULL REFERENCES public.marketplace_prompts(id) ON DELETE CASCADE,
  purchased_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(user_id, prompt_id)
);

-- Enable RLS
ALTER TABLE public.marketplace_prompts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prompt_purchases ENABLE ROW LEVEL SECURITY;

-- marketplace_prompts policies
-- Anyone can browse (but prompt_text hidden via app logic, not column-level)
CREATE POLICY "Anyone can browse marketplace prompts" ON public.marketplace_prompts
  FOR SELECT USING (true);

CREATE POLICY "Authenticated users can insert own prompts" ON public.marketplace_prompts
  FOR INSERT TO authenticated WITH CHECK (creator_id = auth.uid());

CREATE POLICY "Creators and admins can update prompts" ON public.marketplace_prompts
  FOR UPDATE TO authenticated USING (creator_id = auth.uid() OR has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Creators and admins can delete prompts" ON public.marketplace_prompts
  FOR DELETE TO authenticated USING (creator_id = auth.uid() OR has_role(auth.uid(), 'admin'::app_role));

-- prompt_purchases policies
CREATE POLICY "Users can view own purchases" ON public.prompt_purchases
  FOR SELECT TO authenticated USING (user_id = auth.uid());

CREATE POLICY "Users can insert own purchases" ON public.prompt_purchases
  FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());

-- Purchase function: deducts credits atomically
CREATE OR REPLACE FUNCTION public.purchase_prompt(p_prompt_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_price integer;
  v_user_credits integer;
BEGIN
  -- Get prompt price
  SELECT price INTO v_price FROM marketplace_prompts WHERE id = p_prompt_id;
  IF v_price IS NULL THEN RETURN false; END IF;

  -- Check if already purchased
  IF EXISTS (SELECT 1 FROM prompt_purchases WHERE user_id = auth.uid() AND prompt_id = p_prompt_id) THEN
    RETURN true; -- already owned
  END IF;

  -- If free, just insert purchase
  IF v_price = 0 THEN
    INSERT INTO prompt_purchases (user_id, prompt_id) VALUES (auth.uid(), p_prompt_id);
    UPDATE marketplace_prompts SET sales_count = sales_count + 1 WHERE id = p_prompt_id;
    RETURN true;
  END IF;

  -- Check credits
  SELECT credits INTO v_user_credits FROM profiles WHERE id = auth.uid();
  IF v_user_credits < v_price THEN RETURN false; END IF;

  -- Deduct credits and record purchase
  UPDATE profiles SET credits = credits - v_price WHERE id = auth.uid();
  INSERT INTO prompt_purchases (user_id, prompt_id) VALUES (auth.uid(), p_prompt_id);
  UPDATE marketplace_prompts SET sales_count = sales_count + 1 WHERE id = p_prompt_id;

  RETURN true;
END;
$$;
