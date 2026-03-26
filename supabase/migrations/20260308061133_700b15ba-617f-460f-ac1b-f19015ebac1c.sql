-- Drop the current permissive user update policy
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;

-- Create a restricted policy that only allows updating safe columns
CREATE POLICY "Users can update own profile safe columns"
ON public.profiles
FOR UPDATE
TO authenticated
USING (id = auth.uid())
WITH CHECK (id = auth.uid());

-- Create a trigger to prevent users from changing credits and is_banned
CREATE OR REPLACE FUNCTION public.prevent_profile_privilege_escalation()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  -- If the user is not an admin, prevent changing credits and is_banned
  IF NOT has_role(auth.uid(), 'admin') THEN
    NEW.credits := OLD.credits;
    NEW.is_banned := OLD.is_banned;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS protect_profile_fields ON public.profiles;
CREATE TRIGGER protect_profile_fields
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.prevent_profile_privilege_escalation();