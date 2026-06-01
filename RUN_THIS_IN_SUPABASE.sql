-- ============================================================================
-- JALANKAN SQL INI DI SUPABASE SQL EDITOR
-- ============================================================================
-- Error: column "bait_count" of relation "user_fishing_inventory" does not exist
-- 
-- CARA MENJALANKAN:
-- 1. Buka https://supabase.com/dashboard
-- 2. Login dengan akun Anda
-- 3. Pilih project: rwngqiakigebtwxohiri
-- 4. Klik "SQL Editor" di sidebar kiri
-- 5. Klik "New Query"
-- 6. Copy SEMUA isi file ini
-- 7. Paste ke SQL Editor
-- 8. Klik tombol "Run" atau tekan Ctrl+Enter
-- 9. Tunggu sampai selesai (akan muncul pesan sukses)
-- ============================================================================

-- STEP 1: Hapus trigger dan function lama
DROP TRIGGER IF EXISTS create_fishing_inventory_on_access ON afk_access;
DROP FUNCTION IF EXISTS create_fishing_inventory_for_user() CASCADE;
DROP FUNCTION IF EXISTS init_fishing_inventory_for_user() CASCADE;

-- STEP 2: Pastikan kolom bait_balance ada (bukan bait_count)
DO $$
BEGIN
  -- Tambah kolom bait_balance jika belum ada
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'user_fishing_inventory' 
    AND column_name = 'bait_balance'
  ) THEN
    ALTER TABLE user_fishing_inventory 
    ADD COLUMN bait_balance INTEGER DEFAULT 0;
    RAISE NOTICE '✅ Added column bait_balance';
  ELSE
    RAISE NOTICE '✅ Column bait_balance already exists';
  END IF;

  -- Hapus kolom bait_count jika masih ada
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'user_fishing_inventory' 
    AND column_name = 'bait_count'
  ) THEN
    -- Copy data dari bait_count ke bait_balance sebelum hapus
    EXECUTE 'UPDATE user_fishing_inventory SET bait_balance = COALESCE(bait_count, 0) WHERE bait_count IS NOT NULL';
    -- Hapus kolom lama
    ALTER TABLE user_fishing_inventory DROP COLUMN bait_count;
    RAISE NOTICE '✅ Removed old column bait_count';
  ELSE
    RAISE NOTICE '✅ Column bait_count does not exist (correct)';
  END IF;
END $$;

-- STEP 3: Buat function baru dengan bait_balance
CREATE OR REPLACE FUNCTION create_fishing_inventory_for_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Only create inventory for fishing feature
  IF NEW.feature = 'fishing' AND NEW.is_active = true THEN
    -- Check if inventory already exists
    IF NOT EXISTS (
      SELECT 1 FROM user_fishing_inventory WHERE user_id = NEW.user_id
    ) THEN
      -- Create new inventory with bait_balance (NOT bait_count)
      INSERT INTO user_fishing_inventory (
        user_id,
        bait_balance,      -- ✅ GUNAKAN bait_balance
        fishing_saldo,
        total_fish_caught,
        equipped_rod
      ) VALUES (
        NEW.user_id,
        0,                 -- Start with 0 bait
        0,                 -- Start with 0 saldo
        0,                 -- Start with 0 fish caught
        'ez_rod'           -- Default rod
      );
      
      RAISE NOTICE '✅ Created fishing inventory for user % with bait_balance', NEW.user_id;
    ELSE
      RAISE NOTICE 'ℹ️ Fishing inventory already exists for user %', NEW.user_id;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- STEP 4: Buat trigger baru
CREATE TRIGGER create_fishing_inventory_on_access
  AFTER INSERT OR UPDATE ON afk_access
  FOR EACH ROW
  EXECUTE FUNCTION create_fishing_inventory_for_user();

-- STEP 5: Update function grant_bait
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
      bait_balance,      -- ✅ GUNAKAN bait_balance
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
    RAISE NOTICE '✅ Created fishing inventory for user %', p_user_id;
  END IF;

  -- Update bait_balance (NOT bait_count)
  UPDATE user_fishing_inventory
  SET bait_balance = bait_balance + p_amount    -- ✅ GUNAKAN bait_balance
  WHERE user_id = p_user_id
  RETURNING bait_balance INTO v_new_balance;

  RAISE NOTICE '✅ Granted % bait to user %, new balance: %', p_amount, p_user_id, v_new_balance;

  RETURN v_new_balance;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- STEP 6: Buat tabel bait_grants jika belum ada
