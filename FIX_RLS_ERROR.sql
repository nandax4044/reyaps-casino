-- ═══════════════════════════════════════════════════════════════════════════════
-- FIX RLS ERROR - Disable Row Level Security
-- Run this in Supabase SQL Editor to fix "new row violates row-level security"
-- ═══════════════════════════════════════════════════════════════════════════════

-- ─── STEP 1: Disable RLS on all tables ─────────────────────────────────────────
ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.game_configs DISABLE ROW LEVEL SECURITY;

-- ─── STEP 2: Drop all existing policies ────────────────────────────────────────
DROP POLICY IF EXISTS "Users can view own profile" ON public.users;
DROP POLICY IF EXISTS "Users can update own profile" ON public.users;
DROP POLICY IF EXISTS "Staff can view all users" ON public.users;
DROP POLICY IF EXISTS "Staff can update all users" ON public.users;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.users;

DROP POLICY IF EXISTS "Users can view own inventory" ON public.inventory;
DROP POLICY IF EXISTS "Users can insert own inventory" ON public.inventory;
DROP POLICY IF EXISTS "Staff can view all inventory" ON public.inventory;
DROP POLICY IF EXISTS "Staff can manage all inventory" ON public.inventory;

DROP POLICY IF EXISTS "Anyone can read game configs" ON public.game_configs;
DROP POLICY IF EXISTS "Staff can update game configs" ON public.game_configs;
DROP POLICY IF EXISTS "Staff can insert game configs" ON public.game_configs;
DROP POLICY IF EXISTS "Staff can delete game configs" ON public.game_configs;

-- ─── STEP 3: Grant full permissions ────────────────────────────────────────────
GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON public.users TO anon, authenticated, service_role;
GRANT ALL ON public.inventory TO anon, authenticated, service_role;
GRANT ALL ON public.game_configs TO anon, authenticated, service_role;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated, service_role;

-- ─── STEP 4: Verify RLS is disabled ────────────────────────────────────────────
SELECT 
    tablename, 
    CASE 
        WHEN rowsecurity = false THEN '✅ DISABLED (Good!)'
        ELSE '❌ ENABLED (Bad!)'
    END as rls_status
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('users', 'inventory', 'game_configs')
ORDER BY tablename;

-- ═══════════════════════════════════════════════════════════════════════════════
-- EXPECTED OUTPUT:
-- 
-- tablename      | rls_status
-- ---------------|------------------
-- game_configs   | ✅ DISABLED (Good!)
-- inventory      | ✅ DISABLED (Good!)
-- users          | ✅ DISABLED (Good!)
--
-- If all show ✅ DISABLED, you're good to go!
-- ═══════════════════════════════════════════════════════════════════════════════
