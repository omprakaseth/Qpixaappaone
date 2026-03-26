
-- Posts table
CREATE TABLE public.posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  prompt text NOT NULL,
  image_url text,
  likes integer NOT NULL DEFAULT 0,
  views integer NOT NULL DEFAULT 0,
  is_hidden boolean NOT NULL DEFAULT false,
  is_featured boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view visible posts" ON public.posts FOR SELECT TO authenticated USING (is_hidden = false OR creator_id = auth.uid() OR has_role(auth.uid(), 'admin'));
CREATE POLICY "Users can insert own posts" ON public.posts FOR INSERT TO authenticated WITH CHECK (creator_id = auth.uid());
CREATE POLICY "Users can update own posts" ON public.posts FOR UPDATE TO authenticated USING (creator_id = auth.uid() OR has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can delete posts" ON public.posts FOR DELETE TO authenticated USING (has_role(auth.uid(), 'admin') OR creator_id = auth.uid());

-- Reports table
CREATE TABLE public.reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id uuid REFERENCES public.posts(id) ON DELETE CASCADE NOT NULL,
  reporter_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  reason text NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'resolved', 'ignored')),
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can create reports" ON public.reports FOR INSERT TO authenticated WITH CHECK (reporter_id = auth.uid());
CREATE POLICY "Admins can view reports" ON public.reports FOR SELECT TO authenticated USING (has_role(auth.uid(), 'admin') OR reporter_id = auth.uid());
CREATE POLICY "Admins can update reports" ON public.reports FOR UPDATE TO authenticated USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can delete reports" ON public.reports FOR DELETE TO authenticated USING (has_role(auth.uid(), 'admin'));

-- Notifications table
CREATE TABLE public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  message text NOT NULL,
  target_audience text NOT NULL DEFAULT 'all' CHECK (target_audience IN ('all', 'creators', 'free')),
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage notifications" ON public.notifications FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin')) WITH CHECK (has_role(auth.uid(), 'admin'));
CREATE POLICY "Users can view notifications" ON public.notifications FOR SELECT TO authenticated USING (true);

-- Admin settings table
CREATE TABLE public.admin_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text UNIQUE NOT NULL,
  value text NOT NULL DEFAULT 'false'
);

ALTER TABLE public.admin_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage settings" ON public.admin_settings FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin')) WITH CHECK (has_role(auth.uid(), 'admin'));
CREATE POLICY "Anyone can read settings" ON public.admin_settings FOR SELECT TO authenticated USING (true);

-- Seed default settings
INSERT INTO public.admin_settings (key, value) VALUES
  ('enable_studio', 'true'),
  ('enable_ads', 'false'),
  ('enable_creator_profiles', 'true');
