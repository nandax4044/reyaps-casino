-- ═══════════════════════════════════════════════════════════════════════════════
-- DATABASE VERIFICATION SCRIPT
-- Run this to check if everything is configured correctly
-- ═══════════════════════════════════════════════════════════════════════════════

-- ─── CHECK 1: RLS Status (should all be FALSE) ─────────────────────────────────
SELECT 
    '✅ RLS Check' as test_name,
    tablename, 
    CASE 
        WHEN rowsecurity = false THEN '✅ DISABLED (Good!)'
        ELSE '❌ ENABLED (Bad! Run cleanup script)'
    END as status
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('users', 'inventory', 'game_configs')
ORDER BY tablename;

-- ─── CHECK 2: Game Configs (should have 0 or 1 row per game_type) ─────────────
SELECT 
    '✅ Duplicate Check' as test_name,
    game_type,
    COUNT(*) as row_count,
    CASE 
        WHEN COUNT(*) = 0 THEN '⚠️ No config (will use JSON default)'
        WHEN COUNT(*) = 1 THEN '✅ Perfect!'
        ELSE '❌ DUPLICATE! Run cleanup script'
    END as status
FROM public.game_configs
GROUP BY game_type

UNION ALL

SELECT 
    '✅ Duplicate Check' as test_name,
    'cases' as game_type,
    0 as row_count,
    '⚠️ No config (will use JSON default)' as status
WHERE NOT EXISTS (SELECT 1 FROM public.game_configs WHERE game_type = 'cases')

UNION ALL

SELECT 
    '✅ Duplicate Check' as test_name,
    'wheel' as game_type,
    0 as row_count,
    '⚠️ No config (will use JSON default)' as status
WHERE NOT EXISTS (SELECT 1 FROM public.game_configs WHERE game_type = 'wheel')

UNION ALL

SELECT 
    '✅ Duplicate Check' as test_name,
    'crash' as game_type,
    0 as row_count,
    '⚠️ No config (will use JSON default)' as status
WHERE NOT EXISTS (SELECT 1 FROM public.game_configs WHERE game_type = 'crash')

ORDER BY test_name, game_type;

-- ─── CHECK 3: Users Table ──────────────────────────────────────────────────────
SELECT 
    '✅ Users Check' as test_name,
    COUNT(*) as total_users,
    COUNT(CASE WHEN is_staff = true THEN 1 END) as admin_count,
    CASE 
        WHEN COUNT(*) = 0 THEN '❌ No users! Register an account'
        WHEN COUNT(CASE WHEN is_staff = true THEN 1 END) = 0 THEN '⚠️ No admin! Set is_staff=true for one user'
        ELSE '✅ Good!'
    END as status
FROM public.users;

-- ─── CHECK 4: Inventory Table ──────────────────────────────────────────────────
SELECT 
    '✅ Inventory Check' as test_name,
    COUNT(*) as total_items,
    COUNT(DISTINCT user_id) as users_with_items,
    '✅ Ready' as status
FROM public.inventory;

-- ─── CHECK 5: Orphaned Inventory Items ─────────────────────────────────────────
SELECT 
    '✅ Orphan Check' as test_name,
    COUNT(*) as orphaned_items,
    CASE 
        WHEN COUNT(*) = 0 THEN '✅ No orphans'
        ELSE '⚠️ Found orphaned items (items without user)'
    END as status
FROM public.inventory i
LEFT JOIN public.users u ON i.user_id = u.id
WHERE u.id IS NULL;

-- ─── CHECK 6: Trigger Status ───────────────────────────────────────────────────
SELECT 
    '✅ Trigger Check' as test_name,
    trigger_name,
    event_object_table,
    CASE 
        WHEN trigger_name = 'on_auth_user_created' THEN '✅ Auto-user creation active'
        ELSE '✅ Active'
    END as status
FROM information_schema.triggers
WHERE trigger_schema = 'public' 
OR event_object_table = 'users';

-- ═══════════════════════════════════════════════════════════════════════════════
-- INTERPRETATION:
-- 
-- ✅ = Everything is good
-- ⚠️ = Warning, but not critical
-- ❌ = Error, needs fixing
--
-- If you see any ❌, run cleanup_database.sql first!
-- ═══════════════════════════════════════════════════════════════════════════════
