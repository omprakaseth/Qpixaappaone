-- Add subscription_plan to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS subscription_plan text NOT NULL DEFAULT 'free';

-- Update admin to super_admin
UPDATE public.user_roles SET role = 'super_admin' WHERE user_id = '76ccf2a6-f289-4952-897e-1db4c034a2f3';

-- Create function to check super_admin
CREATE OR REPLACE FUNCTION public.is_super_admin(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = 'super_admin'
  )
$$;

-- Update has_role so super_admin passes all admin checks
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND (role = _role OR role = 'super_admin')
  )
$$;