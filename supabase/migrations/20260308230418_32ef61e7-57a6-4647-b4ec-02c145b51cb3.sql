-- Allow anyone to view basic profile info (needed for creator profiles across app)
CREATE POLICY "Anyone can view public profiles"
ON public.profiles
FOR SELECT
TO authenticated, anon
USING (true);