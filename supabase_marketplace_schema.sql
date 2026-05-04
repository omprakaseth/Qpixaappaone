-- SQL for creating Marketplace related tables in Supabase

-- 1. Marketplace Prompts Table
CREATE TABLE IF NOT EXISTS public.marketplace_prompts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT DEFAULT '',
    prompt_text TEXT NOT NULL,
    price NUMERIC DEFAULT 0,
    category TEXT DEFAULT 'General',
    preview_image TEXT,
    creator_id UUID REFERENCES auth.users(id) NOT NULL,
    sales_count INTEGER DEFAULT 0,
    rating NUMERIC DEFAULT 5.0,
    is_featured BOOLEAN DEFAULT FALSE,
    is_trending BOOLEAN DEFAULT FALSE,
    model_type TEXT DEFAULT 'DALL-E 3',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Prompt Purchases Table (to track who bought what)
CREATE TABLE IF NOT EXISTS public.prompt_purchases (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) NOT NULL,
    prompt_id UUID REFERENCES public.marketplace_prompts(id) NOT NULL,
    purchased_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(user_id, prompt_id)
);

-- 3. Cart Items Table
CREATE TABLE IF NOT EXISTS public.cart_items (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) NOT NULL,
    prompt_id UUID REFERENCES public.marketplace_prompts(id) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(user_id, prompt_id)
);

-- 4. Reviews Table
CREATE TABLE IF NOT EXISTS public.reviews (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) NOT NULL,
    prompt_id UUID REFERENCES public.marketplace_prompts(id) NOT NULL,
    rating INTEGER CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable Row Level Security (RLS)
ALTER TABLE public.marketplace_prompts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prompt_purchases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cart_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

-- Policies for marketplace_prompts
CREATE POLICY "Public read access" ON public.marketplace_prompts FOR SELECT USING (true);
CREATE POLICY "Authenticated users can create prompts" ON public.marketplace_prompts FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Policies for prompt_purchases
CREATE POLICY "Users can see their own purchases" ON public.prompt_purchases FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "System can insert purchases" ON public.prompt_purchases FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Policies for cart_items
CREATE POLICY "Users can manage their own cart" ON public.cart_items FOR ALL USING (auth.uid() = user_id);

-- Policies for reviews
CREATE POLICY "Public can read reviews" ON public.reviews FOR SELECT USING (true);
CREATE POLICY "Users can manage their own reviews" ON public.reviews FOR ALL USING (auth.uid() = user_id);

-- Function to get prompt text only if purchased (Security)
CREATE OR REPLACE FUNCTION get_marketplace_prompt_text(p_prompt_id UUID)
RETURNS TEXT AS $$
DECLARE
    v_prompt_text TEXT;
BEGIN
    -- Check if user is the creator or has purchased the prompt
    IF EXISTS (
        SELECT 1 FROM public.marketplace_prompts WHERE id = p_prompt_id AND creator_id = auth.uid()
    ) OR EXISTS (
        SELECT 1 FROM public.prompt_purchases WHERE prompt_id = p_prompt_id AND user_id = auth.uid()
    ) THEN
        SELECT prompt_text INTO v_prompt_text FROM public.marketplace_prompts WHERE id = p_prompt_id;
        RETURN v_prompt_text;
    ELSE
        RETURN 'Purchase required to view prompt text';
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
