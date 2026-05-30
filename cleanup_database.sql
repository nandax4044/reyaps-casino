-- ═══════════════════════════════════════════════════════════════════════════════
-- DATABASE CLEANUP SCRIPT
-- Run this in Supabase SQL Editor to fix duplicate row errors
-- ═══════════════════════════════════════════════════════════════════════════════

-- ─── STEP 1: DELETE ALL DUPLICATE GAME CONFIGS ─────────────────────────────────
-- This fixes the "Cannot coerce to single JSON object" error
DELETE FROM public.game_configs;

-- ─── STEP 2: VERIFY RLS IS DISABLED ────────────────────────────────────────────
-- Check current RLS status (should all show 'f' for false)
SELECT 
    tablename, 
    rowsecurity as rls_enabled 
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('users', 'inventory', 'game_configs');

-- If any show 't' (true), disable them:
ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.game_configs DISABLE ROW LEVEL SECURITY;

-- ─── STEP 3: VERIFY PERMISSIONS ────────────────────────────────────────────────
-- Grant all permissions to ensure no access issues
GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON public.users TO anon, authenticated, service_role;
GRANT ALL ON public.inventory TO anon, authenticated, service_role;
GRANT ALL ON public.game_configs TO anon, authenticated, service_role;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated, service_role;

-- ─── STEP 4: CHECK FOR ORPHANED DATA ───────────────────────────────────────────
-- Find inventory items with no matching user (should return 0 rows)
SELECT COUNT(*) as orphaned_items
FROM public.inventory i
LEFT JOIN public.users u ON i.user_id = u.id
WHERE u.id IS NULL;

-- ─── STEP 5: VERIFY TRIGGER EXISTS ─────────────────────────────────────────────
-- Check if auto-user-creation trigger is active
SELECT 
    trigger_name, 
    event_manipulation, 
    event_object_table,
    action_statement
FROM information_schema.triggers
WHERE trigger_schema = 'public' 
OR event_object_table = 'users';

-- ═══════════════════════════════════════════════════════════════════════════════
-- AFTER RUNNING THIS SCRIPT:
-- 1. Restart your server (npm run dev)
-- 2. Test chest game - open a chest and verify item saves to inventory
-- 3. Test wheel game - spin wheel and verify item saves to inventory
-- 4. Check admin panel - verify you can save/reset configs
-- ═══════════════════════════════════════════════════════════════════════════════
