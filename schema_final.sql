-- ═══════════════════════════════════════════════════════════════════════════════
-- GALAXY CASINO - FINAL WORKING SCHEMA
-- Copy dan paste SEMUA script ini ke Supabase SQL Editor, lalu klik RUN
-- ═══════════════════════════════════════════════════════════════════════════════

-- ─── STEP 1: DROP EVERYTHING (Clean Slate) ─────────────────────────────────────
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;

DROP TABLE IF EXISTS public.inventory CASCADE;
DROP TABLE IF EXISTS public.game_configs CASCADE;
DROP TABLE IF EXISTS public.users CASCADE;

-- ─── STEP 2: CREATE TABLES ─────────────────────────────────────────────────────

CREATE TABLE public.users (
    id UUID PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    username VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255),
    balance NUMERIC(15, 2) NOT NULL DEFAULT 500.00,
    is_staff BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE public.inventory (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    item_name VARCHAR(255) NOT NULL,
    rarity VARCHAR(50) NOT NULL,
    value NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
    icon VARCHAR(50),
    image TEXT,
    obtained_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    status VARCHAR(50) NOT NULL DEFAULT 'available'
);

CREATE TABLE public.game_configs (
    game_type VARCHAR(50) PRIMARY KEY,
    config_data JSONB NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── STEP 3: CREATE INDEXES ────────────────────────────────────────────────────
CREATE INDEX idx_inventory_user_id ON public.inventory(user_id);
CREATE INDEX idx_inventory_status ON public.inventory(status);
CREATE INDEX idx_users_username ON public.users(username);
CREATE INDEX idx_users_email ON public.users(email);
CREATE INDEX idx_users_staff ON public.users(is_staff);

-- ─── STEP 4: DISABLE RLS (Simplest for Development) ────────────────────────────
ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.game_configs DISABLE ROW LEVEL SECURITY;

-- ─── STEP 5: GRANT PERMISSIONS ─────────────────────────────────────────────────
GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON public.users TO anon, authenticated, service_role;
GRANT ALL ON public.inventory TO anon, authenticated, service_role;
GRANT ALL ON public.game_configs TO anon, authenticated, service_role;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated, service_role;

-- ─── STEP 6: CREATE TRIGGER FOR AUTO USER CREATION ─────────────────────────────
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER 
LANGUAGE plpgsql 
SECURITY DEFINER 
SET search_path = public 
AS $$
BEGIN
  INSERT INTO public.users (id, email, username, balance, is_staff)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'username', split_part(NEW.email, '@', 1)),
    500.00,
    FALSE
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ═══════════════════════════════════════════════════════════════════════════════
-- DONE! Schema created with RLS DISABLED for easy development
-- All operations will work without permission issues
-- ═══════════════════════════════════════════════════════════════════════════════
