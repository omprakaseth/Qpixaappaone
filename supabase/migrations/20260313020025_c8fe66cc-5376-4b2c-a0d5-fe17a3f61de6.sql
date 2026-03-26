
-- Fix security definer view - use SECURITY INVOKER instead
DROP VIEW IF EXISTS public.marketplace_prompts_safe;
CREATE VIEW public.marketplace_prompts_safe 
WITH (security_invoker = true) AS
SELECT 
  id, creator_id, title, description, preview_image, category, model_type,
  price, rating, sales_count, is_featured, is_trending, created_at
FROM public.marketplace_prompts;

GRANT SELECT ON public.marketplace_prompts_safe TO anon, authenticated;
