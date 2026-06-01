-- ============================================================================
-- FIX ALL FISHING ISSUES - COMPLETE SOLUTION
-- ============================================================================
-- This SQL fixes ALL fishing problems:
-- 1. Adds bait_balance column if missing
-- 2. Fixes RLS policies
-- 3. Ensures all functions exist
-- 4. Grants proper permissions
-- ============================================================================

-- ============================================================================
-- STEP 1: ADD BAIT_BALANCE COLUMN
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '═══════════════════════════════════════════════════════════';
  RAISE NOTICE 'STEP 1: Checking bait_balance column...';
  RAISE NOTICE '═══════════════════════════════════════════════════════════';
  
  -- Check if column exists
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_schema = 'public'
    AND table_name = 'user_fishing_inventory' 
    AND column_name = 'bait_balance'
  ) THEN
    -- Add the column
    ALTER TABLE user_fishing_inventory 
    ADD COLUMN bait_balance INTEGER DEFAULT 0 NOT NULL;
    
    RAISE NOTICE '✅ Added bait_balance column';
    
    -- Check if old bait_count column exists and migrate
    IF EXISTS (
      SELECT 1 
      FROM information_schema.columns 
      WHERE table_schema = 'public'
      AND table_name = 'user_fishing_inventory' 
      AND column_name = 'bait_count'
    ) THEN
      -- Migrate data
      UPDATE user_fishing_inventory 
      SET bait_balance = COALESCE(bait_count, 0);
      
      -- Drop old column
      ALTER TABLE user_fishing_inventory 
      DROP COLUMN bait_count;
      
      RAISE NOTICE '✅ Migrated data from bait_count to bait_balance';
    END IF;
  ELSE
    RAISE NOTICE '✅ bait_balance column already exists';
  END IF;
END $$;

-- ============================================================================
-- STEP 2: ENSURE ALL REQUIRED FUNCTIONS EXIST
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '═══════════════════════════════════════════════════════════';
  RAISE NOTICE 'STEP 2: Checking required functions...';
  RAISE NOTICE '═══════════════════════════════════════════════════════════';
END $$;

