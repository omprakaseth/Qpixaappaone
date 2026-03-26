
-- Generations history table
CREATE TABLE public.generations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  prompt TEXT NOT NULL,
  image_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.generations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own generations" ON public.generations
  FOR SELECT TO authenticated USING (user_id = auth.uid());

CREATE POLICY "Users can insert own generations" ON public.generations
  FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete own generations" ON public.generations
  FOR DELETE TO authenticated USING (user_id = auth.uid());

CREATE POLICY "Admins can view all generations" ON public.generations
  FOR SELECT TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));
