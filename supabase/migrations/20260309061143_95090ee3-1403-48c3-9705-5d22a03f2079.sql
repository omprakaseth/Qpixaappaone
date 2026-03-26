
-- Admin permissions table for controlling sub-admin access
CREATE TABLE public.admin_permissions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  allowed_tabs TEXT[] NOT NULL DEFAULT ARRAY['dashboard'],
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

ALTER TABLE public.admin_permissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Super admins can manage permissions" ON public.admin_permissions
  FOR ALL TO authenticated
  USING (is_super_admin(auth.uid()))
  WITH CHECK (is_super_admin(auth.uid()));

CREATE POLICY "Admins can view own permissions" ON public.admin_permissions
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());
