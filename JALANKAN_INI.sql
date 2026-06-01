-- ============================================================================
-- SOLUSI FINAL - BAIT_COUNT ERROR
-- ============================================================================
-- Copy SEMUA isi file ini ke Supabase SQL Editor, lalu klik RUN
-- ============================================================================

-- 1. Drop semua yang lama
DROP TRIGGER IF EXISTS create_fishing_inventory_on_access ON afk_access CASCADE;
DROP FUNCTION IF EXISTS create_fishing_inventory_for_user() CASCADE;
DROP FUNCTION IF EXISTS grant_bait CASCADE;

-- 2. Tambah kolom bait_balance jika belum ada
ALTER TABLE user_fishing_inventory ADD COLUMN IF NOT EXISTS bait_balance INTEGER DEFAULT 0 NOT NULL;

-- 3. Hapus kolom bait_count jika masih ada
ALTER TABLE user_fishing_inventory DROP COLUMN IF EXISTS bait_count CASCADE;

-- 4. Buat function grant_bait
CREATE FUNCTION grant_bait(
  p_user_id UUID,
  p_amount INTEGER,
  p_granted_by UUID DEFAULT NULL,
  p_notes TEXT DEFAULT NULL
)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
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
$$;

-- 5. Buat trigger function
CREATE FUNCTION create_fishing_inventory_for_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF NEW.feature = 'fishing' AND NEW.is_active = true THEN
    INSERT INTO user_fishing_inventory (user_id, bait_balance, fishing_saldo, total_fish_caught, equipped_rod)
    VALUES (NEW.user_id, 0, 0, 0, 'ez_rod')
    ON CONFLICT (user_id) DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$;

-- 6. Buat trigger
CREATE TRIGGER create_fishing_inventory_on_access
  AFTER INSERT OR UPDATE ON afk_access
  FOR EACH ROW
  EXECUTE FUNCTION create_fishing_inventory_for_user();

-- 7. Grant permissions
GRANT ALL ON user_fishing_inventory TO service_role;
GRANT ALL ON bait_transactions TO service_role;
GRANT ALL ON afk_access TO service_role;
GRANT EXECUTE ON FUNCTION grant_bait TO service_role;

-- 8. Enable RLS
ALTER TABLE user_fishing_inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE bait_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE afk_access ENABLE ROW LEVEL SECURITY;

-- 9. Buat policies
DROP POLICY IF EXISTS policy_user_fishing_inventory ON user_fishing_inventory;
DROP POLICY IF EXISTS policy_bait_transactions ON bait_transactions;
DROP POLICY IF EXISTS policy_afk_access ON afk_access;

CREATE POLICY policy_user_fishing_inventory ON user_fishing_inventory FOR ALL USING (true);
CREATE POLICY policy_bait_transactions ON bait_transactions FOR ALL USING (true);
CREATE POLICY policy_afk_access ON afk_access FOR ALL USING (true);

-- 10. Verifikasi
SELECT 
  CASE 
    WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_fishing_inventory' AND column_name = 'bait_balance')
    THEN '✅ Column bait_balance EXISTS'
    ELSE '❌ Column bait_balance MISSING'
  END as column_check,
  CASE 
    WHEN EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'grant_bait')
    THEN '✅ Function grant_bait EXISTS'
    ELSE '❌ Function grant_bait MISSING'
  END as function_check,
  CASE 
    WHEN EXISTS (SELECT 1 FROM information_schema.triggers WHERE trigger_name = 'create_fishing_inventory_on_access')
    THEN '✅ Trigger EXISTS'
    ELSE '❌ Trigger MISSING'
  END as trigger_check;
