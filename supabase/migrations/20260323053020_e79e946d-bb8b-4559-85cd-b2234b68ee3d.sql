
-- Remove the email-based trigger and function
DROP TRIGGER IF EXISTS auto_assign_admin_trigger ON auth.users;
DROP FUNCTION IF EXISTS public.auto_assign_admin();

-- Create or update the has_role function to be secure and support string roles
-- This ensures we can pass 'admin' from JS and it works with the app_role enum
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role TEXT)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role::text = _role
  )
$$;

-- Secure RLS policies for user_roles as requested
DROP POLICY IF EXISTS "admins only" ON public.user_roles;
DROP POLICY IF EXISTS "Users can view own roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can manage roles" ON public.user_roles;

CREATE POLICY "admins only"
ON public.user_roles
FOR ALL
USING (
  auth.uid() IN (
    SELECT user_id FROM user_roles WHERE role::text = 'admin'
  )
);

-- Allow users to see their own roles for the frontend to work
CREATE POLICY "Users can view own roles" ON public.user_roles
  FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));

-- Note: No emails are hardcoded here. 
-- Admin assignment must be done manually via SQL editor with UUID:
-- INSERT INTO public.user_roles (user_id, role) VALUES ('USER_UUID', 'admin') ON CONFLICT DO NOTHING;
