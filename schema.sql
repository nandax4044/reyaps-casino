-- ═══════════════════════════════════════════════════════════════════════════════
-- GALAXY CASINO - Complete Database Schema with RLS Policies
-- Run this entire script in Supabase SQL Editor
-- ═══════════════════════════════════════════════════════════════════════════════

-- ─── DROP EXISTING TABLES (if you want fresh start) ────────────────────────────
-- Uncomment these lines if you want to start fresh:
-- DROP TABLE IF EXISTS public.inventory CASCADE;
-- DROP TABLE IF EXISTS public.game_configs CASCADE;
-- DROP TABLE IF EXISTS public.users CASCADE;

-- ─── CREATE TABLES ──────────────────────────────────────────────────────────────

-- 1. Users Table
CREATE TABLE IF NOT EXISTS public.users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    username VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255), -- Optional, only for non-auth users
    balance NUMERIC(15, 2) NOT NULL DEFAULT 500.00,
    is_staff BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. User Inventory Table
CREATE TABLE IF NOT EXISTS public.inventory (
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

-- 3. Game Configs Table
CREATE TABLE IF NOT EXISTS public.game_configs (
    game_type VARCHAR(50) PRIMARY KEY,
    config_data JSONB NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── CREATE INDEXES ─────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_inventory_user_id ON public.inventory(user_id);
CREATE INDEX IF NOT EXISTS idx_users_username ON public.users(username);
CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);
CREATE INDEX IF NOT EXISTS idx_inventory_status ON public.inventory(status);

-- ─── DROP ALL EXISTING RLS POLICIES ─────────────────────────────────────────────
DROP POLICY IF EXISTS "users_select" ON public.users;
DROP POLICY IF EXISTS "users_insert_own" ON public.users;
DROP POLICY IF EXISTS "users_update_own" ON public.users;
DROP POLICY IF EXISTS "users_update_staff" ON public.users;
DROP POLICY IF EXISTS "inventory_select_own" ON public.inventory;
DROP POLICY IF EXISTS "inventory_select_staff" ON public.inventory;
DROP POLICY IF EXISTS "inventory_insert_own" ON public.inventory;
DROP POLICY IF EXISTS "inventory_update_own" ON public.inventory;
DROP POLICY IF EXISTS "inventory_delete_staff" ON public.inventory;
DROP POLICY IF EXISTS "game_configs_select" ON public.game_configs;
DROP POLICY IF EXISTS "game_configs_upsert_staff" ON public.game_configs;
DROP POLICY IF EXISTS "game_configs_insert" ON public.game_configs;
DROP POLICY IF EXISTS "game_configs_update" ON public.game_configs;
DROP POLICY IF EXISTS "game_configs_delete" ON public.game_configs;

-- ─── ENABLE RLS ─────────────────────────────────────────────────────────────────
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.game_configs ENABLE ROW LEVEL SECURITY;

-- ─── USERS TABLE POLICIES ───────────────────────────────────────────────────────

-- Anyone can read all users (for username lookup, online list)
CREATE POLICY "users_select" ON public.users
  FOR SELECT USING (true);

-- Authenticated users can insert their own profile
CREATE POLICY "users_insert_own" ON public.users
  FOR INSERT 
  WITH CHECK (auth.role() = 'authenticated' AND auth.uid() = id);

-- Users can update their own row
CREATE POLICY "users_update_own" ON public.users
  FOR UPDATE 
  USING (auth.uid() = id);

-- Staff can update any user
CREATE POLICY "users_update_staff" ON public.users
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = auth.uid() AND is_staff = true
    )
  );

-- ─── INVENTORY TABLE POLICIES ───────────────────────────────────────────────────

-- Users can read their own inventory
CREATE POLICY "inventory_select_own" ON public.inventory
  FOR SELECT 
  USING (auth.uid() = user_id);

-- Staff can read all inventories
CREATE POLICY "inventory_select_staff" ON public.inventory
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = auth.uid() AND is_staff = true
    )
  );

-- Users can insert into their own inventory
CREATE POLICY "inventory_insert_own" ON public.inventory
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own inventory
CREATE POLICY "inventory_update_own" ON public.inventory
  FOR UPDATE 
  USING (auth.uid() = user_id);

-- Staff can delete any inventory item
CREATE POLICY "inventory_delete_staff" ON public.inventory
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = auth.uid() AND is_staff = true
    )
  );

-- ─── GAME_CONFIGS TABLE POLICIES ────────────────────────────────────────────────

-- Anyone can read game configs
CREATE POLICY "game_configs_select" ON public.game_configs
  FOR SELECT USING (true);

-- Staff can insert/update/delete game configs
-- If no service role key, allow authenticated users to manage configs
CREATE POLICY "game_configs_insert" ON public.game_configs
  FOR INSERT
  WITH CHECK (
    auth.role() = 'authenticated' OR
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = auth.uid() AND is_staff = true
    )
  );

CREATE POLICY "game_configs_update" ON public.game_configs
  FOR UPDATE
  USING (
    auth.role() = 'authenticated' OR
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = auth.uid() AND is_staff = true
    )
  );

CREATE POLICY "game_configs_delete" ON public.game_configs
  FOR DELETE
  USING (
    auth.role() = 'authenticated' OR
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = auth.uid() AND is_staff = true
    )
  );

-- ─── TRIGGER: Auto-create public.users on auth signup ──────────────────────────
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

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ─── GRANT PERMISSIONS ──────────────────────────────────────────────────────────
-- Grant usage on schema
GRANT USAGE ON SCHEMA public TO anon, authenticated;

-- Grant table permissions
GRANT SELECT ON public.users TO anon, authenticated;
GRANT INSERT, UPDATE ON public.users TO authenticated;

GRANT SELECT, INSERT, UPDATE ON public.inventory TO authenticated;
GRANT DELETE ON public.inventory TO authenticated;

GRANT SELECT ON public.game_configs TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.game_configs TO authenticated;

-- Grant sequence permissions (for auto-increment if any)
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- ═══════════════════════════════════════════════════════════════════════════════
-- SETUP COMPLETE! 
-- Now you can:
-- 1. Register/login users
-- 2. Play games and win items (will save to inventory)
-- 3. Staff can manage configs and inventories
-- ═══════════════════════════════════════════════════════════════════════════════
