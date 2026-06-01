-- ============================================================================
-- FIX BAIT_COUNT ERROR - SOLUSI FINAL
-- ============================================================================
-- Error: column "bait_count" of relation "user_fishing_inventory" does not exist
-- Solusi: Ganti semua bait_count menjadi bait_balance
-- ============================================================================

-- STEP 1: DROP SEMUA YANG LAMA
-- ============================================================================

-- Drop triggers
DROP TRIGGER IF EXISTS create_fishing_inventory_on_access ON afk_access CASCADE;
DROP TRIGGER IF EXISTS init_fishing_inventory_on_access ON afk_access CASCADE;
DROP TRIGGER IF EXISTS update_fishing_inventory_trigger ON afk_access CASCADE;

-- Drop functions
DROP FUNCTION IF EXISTS create_fishing_inventory_for_user() CASCADE;
DROP FUNCTION IF EXISTS init_fishing_inventory_for_user() CASCADE;
DROP FUNCTION IF EXISTS grant_bait(UUID, INTEGER, UUID, TEXT) CASCADE;
DROP FUNCTION IF EXISTS grant_bait(UUID, INTEGER, UUID) CASCADE;
DROP FUNCTION IF EXISTS grant_bait(UUID, INTEGER) CASCADE;

-- STEP 2: PASTIKAN KOLOM BAIT_BALANCE ADA
-- ============================================================================

DO $$
BEGIN
  -- Cek apakah kolom bait_balance sudah ada
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_schema = 'public'
    AND table_name = 'user_fishing_inventory' 
    AND column_name = 'bait_balance'
  ) THEN
    -- Tambah kolom bait_balance
    ALTER TABLE user_fishing_inventory 
    ADD COLUMN bait_balance INTEGER DEFAULT 0 NOT NULL;
    
    RAISE NOTICE '✅ Added bait_balance column';
  ELSE
    RAISE NOTICE '✅ bait_balance column already exists';
  END IF;
  
  -- Hapus kolom bait_count jika masih ada
  IF EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_schema = 'public'
    AND table_name = 'user_fishing_inventory' 
    AND column_name = 'bait_count'
  ) THEN
    -- Migrate data dulu
    EXECUTE 'UPDATE user_fishing_inventory SET bait_balance = COALESCE(bait_count, 0) WHERE bait_count IS NOT NULL';
    
    -- Drop kolom lama
    ALTER TABLE user_fishing_inventory DROP COLUMN bait_count CASCADE;
    
    RAISE NOTICE '✅ Migrated and dropped bait_count column';
  END IF;
END $$;

-- STEP 3: BUAT FUNCTION GRANT_BAIT BARU
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
  -- Pastikan user punya fishing inventory
  INSERT INTO user_fishing_inventory (
    user_id,
    bait_balance,
    fishing_saldo,
    total_fish_caught,
    equipped_rod,
    created_at,
    updated_at
  ) VALUES (
    p_user_id,
    0,
    0,
    0,
    'ez_rod',
    NOW(),
    NOW()
  )
  ON CONFLICT (user_id) DO NOTHING;

  -- Update bait_balance (BUKAN bait_count!)
  UPDATE user_fishing_inventory
  SET 
    bait_balance = bait_balance + p_amount,
    updated_at = NOW()
  WHERE user_id = p_user_id
  RETURNING bait_balance INTO v_new_balance;

  -- Log transaksi
  INSERT INTO bait_transactions (
    user_id,
    amount,
    transaction_type,
    granted_by,
    notes,
    created_at
  ) VALUES (
    p_user_id,
    p_amount,
    'grant',
    p_granted_by,
    p_notes,
    NOW()
  );

  RETURN v_new_balance;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- STEP 4: BUAT TRIGGER FUNCTION BARU
-- ============================================================================

CREATE OR REPLACE FUNCTION create_fishing_inventory_for_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Hanya untuk feature fishing
  IF NEW.feature = 'fishing' AND NEW.is_active = true THEN
    -- Insert inventory jika belum ada
    INSERT INTO user_fishing_inventory (
      user_id,
      bait_balance,
      fishing_saldo,
      total_fish_caught,
      equipped_rod,
      created_at,
      updated_at
    ) VALUES (
      NEW.user_id,
      0,
      0,
      0,
      'ez_rod',
      NOW(),
      NOW()
    )
    ON CONFLICT (user_id) DO NOTHING;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- STEP 5: BUAT TRIGGER BARU
-- ============================================================================

CREATE TRIGGER create_fishing_inventory_on_access
  AFTER INSERT OR UPDATE ON afk_access
  FOR EACH ROW
  EXECUTE FUNCTION create_fishing_inventory_for_user();

-- STEP 6: GRANT PERMISSIONS
-- ============================================================================

GRANT ALL ON user_fishing_inventory TO service_role;
GRANT ALL ON bait_transactions TO service_role;
GRANT EXECUTE ON FUNCTION grant_bait(UUID, INTEGER, UUID, TEXT) TO service_role;

-- STEP 7: VERIFIKASI
-- ============================================================================

DO $$
DECLARE
  v_column_exists BOOLEAN;
  v_function_exists BOOLEAN;
  v_trigger_exists BOOLEAN;
BEGIN
  -- Cek kolom bait_balance
  SELECT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_schema = 'public'
    AND table_name = 'user_fishing_inventory' 
    AND column_name = 'bait_balance'
  ) INTO v_column_exists;
  
  -- Cek function grant_bait
  SELECT EXISTS (
    SELECT 1 FROM pg_proc WHERE proname = 'grant_bait'
  ) INTO v_function_exists;
  
  -- Cek trigger
  SELECT EXISTS (
    SELECT 1 
    FROM information_schema.triggers 
    WHERE trigger_name = 'create_fishing_inventory_on_access'
  ) INTO v_trigger_exists;
  
  -- Report
  RAISE NOTICE '';
  RAISE NOTICE '═══════════════════════════════════════════════════════════';
  RAISE NOTICE 'VERIFICATION RESULTS:';
  RAISE NOTICE '═══════════════════════════════════════════════════════════';
  
  IF v_column_exists THEN
    RAISE NOTICE '✅ Column bait_balance EXISTS';
  ELSE
    RAISE EXCEPTION '❌ Column bait_balance MISSING!';
  END IF;
  
  IF v_function_exists THEN
    RAISE NOTICE '✅ Function grant_bait EXISTS';
  ELSE
    RAISE EXCEPTION '❌ Function grant_bait MISSING!';
  END IF;
  
  IF v_trigger_exists THEN
    RAISE NOTICE '✅ Trigger create_fishing_inventory_on_access EXISTS';
  ELSE
    RAISE EXCEPTION '❌ Trigger MISSING!';
  END IF;
  
  RAISE NOTICE '';
  RAISE NOTICE '🎉 ALL CHECKS PASSED!';
  RAISE NOTICE '';
  RAISE NOTICE 'Sekarang coba grant fishing access lagi.';
  RAISE NOTICE 'Seharusnya tidak ada error bait_count lagi!';
  RAISE NOTICE '';
  RAISE NOTICE '═══════════════════════════════════════════════════════════';
END $$;

-- STEP 8: SHOW TABLE STRUCTURE
-- ============================================================================

SELECT 
  column_name, 
  data_type, 
  column_default,
  is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
AND table_name = 'user_fishing_inventory'
ORDER BY ordinal_position;
