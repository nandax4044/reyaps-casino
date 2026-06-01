-- ============================================================================
-- RUN THIS ONCE - SOLUSI LENGKAP BAIT_COUNT ERROR
-- ============================================================================
-- Copy SEMUA isi file ini, paste ke Supabase SQL Editor, lalu RUN
-- ============================================================================

-- PART 1: CREATE TABLES IF NOT EXISTS
-- ============================================================================

CREATE TABLE IF NOT EXISTS user_fishing_inventory (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  bait_balance INTEGER DEFAULT 0 NOT NULL,
  fishing_saldo INTEGER DEFAULT 0 NOT NULL,
  total_fish_caught INTEGER DEFAULT 0 NOT NULL,
  equipped_rod TEXT DEFAULT 'ez_rod',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
Gagal memberikan akses: Failed to grant fishing access: column "bait_count" of relation "user_fishing_inventory" does not exist
);

CREATE TABLE IF NOT EXISTS afk_access (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  feature TEXT NOT NULL,
  granted_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  granted_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT TRUE,
  UNIQUE(user_id, feature)
);

-- PART 2: DROP OLD STUFF
-- ============================================================================

DROP TRIGGER IF EXISTS create_fishing_inventory_on_access ON afk_access CASCADE;
DROP FUNCTION IF EXISTS create_fishing_inventory_for_user() CASCADE;
DROP FUNCTION IF EXISTS grant_bait(UUID, INTEGER, UUID, TEXT) CASCADE;
DROP FUNCTION IF EXISTS grant_bait(UUID, INTEGER, UUID) CASCADE;
DROP FUNCTION IF EXISTS grant_bait(UUID, INTEGER) CASCADE;

-- PART 3: FIX COLUMN
-- ============================================================================

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'user_fishing_inventory' AND column_name = 'bait_balance'
  ) THEN
    ALTER TABLE user_fishing_inventory ADD COLUMN bait_balance INTEGER DEFAULT 0 NOT NULL;
  END IF;
  
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'user_fishing_inventory' AND column_name = 'bait_count'
  ) THEN
    EXECUTE 'UPDATE user_fishing_inventory SET bait_balance = COALESCE(bait_count, 0)';
    ALTER TABLE user_fishing_inventory DROP COLUMN bait_count CASCADE;
  END IF;
END $$;

-- PART 4: CREATE FUNCTION
-- ============================================================================

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
  INSERT INTO user_fishing_inventory (user_id, bait_balance, fishing_saldo, total_fish_caught, equipped_rod)
  VALUES (p_user_id, 0, 0, 0, 'ez_rod')
  ON CONFLICT (user_id) DO NOTHING;

  UPDATE user_fishing_inventory
  SET bait_balance = bait_balance + p_amount, updated_at = NOW()
  WHERE user_id = p_user_id
  RETURNING bait_balance INTO v_new_balance;

  INSERT INTO bait_transactions (user_id, amount, transaction_type, granted_by, notes)
  VALUES (p_user_id, p_amount, 'grant', p_granted_by, p_notes);

  RETURN v_new_balance;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- PART 5: CREATE TRIGGER
-- ============================================================================

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

CREATE TRIGGER create_fishing_inventory_on_access
  AFTER INSERT OR UPDATE ON afk_access
  FOR EACH ROW
  EXECUTE FUNCTION create_fishing_inventory_for_user();

-- PART 6: RLS POLICIES
-- ============================================================================

ALTER TABLE user_fishing_inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE bait_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE afk_access ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS user_fishing_inventory_all ON user_fishing_inventory;
DROP POLICY IF EXISTS bait_transactions_all ON bait_transactions;
DROP POLICY IF EXISTS afk_access_all ON afk_access;

CREATE POLICY user_fishing_inventory_all ON user_fishing_inventory FOR ALL USING (TRUE);
CREATE POLICY bait_transactions_all ON bait_transactions FOR ALL USING (TRUE);
CREATE POLICY afk_access_all ON afk_access FOR ALL USING (TRUE);

-- PART 7: PERMISSIONS
-- ============================================================================

GRANT ALL ON user_fishing_inventory TO service_role;
GRANT ALL ON bait_transactions TO service_role;
GRANT ALL ON afk_access TO service_role;
GRANT EXECUTE ON FUNCTION grant_bait(UUID, INTEGER, UUID, TEXT) TO service_role;

-- PART 8: VERIFICATION
-- ============================================================================

DO $$
DECLARE
  v_col BOOLEAN;
  v_func BOOLEAN;
  v_trig BOOLEAN;
BEGIN
  SELECT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_fishing_inventory' AND column_name = 'bait_balance') INTO v_col;
  SELECT EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'grant_bait') INTO v_func;
  SELECT EXISTS (SELECT 1 FROM information_schema.triggers WHERE trigger_name = 'create_fishing_inventory_on_access') INTO v_trig;
  
  RAISE NOTICE '';
  RAISE NOTICE '═══════════════════════════════════════════════════════════';
  IF v_col THEN RAISE NOTICE '✅ Column bait_balance EXISTS'; ELSE RAISE EXCEPTION '❌ Column MISSING!'; END IF;
  IF v_func THEN RAISE NOTICE '✅ Function grant_bait EXISTS'; ELSE RAISE EXCEPTION '❌ Function MISSING!'; END IF;
  IF v_trig THEN RAISE NOTICE '✅ Trigger EXISTS'; ELSE RAISE EXCEPTION '❌ Trigger MISSING!'; END IF;
  RAISE NOTICE '';
  RAISE NOTICE '🎉 SUCCESS! Sekarang test grant fishing access!';
  RAISE NOTICE '═══════════════════════════════════════════════════════════';
END $$;
