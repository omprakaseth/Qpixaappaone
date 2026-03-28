-- SQL Schema for Qpixa App

-- 1. Profiles Table (Already exists, but adding missing columns if any)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  username TEXT UNIQUE,
  display_name TEXT,
  avatar_url TEXT,
  bio TEXT,
  credits INTEGER DEFAULT 40,
  is_banned BOOLEAN DEFAULT FALSE,
  is_verified BOOLEAN DEFAULT FALSE,
  subscription_plan TEXT DEFAULT 'free',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  cover_url TEXT
);

-- 2. Posts Table
CREATE TABLE IF NOT EXISTS public.posts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  image_url TEXT NOT NULL,
  creator_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  prompt TEXT NOT NULL,
  tags TEXT[] DEFAULT '{}',
  category TEXT,
  style TEXT,
  aspect_ratio TEXT DEFAULT '1:1',
  views INTEGER DEFAULT 0,
  likes INTEGER DEFAULT 0,
  saves INTEGER DEFAULT 0,
  comments INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Post Likes Table
CREATE TABLE IF NOT EXISTS public.post_likes (
  post_id UUID REFERENCES public.posts(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  PRIMARY KEY (post_id, user_id)
);

-- 4. Favorites Table (Replaces post_saves)
CREATE TABLE IF NOT EXISTS public.favorites (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  prompt TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 5. Marketplace Prompts Table
CREATE TABLE IF NOT EXISTS public.marketplace_prompts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  creator_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  prompt_text TEXT NOT NULL,
  preview_image TEXT NOT NULL,
  preview_images TEXT[] DEFAULT '{}',
  category TEXT,
  model_type TEXT,
  price INTEGER DEFAULT 0,
  rating NUMERIC DEFAULT 0,
  sales_count INTEGER DEFAULT 0,
  is_featured BOOLEAN DEFAULT FALSE,
  is_trending BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 6. Purchases Table
CREATE TABLE IF NOT EXISTS public.purchases (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  prompt_id UUID REFERENCES public.marketplace_prompts(id) ON DELETE CASCADE,
  price_paid INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(user_id, prompt_id)
);

-- 7. Generations Table (For Studio History)
CREATE TABLE IF NOT EXISTS public.generations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  prompt TEXT NOT NULL,
  image_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 8. Follows Table
CREATE TABLE IF NOT EXISTS public.follows (
  follower_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  following_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  PRIMARY KEY (follower_id, following_id)
);

-- Enable RLS (Row Level Security)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.post_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.favorites ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.marketplace_prompts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.purchases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.generations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.follows ENABLE ROW LEVEL SECURITY;

-- RLS Policies

-- Profiles: Anyone can read, users can update their own
CREATE POLICY "Public profiles are viewable by everyone." ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Users can insert their own profile." ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "Users can update own profile." ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- Posts: Anyone can read, authenticated users can create, users can update/delete their own
CREATE POLICY "Posts are viewable by everyone." ON public.posts FOR SELECT USING (true);
CREATE POLICY "Authenticated users can create posts." ON public.posts FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Users can update own posts." ON public.posts FOR UPDATE USING (auth.uid() = creator_id);
CREATE POLICY "Users can delete own posts." ON public.posts FOR DELETE USING (auth.uid() = creator_id);

-- Post Likes: Anyone can read, authenticated users can insert/delete their own
CREATE POLICY "Likes are viewable by everyone." ON public.post_likes FOR SELECT USING (true);
CREATE POLICY "Users can insert their own likes." ON public.post_likes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete their own likes." ON public.post_likes FOR DELETE USING (auth.uid() = user_id);

-- Favorites: Users can read their own favorites, insert/delete their own
CREATE POLICY "Users can view their own favorites." ON public.favorites FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own favorites." ON public.favorites FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete their own favorites." ON public.favorites FOR DELETE USING (auth.uid() = user_id);

-- Marketplace Prompts: Anyone can read, authenticated users can create, users can update/delete their own
CREATE POLICY "Marketplace prompts are viewable by everyone." ON public.marketplace_prompts FOR SELECT USING (true);
CREATE POLICY "Authenticated users can create marketplace prompts." ON public.marketplace_prompts FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Users can update own marketplace prompts." ON public.marketplace_prompts FOR UPDATE USING (auth.uid() = creator_id);
CREATE POLICY "Users can delete own marketplace prompts." ON public.marketplace_prompts FOR DELETE USING (auth.uid() = creator_id);

-- Purchases: Users can read their own purchases, system handles inserts (via RPC or backend)
CREATE POLICY "Users can view their own purchases." ON public.purchases FOR SELECT USING (auth.uid() = user_id);
-- Insert policy for purchases can be restricted or handled via a secure RPC function

-- Generations: Users can read, insert, and delete their own generations
CREATE POLICY "Users can view their own generations." ON public.generations FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own generations." ON public.generations FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete their own generations." ON public.generations FOR DELETE USING (auth.uid() = user_id);

-- Follows: Anyone can read, users can insert/delete their own follows
CREATE POLICY "Follows are viewable by everyone." ON public.follows FOR SELECT USING (true);
CREATE POLICY "Users can insert their own follows." ON public.follows FOR INSERT WITH CHECK (auth.uid() = follower_id);
CREATE POLICY "Users can delete their own follows." ON public.follows FOR DELETE USING (auth.uid() = follower_id);

-- RPC Function to safely purchase a prompt
CREATE OR REPLACE FUNCTION purchase_prompt(p_prompt_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_price INTEGER;
  v_user_credits INTEGER;
BEGIN
  -- Get prompt price
  SELECT price INTO v_price FROM public.marketplace_prompts WHERE id = p_prompt_id;
  IF v_price IS NULL THEN
    RAISE EXCEPTION 'Prompt not found';
  END IF;

  -- Get user credits
  SELECT credits INTO v_user_credits FROM public.profiles WHERE id = auth.uid();
  IF v_user_credits IS NULL THEN
    RAISE EXCEPTION 'User profile not found';
  END IF;

  -- Check if user has enough credits
  IF v_user_credits < v_price THEN
    RAISE EXCEPTION 'Insufficient credits';
  END IF;

  -- Check if already purchased
  IF EXISTS (SELECT 1 FROM public.purchases WHERE user_id = auth.uid() AND prompt_id = p_prompt_id) THEN
    RETURN TRUE; -- Already purchased
  END IF;

  -- Deduct credits
  UPDATE public.profiles SET credits = credits - v_price WHERE id = auth.uid();

  -- Record purchase
  INSERT INTO public.purchases (user_id, prompt_id, price_paid) VALUES (auth.uid(), p_prompt_id, v_price);

  -- Increment sales count
  UPDATE public.marketplace_prompts SET sales_count = sales_count + 1 WHERE id = p_prompt_id;

  RETURN TRUE;
END;
$$;

-- RPC Function to get prompt text (only if purchased or free or owner)
CREATE OR REPLACE FUNCTION get_marketplace_prompt_text(p_prompt_id UUID)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_prompt_text TEXT;
  v_price INTEGER;
  v_creator_id UUID;
  v_has_purchased BOOLEAN;
BEGIN
  SELECT prompt_text, price, creator_id INTO v_prompt_text, v_price, v_creator_id 
  FROM public.marketplace_prompts WHERE id = p_prompt_id;

  IF v_prompt_text IS NULL THEN
    RETURN NULL;
  END IF;

  -- If free, return text
  IF v_price = 0 THEN
    RETURN v_prompt_text;
  END IF;

  -- If user is the creator, return text
  IF auth.uid() = v_creator_id THEN
    RETURN v_prompt_text;
  END IF;

  -- Check if purchased
  SELECT EXISTS(SELECT 1 FROM public.purchases WHERE user_id = auth.uid() AND prompt_id = p_prompt_id) INTO v_has_purchased;
  
  IF v_has_purchased THEN
    RETURN v_prompt_text;
  END IF;

  RETURN NULL; -- Not authorized
END;
$$;
