-- ============================================================================
-- FIX ALL FUNCTION OVERLOADING ISSUES
-- ============================================================================
-- This fixes ALL function overloading problems at once
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '═══════════════════════════════════════════════════════════';
  RAISE NOTICE 'Fixing all function overloading issues...';
  RAISE NOTICE '═══════════════════════════════════════════════════════════';
  RAISE NOTICE '';
END $$;

-- ============================================================================
-- FIX 1: increment_fishing_saldo
-- ============================================================================

-- Drop all versions
DROP FUNCTION IF EXISTS increment_fishing_saldo(UUID, INTEGER);
DROP FUNCTION IF EXISTS increment_fishing_saldo(UUID, NUMERIC);
DROP FUNCTION IF EXISTS increment_fishing_saldo(UUID, DECIMAL);
DROP FUNCTION IF EXISTS increment_fishing_saldo(p_user_id UUID, p_amount INTEGER);
DROP FUNCTION IF EXISTS increment_fishing_saldo(p_user_id UUID, p_amount NUMERIC);
DROP FUNCTION IF EXISTS increment_fishing_saldo(p_user_id UUID, p_amount DECIMAL);

-- Create correct version
CREATE FUNCTION increment_fishing_saldo(p_user_id UUID, p_amount INTEGER)
RETURNS VOID AS $$
BEGIN
  UPDATE user_fishing_inventory
  SET fishing_saldo = fishing_saldo + p_amount, updated_at = NOW()
  WHERE user_id = p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION increment_fishing_saldo(UUID, INTEGER) TO service_role;

DO $$
BEGIN
  RAISE NOTICE '✅ Fixed increment_fishing_saldo';
END $$;

-- ============================================================================
-- FIX 2: increment_fish_caught
-- ============================================================================

-- Drop all versions
DROP FUNCTION IF EXISTS increment_fish_caught(UUID);
DROP FUNCTION IF EXISTS increment_fish_caught(UUID, INTEGER);
DROP FUNCTION IF EXISTS increment_fish_caught(p_user_id UUID);
DROP FUNCTION IF EXISTS increment_fish_caught(p_user_id UUID, p_count INTEGER);