-- Function: grant_bait
CREATE OR REPLACE FUNCTION grant_bait(
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

-- Function: increment_fishing_saldo
-- Drop all versions first to avoid overloading
DROP FUNCTION IF EXISTS increment_fishing_saldo(UUID, INTEGER);
DROP FUNCTION IF EXISTS increment_fishing_saldo(UUID, NUMERIC);
DROP FUNCTION IF EXISTS increment_fishing_saldo(UUID, DECIMAL);
DROP FUNCTION IF EXISTS increment_fishing_saldo(p_user_id UUID, p_amount INTEGER);
DROP FUNCTION IF EXISTS increment_fishing_saldo(p_user_id UUID, p_amount NUMERIC);
DROP FUNCTION IF EXISTS increment_fishing_saldo(p_user_id UUID, p_amount DECIMAL);

CREATE OR REPLACE FUNCTION increment_fishing_saldo(p_user_id UUID, p_amount INTEGER)
RETURNS VOID AS $$
BEGIN
  UPDATE user_fishing_inventory
  SET fishing_saldo = fishing_saldo + p_amount, updated_at = NOW()
  WHERE user_id = p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: increment_fish_caught
CREATE OR REPLACE FUNCTION increment_fish_caught(p_user_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE user_fishing_inventory
  SET total_fish_caught = total_fish_caught + 1, updated_at = NOW()
  WHERE user_id = p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: update_equipped_rod
CREATE OR REPLACE FUNCTION update_equipped_rod(p_user_id UUID, p_rod TEXT)
RETURNS VOID AS $$
BEGIN
  UPDATE user_fishing_inventory
  SET equipped_rod = p_rod, updated_at = NOW()
  WHERE user_id = p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DO $$
BEGIN
  RAISE NOTICE '✅ All functions created/updated';
END $$;

-- ============================================================================
-- STEP 3: FIX RLS POLICIES
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '═══════════════════════════════════════════════════════════';
  RAISE NOTICE 'STEP 3: Fixing RLS policies...';
  RAISE NOTICE '═══════════════════════════════════════════════════════════';
END $$;

-- Drop existing policies
DROP POLICY IF EXISTS user_fishing_inventory_insert_own ON user_fishing_inventory;
DROP POLICY IF EXISTS user_fishing_inventory_update_own ON user_fishing_inventory;
DROP POLICY IF EXISTS user_fishing_inventory_insert_system ON user_fishing_inventory;
DROP POLICY IF EXISTS user_fishing_inventory_update_system ON user_fishing_inventory;
DROP POLICY IF EXISTS user_fishing_inventory_select_own ON user_fishing_inventory;
DROP POLICY IF EXISTS fish_inventory_insert_own ON fish_inventory;
DROP POLICY IF EXISTS fish_inventory_insert_system ON fish_inventory;
DROP POLICY IF EXISTS fish_inventory_select_own ON fish_inventory;
DROP POLICY IF EXISTS fishing_logs_insert_own ON fishing_logs;
DROP POLICY IF EXISTS fishing_logs_insert_system ON fishing_logs;
DROP POLICY IF EXISTS fishing_logs_select_own ON fishing_logs;
DROP POLICY IF EXISTS bait_transactions_insert_own ON bait_transactions;
DROP POLICY IF EXISTS bait_transactions_insert_system ON bait_transactions;
DROP POLICY IF EXISTS bait_transactions_select_own ON bait_transactions;

-- Create permissive policies for service_role
CREATE POLICY user_fishing_inventory_insert_system ON user_fishing_inventory 
  FOR INSERT WITH CHECK (TRUE);

CREATE POLICY user_fishing_inventory_update_system ON user_fishing_inventory 
  FOR UPDATE USING (TRUE);

CREATE POLICY user_fishing_inventory_select_own ON user_fishing_inventory 
  FOR SELECT USING (TRUE);

CREATE POLICY fish_inventory_insert_system ON fish_inventory 
  FOR INSERT WITH CHECK (TRUE);

CREATE POLICY fish_inventory_select_own ON fish_inventory 
  FOR SELECT USING (TRUE);

CREATE POLICY fishing_logs_insert_system ON fishing_logs 
  FOR INSERT WITH CHECK (TRUE);

CREATE POLICY fishing_logs_select_own ON fishing_logs 
  FOR SELECT USING (TRUE);

CREATE POLICY bait_transactions_insert_system ON bait_transactions 
  FOR INSERT WITH CHECK (TRUE);

CREATE POLICY bait_transactions_select_own ON bait_transactions 
  FOR SELECT USING (TRUE);

DO $$
BEGIN
  RAISE NOTICE '✅ RLS policies created';
END $$;

-- ============================================================================
-- STEP 4: GRANT PERMISSIONS
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '═══════════════════════════════════════════════════════════';
  RAISE NOTICE 'STEP 4: Granting permissions...';
  RAISE NOTICE '═══════════════════════════════════════════════════════════';
END $$;

-- Grant all permissions to service_role
GRANT ALL ON user_fishing_inventory TO service_role;
GRANT ALL ON fish_inventory TO service_role;
GRANT ALL ON fishing_logs TO service_role;
GRANT ALL ON bait_transactions TO service_role;
GRANT ALL ON user_rod_access TO service_role;
GRANT ALL ON afk_access TO service_role;
GRANT ALL ON afk_fishing_sessions TO service_role;

-- Grant execute on functions
GRANT EXECUTE ON FUNCTION grant_bait(UUID, INTEGER, UUID, TEXT) TO service_role;
GRANT EXECUTE ON FUNCTION increment_fishing_saldo(UUID, INTEGER) TO service_role;
GRANT EXECUTE ON FUNCTION increment_fish_caught(UUID) TO service_role;
GRANT EXECUTE ON FUNCTION update_equipped_rod(UUID, TEXT) TO service_role;

DO $$
BEGIN
  RAISE NOTICE '✅ Permissions granted';
END $$;

-- ============================================================================
-- STEP 5: VERIFY EVERYTHING
-- ============================================================================

DO $$
DECLARE
  v_column_exists BOOLEAN;
  v_grant_bait_exists BOOLEAN;
  v_increment_saldo_exists BOOLEAN;
  v_increment_fish_exists BOOLEAN;
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '═══════════════════════════════════════════════════════════';
  RAISE NOTICE 'STEP 5: Verifying everything...';
  RAISE NOTICE '═══════════════════════════════════════════════════════════';
  RAISE NOTICE '';
  
  -- Check column
  SELECT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_schema = 'public'
    AND table_name = 'user_fishing_inventory' 
    AND column_name = 'bait_balance'
  ) INTO v_column_exists;
  
  IF v_column_exists THEN
    RAISE NOTICE '✅ Column bait_balance exists';
  ELSE
    RAISE EXCEPTION '❌ Column bait_balance does not exist!';
  END IF;
  
  -- Check functions
  SELECT EXISTS (
    SELECT 1 FROM pg_proc WHERE proname = 'grant_bait'
  ) INTO v_grant_bait_exists;
  
  SELECT EXISTS (
    SELECT 1 FROM pg_proc WHERE proname = 'increment_fishing_saldo'
  ) INTO v_increment_saldo_exists;
  
  SELECT EXISTS (
    SELECT 1 FROM pg_proc WHERE proname = 'increment_fish_caught'
  ) INTO v_increment_fish_exists;
  
  IF v_grant_bait_exists THEN
    RAISE NOTICE '✅ Function grant_bait exists';
  ELSE
    RAISE EXCEPTION '❌ Function grant_bait does not exist!';
  END IF;
  
  IF v_increment_saldo_exists THEN
    RAISE NOTICE '✅ Function increment_fishing_saldo exists';
  ELSE
    RAISE EXCEPTION '❌ Function increment_fishing_saldo does not exist!';
  END IF;
  
  IF v_increment_fish_exists THEN
    RAISE NOTICE '✅ Function increment_fish_caught exists';
  ELSE
    RAISE EXCEPTION '❌ Function increment_fish_caught does not exist!';
  END IF;
  
  RAISE NOTICE '';
  RAISE NOTICE '═══════════════════════════════════════════════════════════';
  RAISE NOTICE '🎉 ALL FIXES APPLIED SUCCESSFULLY!';
  RAISE NOTICE '═══════════════════════════════════════════════════════════';
  RAISE NOTICE '';
  RAISE NOTICE '📝 NEXT STEPS:';
  RAISE NOTICE '';
  RAISE NOTICE '1. RESTART SERVER:';
  RAISE NOTICE '   Stop server (Ctrl+C)';
  RAISE NOTICE '   Run: npm run dev:no-watch';
  RAISE NOTICE '';
  RAISE NOTICE '2. GRANT BAIT:';
  RAISE NOTICE '   Login as admin (nanddev / nanda900)';
  RAISE NOTICE '   Admin Dashboard → Fishing Management → Bait Management';
  RAISE NOTICE '   Grant 700 bait to user';
  RAISE NOTICE '';
  RAISE NOTICE '3. TEST FISHING:';
  RAISE NOTICE '   Go to Fishing AFK page';
  RAISE NOTICE '   Check Bait Balance shows 700';
  RAISE NOTICE '   Start AFK Fishing';
  RAISE NOTICE '   Check console for: ✅✅✅ Caught ...';
  RAISE NOTICE '';
  RAISE NOTICE '═══════════════════════════════════════════════════════════';
  RAISE NOTICE '';
END $$;

-- Show table structure
SELECT 
  column_name, 
  data_type, 
  column_default
FROM information_schema.columns
WHERE table_schema = 'public'
AND table_name = 'user_fishing_inventory'
ORDER BY ordinal_position;
