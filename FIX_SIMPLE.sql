-- ============================================================================
-- FIX SIMPLE - SOLUSI TERCEPAT
-- ============================================================================
-- Jalankan ini di Supabase SQL Editor
-- ============================================================================

-- STEP 1: Drop old triggers and functions
DROP TRIGGER IF EXISTS create_fishing_inventory_on_access ON afk_access CASCADE;
DROP FUNCTION IF EXISTS create_fishing_inventory_for_user() CASCADE;
DROP FUNCTION IF EXISTS grant_bait CASCADE;

-- STEP 2: Add bait_balance column if not exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'user_fishing_inventory' AND column_name = 'bait_balance'
  ) THEN
    ALTER TABLE user_fishing_inventory ADD COLUMN bait_balance INTEGER DEFAULT 0 NOT NULL;
    RAISE NOTICE 'Added bait_balance column';
  END IF;
END $$;

-- STEP 3: Drop bait_count if exists
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'user_fishing_inventory' AND column_name = 'bait_count'
  ) THEN
    ALTER TABLE user_fishing_inventory DROP COLUMN bait_count CASCADE;
    RAISE NOTICE 'Dropped bait_count column';
  END IF;
END $$;

-- STEP 4: Create grant_bait function
CREATE OR REPLACE FUNCTION grant_bait(
  p_user_id UUID,
  p_amount INTEGER,
  p_granted_by UUID DEFAULT NULL,
  p_notes TEXT DEFAULT NULL
)
RETURNS INTEGER AS $$
DECLARE
  v_new_balance INTEGER;
BEGIN
  -- Insert if not exists
  INSERT INTO user_fishing_inventory (user_id, bait_balance, fishing_saldo, total_fish_caught, equipped_rod)
  VALUES (p_user_id, 0, 0, 0, 'ez_rod')
  ON CONFLICT (user_id) DO NOTHING;

  -- Update bait_balance
  UPDATE user_fishing_inventory
  SET bait_balance = bait_balance + p_amount, updated_at = NOW()
  WHERE user_id = p_user_id
  RETURNING bait_balance INTO v_new_balance;

  -- Log transaction
  INSERT INTO bait_transactions (user_id, amount, transaction_type, granted_by, notes)
  VALUES (p_user_id, p_amount, 'grant', p_granted_by, p_notes);

  RETURN v_new_balance;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- STEP 5: Create trigger function
CREATE OR REPLACE FUNCTION create_fishing_inventory_for_user()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.feature = 'fishing' AND NEW.is_active = true THEN
    INSERT INTO user_fishing_inventory (user_id, bait_balance, fishing_saldo, total_fish_caught, equipped_rod)
    VALUES (NEW.user_id, 0, 0, 0, 'ez_rod')
    ON CONFLICT (user_id) DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- STEP 6: Create trigger
CREATE TRIGGER create_fishing_inventory_on_access
  AFTER INSERT OR UPDATE ON afk_access
  FOR EACH ROW
  EXECUTE FUNCTION create_fishing_inventory_for_user();

-- STEP 7: Grant permissions
GRANT ALL ON user_fishing_inventory TO service_role;
GRANT ALL ON bait_transactions TO service_role;
GRANT ALL ON afk_access TO service_role;
GRANT EXECUTE ON FUNCTION grant_bait(UUID, INTEGER, UUID, TEXT) TO service_role;

-- STEP 8: Enable RLS
ALTER TABLE user_fishing_inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE bait_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE afk_access ENABLE ROW LEVEL SECURITY;

-- STEP 9: Create simple policies
DROP POLICY IF EXISTS allow_all_user_fishing_inventory ON user_fishing_inventory;
DROP POLICY IF EXISTS allow_all_bait_transactions ON bait_transactions;
DROP POLICY IF EXISTS allow_all_afk_access ON afk_access;

CREATE POLICY allow_all_user_fishing_inventory ON user_fishing_inventory FOR ALL USING (true);
CREATE POLICY allow_all_bait_transactions ON bait_transactions FOR ALL USING (true);
CREATE POLICY allow_all_afk_access ON afk_access FOR ALL USING (true);

-- STEP 10: Verify
DO $$
DECLARE
  v_col BOOLEAN;
  v_func BOOLEAN;
  v_trig BOOLEAN;
BEGIN
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'user_fishing_inventory' AND column_name = 'bait_balance'
  ) INTO v_col;
  
  SELECT EXISTS (
    SELECT 1 FROM pg_proc WHERE proname = 'grant_bait'
  ) INTO v_func;
  
  SELECT EXISTS (
    SELECT 1 FROM information_schema.triggers 
    WHERE trigger_name = 'create_fishing_inventory_on_access'
  ) INTO v_trig;
  
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  
  IF v_col THEN
    RAISE NOTICE 'OK - Column bait_balance exists';
  ELSE
    RAISE EXCEPTION 'ERROR - Column bait_balance missing!';
  END IF;
  
  IF v_func THEN
    RAISE NOTICE 'OK - Function grant_bait exists';
  ELSE
    RAISE EXCEPTION 'ERROR - Function grant_bait missing!';
  END IF;
  
  IF v_trig THEN
    RAISE NOTICE 'OK - Trigger exists';
  ELSE
    RAISE EXCEPTION 'ERROR - Trigger missing!';
  END IF;
  
  RAISE NOTICE '';
  RAISE NOTICE 'SUCCESS! Test grant fishing access now!';
  RAISE NOTICE '========================================';
END $$;
