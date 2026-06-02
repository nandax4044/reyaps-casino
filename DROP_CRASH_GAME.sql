-- ================================================================
-- DROP CRASH GAME TABLES AND DATA
-- Run this in Supabase SQL Editor to remove Crash game completely
-- ================================================================

-- Drop crash game related tables (if they exist)
DROP TABLE IF EXISTS crash_game_history CASCADE;
DROP TABLE IF EXISTS crash_bets CASCADE;
DROP TABLE IF EXISTS crash_sessions CASCADE;

-- Remove crash config from game_configs table
DELETE FROM game_configs WHERE game_type = 'crash';

-- Verify tables are dropped
SELECT 
    table_name, 
    table_type
FROM 
    information_schema.tables
WHERE 
    table_schema = 'public'
    AND table_name LIKE '%crash%'
ORDER BY 
    table_name;

-- Expected: No rows returned (all crash tables removed)

COMMENT ON SCHEMA public IS 'Crash game removed - focusing on Fishing and Cases only';
