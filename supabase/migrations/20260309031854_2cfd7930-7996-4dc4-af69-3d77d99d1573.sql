CREATE TABLE public.follows (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  follower_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  following_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(follower_id, following_id)
);

ALTER TABLE public.follows ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own follows" ON public.follows FOR SELECT USING (follower_id = auth.uid());
CREATE POLICY "Users can follow" ON public.follows FOR INSERT WITH CHECK (follower_id = auth.uid());
CREATE POLICY "Users can unfollow" ON public.follows FOR DELETE USING (follower_id = auth.uid());
CREATE POLICY "Anyone can check follower count" ON public.follows FOR SELECT USING (true);