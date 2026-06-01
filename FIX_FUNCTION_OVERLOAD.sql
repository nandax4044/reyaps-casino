-- ============================================================================
-- FIX FUNCTION OVERLOADING ISSUE
-- ============================================================================
-- Problem: Multiple versions of increment_fishing_saldo exist
-- Solution: Drop all versions and create one with correct type
-- ============================================================================

-- Drop all versions of increment_fishing_saldo
DROP FUNCTION IF EXISTS increment_fishing_saldo(UUID, INTEGER);
DROP FUNCTION IF EXISTS increment_fishing_saldo(UUID, NUMERIC);
DROP FUNCTION IF EXISTS increment_fishing_saldo(UUID, DECIMAL);
DROP FUNCTION IF EXISTS increment_fishing_saldo(p_user_id UUID, p_amount INTEGER);
DROP FUNCTION IF EXISTS increment_fishing_saldo(p_user_id UUID, p_amount NUMERIC);
DROP FUNCTION IF EXISTS increment_fishing_saldo(p_user_id UUID, p_amount DECIMAL);

-- Create the correct version (using INTEGER to match sell_price)
CREATE OR REPLACE FUNCTION increment_fishing_saldo(p_user_id UUID, p_amount INTEGER)
RETURNS VOID AS $$
BEGIN
  UPDATE user_fishing_inventory
  SET fishing_saldo = fishing_saldo + p_amount, updated_at = NOW()
  WHERE user_id = p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION increment_fishing_saldo(UUID, INTEGER) TO service_role;

-- Verify
DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '═══════════════════════════════════════════════════════════';
  RAISE NOTICE '✅ FUNCTION OVERLOAD FIXED!';
  RAISE NOTICE '═══════════════════════════════════════════════════════════';
  RAISE NOTICE '';
  RAISE NOTICE '✅ Dropped all old versions of increment_fishing_saldo';
  RAISE NOTICE '✅ Created new version: increment_fishing_saldo(UUID, INTEGER)';
  RAISE NOTICE '✅ Granted execute permission to service_role';
  RAISE NOTICE '';
  RAISE NOTICE '📝 NEXT STEP:';
  RAISE NOTICE '   Restart server: npm run dev:no-watch';
  RAISE NOTICE '   Test fishing again';
  RAISE NOTICE '';
  RAISE NOTICE '═══════════════════════════════════════════════════════════';
  RAISE NOTICE '';
END $$;
