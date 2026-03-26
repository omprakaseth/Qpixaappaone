
-- Create favorites table
CREATE TABLE public.favorites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  image_url text NOT NULL,
  prompt text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(user_id, image_url)
);

-- Enable RLS
ALTER TABLE public.favorites ENABLE ROW LEVEL SECURITY;

-- Users can view their own favorites
CREATE POLICY "Users can view own favorites"
  ON public.favorites FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Users can insert own favorites
CREATE POLICY "Users can insert own favorites"
  ON public.favorites FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Users can delete own favorites
CREATE POLICY "Users can delete own favorites"
  ON public.favorites FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());