-- Create correct version (no count parameter, always increment by 1)
CREATE FUNCTION increment_fish_caught(p_user_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE user_fishing_inventory
  SET total_fish_caught = total_fish_caught + 1, updated_at = NOW()
  WHERE user_id = p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION increment_fish_caught(UUID) TO service_role;

DO $$
BEGIN
  RAISE NOTICE '✅ Fixed increment_fish_caught';
END $$;

-- ============================================================================
-- FIX 3: grant_bait (ensure only one version exists)
-- ============================================================================

-- Drop all versions
DROP FUNCTION IF EXISTS grant_bait(UUID, INTEGER, UUID, TEXT);
DROP FUNCTION IF EXISTS grant_bait(UUID, INTEGER, UUID);
DROP FUNCTION IF EXISTS grant_bait(p_user_id UUID, p_amount INTEGER, p_granted_by UUID, p_notes TEXT);
DROP FUNCTION IF EXISTS grant_bait(p_user_id UUID, p_amount INTEGER, p_granted_by UUID);

-- Create correct version
CREATE FUNCTION grant_bait(
  p_user_id UUID, 
  p_amount INTEGER, 
  p_granted_by UUID, 
  p_notes TEXT DEFAULT NULL
)
RETURNS INTEGER AS $$
DECLARE
  v_new_bait_balance INTEGER;
BEGIN
  -- Ensure user has fishing inventory
  INSERT INTO user_fishing_inventory (user_id, bait_balance)
  VALUES (p_user_id, 0)
  ON CONFLICT (user_id) DO NOTHING;
  
  -- Update bait balance
  UPDATE user_fishing_inventory
  SET bait_balance = bait_balance + p_amount, updated_at = NOW()
  WHERE user_id = p_user_id
  RETURNING bait_balance INTO v_new_bait_balance;
  
  -- Record transaction
  INSERT INTO bait_transactions (user_id, amount, transaction_type, granted_by, notes)
  VALUES (p_user_id, p_amount, 'grant', p_granted_by, p_notes);
  
  RETURN v_new_bait_balance;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION grant_bait(UUID, INTEGER, UUID, TEXT) TO service_role;

DO $$
BEGIN
  RAISE NOTICE '✅ Fixed grant_bait';
END $$;

-- ============================================================================
-- FIX 4: update_equipped_rod (ensure only one version exists)
-- ============================================================================

-- Drop all versions
DROP FUNCTION IF EXISTS update_equipped_rod(UUID, TEXT);
DROP FUNCTION IF EXISTS update_equipped_rod(p_user_id UUID, p_rod TEXT);

-- Create correct version
CREATE FUNCTION update_equipped_rod(p_user_id UUID, p_rod TEXT)
RETURNS VOID AS $$
BEGIN
  UPDATE user_fishing_inventory
  SET equipped_rod = p_rod, updated_at = NOW()
  WHERE user_id = p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION update_equipped_rod(UUID, TEXT) TO service_role;

DO $$
BEGIN
  RAISE NOTICE '✅ Fixed update_equipped_rod';
END $$;

-- ============================================================================
-- VERIFY ALL FUNCTIONS
-- ============================================================================

DO $$
DECLARE
  v_increment_saldo_count INTEGER;
  v_increment_fish_count INTEGER;
  v_grant_bait_count INTEGER;
  v_update_rod_count INTEGER;
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '═══════════════════════════════════════════════════════════';
  RAISE NOTICE 'Verifying functions...';
  RAISE NOTICE '═══════════════════════════════════════════════════════════';
  RAISE NOTICE '';
  
  -- Count versions of each function
  SELECT COUNT(*) INTO v_increment_saldo_count
  FROM pg_proc WHERE proname = 'increment_fishing_saldo';
  
  SELECT COUNT(*) INTO v_increment_fish_count
  FROM pg_proc WHERE proname = 'increment_fish_caught';
  
  SELECT COUNT(*) INTO v_grant_bait_count
  FROM pg_proc WHERE proname = 'grant_bait';
  
  SELECT COUNT(*) INTO v_update_rod_count
  FROM pg_proc WHERE proname = 'update_equipped_rod';
  
  -- Verify only 1 version of each exists
  IF v_increment_saldo_count = 1 THEN
    RAISE NOTICE '✅ increment_fishing_saldo: 1 version (correct)';
  ELSE
    RAISE EXCEPTION '❌ increment_fishing_saldo: % versions (should be 1)', v_increment_saldo_count;
  END IF;
  
  IF v_increment_fish_count = 1 THEN
    RAISE NOTICE '✅ increment_fish_caught: 1 version (correct)';
  ELSE
    RAISE EXCEPTION '❌ increment_fish_caught: % versions (should be 1)', v_increment_fish_count;
  END IF;
  
  IF v_grant_bait_count = 1 THEN
    RAISE NOTICE '✅ grant_bait: 1 version (correct)';
  ELSE
    RAISE EXCEPTION '❌ grant_bait: % versions (should be 1)', v_grant_bait_count;
  END IF;
  
  IF v_update_rod_count = 1 THEN
    RAISE NOTICE '✅ update_equipped_rod: 1 version (correct)';
  ELSE
    RAISE EXCEPTION '❌ update_equipped_rod: % versions (should be 1)', v_update_rod_count;
  END IF;
  
  RAISE NOTICE '';
  RAISE NOTICE '═══════════════════════════════════════════════════════════';
  RAISE NOTICE '🎉 ALL FUNCTIONS FIXED!';
  RAISE NOTICE '═══════════════════════════════════════════════════════════';
  RAISE NOTICE '';
  RAISE NOTICE '✅ All function overloading issues resolved';
  RAISE NOTICE '✅ Each function has exactly 1 version';
  RAISE NOTICE '✅ All permissions granted to service_role';
  RAISE NOTICE '';
  RAISE NOTICE '📝 NEXT STEPS:';
  RAISE NOTICE '   1. Restart server: npm run dev:no-watch';
  RAISE NOTICE '   2. Test fishing - should work perfectly now!';
  RAISE NOTICE '';
  RAISE NOTICE 'Expected console output:';
  RAISE NOTICE '   ✅ Balance updated';
  RAISE NOTICE '   ✅ Fish count incremented';
  RAISE NOTICE '   ✅ Bait decreased';
  RAISE NOTICE '   ✅✅✅ Caught ... → +... WL';
  RAISE NOTICE '';
  RAISE NOTICE '═══════════════════════════════════════════════════════════';
  RAISE NOTICE '';
END $$;

-- Show function signatures
SELECT 
  proname as function_name,
  pg_get_function_arguments(oid) as parameters,
  pg_get_function_result(oid) as return_type
FROM pg_proc
WHERE proname IN ('increment_fishing_saldo', 'increment_fish_caught', 'grant_bait', 'update_equipped_rod')
ORDER BY proname;
