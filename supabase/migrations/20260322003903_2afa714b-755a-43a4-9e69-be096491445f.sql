
-- Cart items table for marketplace
CREATE TABLE public.cart_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  prompt_id uuid NOT NULL REFERENCES public.marketplace_prompts(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, prompt_id)
);

ALTER TABLE public.cart_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own cart" ON public.cart_items
  FOR SELECT TO authenticated USING (user_id = auth.uid());

CREATE POLICY "Users can add to cart" ON public.cart_items
  FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can remove from cart" ON public.cart_items
  FOR DELETE TO authenticated USING (user_id = auth.uid());

-- Reviews table for marketplace prompts
CREATE TABLE public.reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  prompt_id uuid NOT NULL REFERENCES public.marketplace_prompts(id) ON DELETE CASCADE,
  rating integer NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment text DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, prompt_id)
);

ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view reviews" ON public.reviews
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Users can insert own reviews" ON public.reviews
  FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own reviews" ON public.reviews
  FOR UPDATE TO authenticated USING (user_id = auth.uid());

CREATE POLICY "Users can delete own reviews" ON public.reviews
  FOR DELETE TO authenticated USING (user_id = auth.uid());

-- Post likes table for real like tracking
CREATE TABLE public.post_likes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  post_id uuid NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, post_id)
);

ALTER TABLE public.post_likes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view likes" ON public.post_likes
  FOR SELECT USING (true);

CREATE POLICY "Users can like" ON public.post_likes
  FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can unlike" ON public.post_likes
  FOR DELETE TO authenticated USING (user_id = auth.uid());

-- Post views table
CREATE TABLE public.post_views (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  post_id uuid NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, post_id)
);

ALTER TABLE public.post_views ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view post_views" ON public.post_views
  FOR SELECT USING (true);

CREATE POLICY "Users can record views" ON public.post_views
  FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());

-- Enable realtime for cart_items
ALTER PUBLICATION supabase_realtime ADD TABLE public.cart_items;
