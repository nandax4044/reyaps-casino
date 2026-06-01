-- ============================================================================
-- FIX BAIT_COUNT TRIGGER - Update semua trigger dan function yang masih pakai bait_count
-- ============================================================================
-- Error: column "bait_count" of relation "user_fishing_inventory" does not exist
-- Penyebab: Trigger atau function masih menggunakan kolom lama 'bait_count'
-- Solusi: Update semua trigger dan function untuk menggunakan 'bait_balance'
-- ============================================================================

-- 1. Drop trigger lama jika ada
DROP TRIGGER IF EXISTS create_fishing_inventory_on_access ON afk_access;
DROP TRIGGER IF EXISTS init_fishing_inventory_on_access ON afk_access;

-- 2. Drop function lama
DROP FUNCTION IF EXISTS create_fishing_inventory_for_user() CASCADE;
DROP FUNCTION IF EXISTS init_fishing_inventory_for_user() CASCADE;

-- 3. Buat function baru dengan kolom yang benar (bait_balance)
CREATE OR REPLACE FUNCTION create_fishing_inventory_for_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Only create inventory for fishing feature
  IF NEW.feature = 'fishing' AND NEW.is_active = true THEN
    -- Check if inventory already exists
    IF NOT EXISTS (
      SELECT 1 FROM user_fishing_inventory WHERE user_id = NEW.user_id
    ) THEN
      -- Create new inventory with bait_balance (not bait_count)
      INSERT INTO user_fishing_inventory (
        user_id,
        bait_balance,
        fishing_saldo,
        total_fish_caught,
        equipped_rod
      ) VALUES (
        NEW.user_id,
        0,  -- Start with 0 bait
        0,  -- Start with 0 saldo
        0,  -- Start with 0 fish caught
        'ez_rod'  -- Default rod
      );
      
      RAISE NOTICE 'Created fishing inventory for user %', NEW.user_id;
    ELSE
      RAISE NOTICE 'Fishing inventory already exists for user %', NEW.user_id;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 4. Buat trigger baru
CREATE TRIGGER create_fishing_inventory_on_access
  AFTER INSERT OR UPDATE ON afk_access
  FOR EACH ROW
  EXECUTE FUNCTION create_fishing_inventory_for_user();

-- 5. Verifikasi kolom yang ada di tabel
DO $$
DECLARE
  col_exists boolean;
BEGIN
  -- Check if bait_balance exists
  SELECT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = 'user_fishing_inventory' 
    AND column_name = 'bait_balance'
  ) INTO col_exists;
  
  IF col_exists THEN
    RAISE NOTICE '✅ Column bait_balance exists';
  ELSE
    RAISE NOTICE '❌ Column bait_balance does NOT exist - need to run FIX_ALL_FISHING_ISSUES.sql first';
  END IF;
  
  -- Check if bait_count exists (should not)
  SELECT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = 'user_fishing_inventory' 
    AND column_name = 'bait_count'
  ) INTO col_exists;
  
  IF col_exists THEN
    RAISE NOTICE '⚠️ Column bait_count still exists - should be removed';
  ELSE
    RAISE NOTICE '✅ Column bait_count does not exist (correct)';
  END IF;
END $$;

-- 6. Update grant_bait function untuk menggunakan bait_balance
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
  -- Ensure user has fishing inventory
  IF NOT EXISTS (SELECT 1 FROM user_fishing_inventory WHERE user_id = p_user_id) THEN
    -- Create inventory if not exists
    INSERT INTO user_fishing_inventory (
      user_id,
      bait_balance,
      fishing_saldo,
      total_fish_caught,
      equipped_rod
    ) VALUES (
      p_user_id,
      0,
      0,
      0,
      'ez_rod'
    );
  END IF;

  -- Update bait_balance (not bait_count)
  UPDATE user_fishing_inventory
  SET bait_balance = bait_balance + p_amount
  WHERE user_id = p_user_id
  RETURNING bait_balance INTO v_new_balance;

  -- Log the grant
  INSERT INTO bait_grants (
    user_id,
    amount,
    granted_by,
    notes,
    granted_at
  ) VALUES (
    p_user_id,
    p_amount,
    p_granted_by,
    p_notes,
    NOW()
  );

  RETURN v_new_balance;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7. Pastikan tabel bait_grants ada
CREATE TABLE IF NOT EXISTS bait_grants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  amount INTEGER NOT NULL,
  granted_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  notes TEXT,
  granted_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 8. Enable RLS untuk bait_grants
ALTER TABLE bait_grants ENABLE ROW LEVEL SECURITY;

-- 9. RLS Policies untuk bait_grants
DROP POLICY IF EXISTS "Users can view their own bait grants" ON bait_grants;
CREATE POLICY "Users can view their own bait grants"
  ON bait_grants FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Service role can manage bait grants" ON bait_grants;
CREATE POLICY "Service role can manage bait grants"
  ON bait_grants FOR ALL
  USING (auth.role() = 'service_role');

-- 10. Test function
DO $$
DECLARE
  test_user_id UUID := 'e44ca573-fcf3-47fa-b73e-283747bd21bb'; -- Admin user
  result INTEGER;
BEGIN
  -- Test grant_bait function
  BEGIN
    result := grant_bait(test_user_id, 100, test_user_id, 'Test grant from fix script');
    RAISE NOTICE '✅ grant_bait function works! New balance: %', result;
  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE '❌ grant_bait function failed: %', SQLERRM;
  END;
END $$;

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================

-- Check triggers
SELECT 
  trigger_name,
  event_manipulation,
  event_object_table,
  action_statement
FROM information_schema.triggers
WHERE event_object_table = 'afk_access'
ORDER BY trigger_name;

-- Check functions
SELECT 
  routine_name,
  routine_type,
  data_type
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND routine_name LIKE '%fishing%'
ORDER BY routine_name;

-- Check columns in user_fishing_inventory
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'user_fishing_inventory'
ORDER BY ordinal_position;

-- ============================================================================
-- SUMMARY
-- ============================================================================
-- ✅ Trigger updated to use bait_balance
-- ✅ Function updated to use bait_balance
-- ✅ grant_bait function fixed
-- ✅ bait_grants table created
-- ✅ RLS policies applied
-- ============================================================================

RAISE NOTICE '
============================================================================
✅ FIX COMPLETED - BAIT_COUNT TRIGGER UPDATED
============================================================================
Semua trigger dan function sudah diupdate untuk menggunakan bait_balance.
Silakan test lagi memberikan akses fishing ke user.
============================================================================
';