CREATE TABLE IF NOT EXISTS bait_grants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  amount INTEGER NOT NULL,
  granted_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  notes TEXT,
  granted_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- STEP 7: Enable RLS
ALTER TABLE bait_grants ENABLE ROW LEVEL SECURITY;

-- STEP 8: RLS Policies
DROP POLICY IF EXISTS "Users can view their own bait grants" ON bait_grants;
CREATE POLICY "Users can view their own bait grants"
  ON bait_grants FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Service role can manage bait grants" ON bait_grants;
CREATE POLICY "Service role can manage bait grants"
  ON bait_grants FOR ALL
  USING (auth.role() = 'service_role');

-- ============================================================================
-- VERIFICATION - Cek apakah fix berhasil
-- ============================================================================

DO $$
DECLARE
  col_exists boolean;
  trigger_exists boolean;
  func_exists boolean;
BEGIN
  RAISE NOTICE '============================================================================';
  RAISE NOTICE 'VERIFICATION RESULTS:';
  RAISE NOTICE '============================================================================';
  
  -- Check bait_balance column
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'user_fishing_inventory' 
    AND column_name = 'bait_balance'
  ) INTO col_exists;
  
  IF col_exists THEN
    RAISE NOTICE '✅ Column bait_balance EXISTS';
  ELSE
    RAISE NOTICE '❌ Column bait_balance MISSING';
  END IF;
  
  -- Check bait_count column (should NOT exist)
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'user_fishing_inventory' 
    AND column_name = 'bait_count'
  ) INTO col_exists;
  
  IF col_exists THEN
    RAISE NOTICE '❌ Column bait_count STILL EXISTS (should be removed)';
  ELSE
    RAISE NOTICE '✅ Column bait_count REMOVED (correct)';
  END IF;
  
  -- Check trigger
  SELECT EXISTS (
    SELECT 1 FROM information_schema.triggers
    WHERE trigger_name = 'create_fishing_inventory_on_access'
    AND event_object_table = 'afk_access'
  ) INTO trigger_exists;
  
  IF trigger_exists THEN
    RAISE NOTICE '✅ Trigger create_fishing_inventory_on_access EXISTS';
  ELSE
    RAISE NOTICE '❌ Trigger create_fishing_inventory_on_access MISSING';
  END IF;
  
  -- Check function
  SELECT EXISTS (
    SELECT 1 FROM information_schema.routines
    WHERE routine_name = 'create_fishing_inventory_for_user'
    AND routine_schema = 'public'
  ) INTO func_exists;
  
  IF func_exists THEN
    RAISE NOTICE '✅ Function create_fishing_inventory_for_user EXISTS';
  ELSE
    RAISE NOTICE '❌ Function create_fishing_inventory_for_user MISSING';
  END IF;
  
  RAISE NOTICE '============================================================================';
  
  IF col_exists AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'user_fishing_inventory' 
    AND column_name = 'bait_count'
  ) AND trigger_exists AND func_exists THEN
    RAISE NOTICE '✅✅✅ ALL CHECKS PASSED - FIX SUCCESSFUL! ✅✅✅';
    RAISE NOTICE 'Silakan test lagi memberikan akses fishing ke user.';
  ELSE
    RAISE NOTICE '❌ SOME CHECKS FAILED - Please review the errors above';
  END IF;
  
  RAISE NOTICE '============================================================================';
END $$;

-- ============================================================================
-- TEST QUERY - Lihat struktur tabel
-- ============================================================================

SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'user_fishing_inventory'
ORDER BY ordinal_position;

-- ============================================================================
-- SELESAI!
-- ============================================================================
-- Jika muncul pesan "✅✅✅ ALL CHECKS PASSED - FIX SUCCESSFUL! ✅✅✅"
-- maka fix berhasil dan Anda bisa test lagi di aplikasi.
-- ============================================================================
