-- ============================================================================
-- STEP 1: HAPUS SEMUA TABLE FISHING LAMA
-- ============================================================================
-- Jalankan ini DULU untuk bersihkan database
-- ============================================================================

-- Drop all triggers first
DROP TRIGGER IF EXISTS trigger_create_fishing_inventory ON fishing_access;

-- Drop all functions
DROP FUNCTION IF EXISTS consume_bait(UUID) CASCADE;
DROP FUNCTION IF EXISTS add_fishing_saldo(UUID, INTEGER) CASCADE;
DROP FUNCTION IF EXISTS increment_fish_caught(UUID) CASCADE;
DROP FUNCTION IF EXISTS convert_fishing_to_main_balance(UUID, INTEGER) CASCADE;
DROP FUNCTION IF EXISTS create_fishing_inventory_on_access() CASCADE;
DROP FUNCTION IF EXISTS increment_fishing_saldo(UUID, DECIMAL) CASCADE;
DROP FUNCTION IF EXISTS increment_fishing_saldo(UUID, INTEGER) CASCADE;
DROP FUNCTION IF EXISTS update_equipped_rod(UUID, TEXT) CASCADE;
DROP FUNCTION IF EXISTS grant_bait(UUID, INTEGER, UUID, TEXT) CASCADE;
DROP FUNCTION IF EXISTS deduct_bait(UUID, INTEGER) CASCADE;

-- Drop all tables
DROP TABLE IF EXISTS afk_fishing_sessions CASCADE;
DROP TABLE IF EXISTS fish_inventory CASCADE;
DROP TABLE IF EXISTS fishing_inventory CASCADE;
DROP TABLE IF EXISTS user_fishing_inventory CASCADE;
DROP TABLE IF EXISTS user_rods CASCADE;
DROP TABLE IF EXISTS user_rod_access CASCADE;
DROP TABLE IF EXISTS fishing_access CASCADE;
DROP TABLE IF EXISTS afk_access CASCADE;

-- Verification
DO $$
DECLARE
  v_remaining_tables INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_remaining_tables
  FROM information_schema.tables
  WHERE table_schema = 'public'
    AND table_name LIKE '%fishing%' OR table_name LIKE '%afk%';
  
  RAISE NOTICE '';
  RAISE NOTICE '═══════════════════════════════════════════';
  RAISE NOTICE '✅ CLEANUP COMPLETE!';
  RAISE NOTICE '═══════════════════════════════════════════';
  RAISE NOTICE '';
  RAISE NOTICE 'Remaining fishing/afk tables: %', v_remaining_tables;
  
  IF v_remaining_tables = 0 THEN
    RAISE NOTICE '✅ All fishing tables removed successfully!';
    RAISE NOTICE '';
    RAISE NOTICE '📝 NEXT: Run 2_CREATE_FISHING_SCHEMA.sql';
  ELSE
    RAISE NOTICE '⚠️  Some tables still exist (might be OK)';
  END IF;
  
  RAISE NOTICE '';
END $$;
