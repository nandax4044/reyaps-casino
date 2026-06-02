-- ============================================================================
-- FIX BAIT SEKARANG - INSERT DATA KE FISHING_INVENTORY
-- ============================================================================
-- PROBLEM: Display tampil bait tapi start AFK error "Tidak ada bait"
-- SOLUTION: Pastikan data ada di table fishing_inventory
-- ============================================================================

-- Step 1: Check if fishing_inventory table exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'fishing_inventory'
  ) THEN
    -- Create table if not exists
    CREATE TABLE fishing_inventory (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
      bait INTEGER DEFAULT 0 NOT NULL,
      fishing_saldo INTEGER DEFAULT 0 NOT NULL,
      created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
      updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_fishing_inventory_user_id ON fishing_inventory(user_id);
    
    ALTER TABLE fishing_inventory ENABLE ROW LEVEL SECURITY;
    
    DROP POLICY IF EXISTS "fishing_inventory_all" ON fishing_inventory;
    CREATE POLICY "fishing_inventory_all" ON fishing_inventory FOR ALL USING (TRUE) WITH CHECK (TRUE);
    
    GRANT ALL ON fishing_inventory TO service_role, anon, authenticated;
    
    RAISE NOTICE '✅ Created fishing_inventory table';
  ELSE
    RAISE NOTICE '✅ fishing_inventory table already exists';
  END IF;
END $$;

-- Step 2: Grant bait ke semua user yang punya fishing access
-- (Admin sudah grant access tapi barangkali baitnya belum masuk)
INSERT INTO fishing_inventory (user_id, bait, fishing_saldo, created_at, updated_at)
SELECT 
  fa.user_id,
  300 as bait,  -- Default 300 bait untuk yang punya access
  0 as fishing_saldo,
  NOW() as created_at,
  NOW() as updated_at
FROM fishing_access fa
WHERE fa.is_active = TRUE
  AND fa.expires_at > NOW()
  AND NOT EXISTS (
    SELECT 1 FROM fishing_inventory fi WHERE fi.user_id = fa.user_id
  )
ON CONFLICT (user_id) DO NOTHING;

-- Step 3: Update existing fishing_inventory yang bait = 0 tapi user punya access
UPDATE fishing_inventory fi
SET 
  bait = CASE 
    WHEN fi.bait = 0 THEN 300  -- Set ke 300 kalau 0
    ELSE fi.bait                -- Keep existing kalau sudah ada
  END,
  updated_at = NOW()
FROM fishing_access fa
WHERE fi.user_id = fa.user_id
  AND fa.is_active = TRUE
  AND fa.expires_at > NOW()
  AND fi.bait = 0;

-- Step 4: Create user_fishing_inventory if not exists (for future compatibility)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'user_fishing_inventory'
  ) THEN
    CREATE TABLE user_fishing_inventory (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
      bait_balance INTEGER DEFAULT 0 NOT NULL,
      fishing_saldo INTEGER DEFAULT 0 NOT NULL,
      total_fish_caught INTEGER DEFAULT 0 NOT NULL,
      equipped_rod TEXT DEFAULT 'basic_rod',
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );

    CREATE INDEX IF NOT EXISTS idx_user_fishing_inventory_user_id ON user_fishing_inventory(user_id);
    
    ALTER TABLE user_fishing_inventory ENABLE ROW LEVEL SECURITY;
    
    DROP POLICY IF EXISTS "user_fishing_inventory_all" ON user_fishing_inventory;
    CREATE POLICY "user_fishing_inventory_all" ON user_fishing_inventory FOR ALL USING (TRUE) WITH CHECK (TRUE);
    
    GRANT ALL ON user_fishing_inventory TO service_role, anon, authenticated;
    
    RAISE NOTICE '✅ Created user_fishing_inventory table';
  ELSE
    RAISE NOTICE '✅ user_fishing_inventory table already exists';
  END IF;
END $$;

-- Step 5: Sync data from fishing_inventory to user_fishing_inventory
INSERT INTO user_fishing_inventory (user_id, bait_balance, fishing_saldo, total_fish_caught, equipped_rod, created_at, updated_at)
SELECT 
  fi.user_id,
  fi.bait as bait_balance,
  fi.fishing_saldo,
  0 as total_fish_caught,
  'basic_rod' as equipped_rod,
  fi.created_at,
  fi.updated_at
FROM fishing_inventory fi
WHERE NOT EXISTS (
  SELECT 1 FROM user_fishing_inventory ufi WHERE ufi.user_id = fi.user_id
)
ON CONFLICT (user_id) DO UPDATE SET
  bait_balance = EXCLUDED.bait_balance,
  fishing_saldo = EXCLUDED.fishing_saldo,
  updated_at = NOW();

-- Step 6: Ensure afk_fishing_sessions table exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'afk_fishing_sessions'
  ) THEN
    CREATE TABLE afk_fishing_sessions (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID UNIQUE REFERENCES users(id) ON DELETE CASCADE,
      username TEXT NOT NULL,
      equipped_rod TEXT NOT NULL DEFAULT 'basic_rod',
      is_active BOOLEAN DEFAULT TRUE,
      started_at TIMESTAMPTZ DEFAULT NOW(),
      last_heartbeat TIMESTAMPTZ DEFAULT NOW(),
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );

    CREATE INDEX IF NOT EXISTS idx_afk_sessions_user_id ON afk_fishing_sessions(user_id);
    CREATE INDEX IF NOT EXISTS idx_afk_sessions_active ON afk_fishing_sessions(is_active);
    
    ALTER TABLE afk_fishing_sessions ENABLE ROW LEVEL SECURITY;
    
    DROP POLICY IF EXISTS "afk_sessions_all" ON afk_fishing_sessions;
    CREATE POLICY "afk_sessions_all" ON afk_fishing_sessions FOR ALL USING (TRUE) WITH CHECK (TRUE);
    
    GRANT ALL ON afk_fishing_sessions TO service_role, anon, authenticated;
    
    RAISE NOTICE '✅ Created afk_fishing_sessions table';
  ELSE
    RAISE NOTICE '✅ afk_fishing_sessions table already exists';
  END IF;
END $$;

-- ============================================================================
-- VERIFICATION & RESULTS
-- ============================================================================
DO $$
DECLARE
  v_fishing_inv_count INTEGER;
  v_user_fishing_inv_count INTEGER;
  v_total_users_with_bait INTEGER;
  v_total_users_with_access INTEGER;
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '═══════════════════════════════════════════════════════════';
  RAISE NOTICE '✅ BAIT FIX COMPLETE!';
  RAISE NOTICE '═══════════════════════════════════════════════════════════';
  RAISE NOTICE '';

  -- Count records
  SELECT COUNT(*) INTO v_fishing_inv_count FROM fishing_inventory WHERE bait > 0;
  SELECT COUNT(*) INTO v_user_fishing_inv_count FROM user_fishing_inventory WHERE bait_balance > 0;
  SELECT COUNT(*) INTO v_total_users_with_access FROM fishing_access WHERE is_active = TRUE AND expires_at > NOW();
  
  RAISE NOTICE '📊 STATISTICS:';
  RAISE NOTICE '  - Users with fishing access: %', v_total_users_with_access;
  RAISE NOTICE '  - fishing_inventory (with bait): %', v_fishing_inv_count;
  RAISE NOTICE '  - user_fishing_inventory (with bait): %', v_user_fishing_inv_count;
  RAISE NOTICE '';
  
  IF v_fishing_inv_count > 0 THEN
    RAISE NOTICE '✅ fishing_inventory has % users with bait', v_fishing_inv_count;
  ELSE
    RAISE WARNING '⚠️  No users with bait in fishing_inventory!';
  END IF;
  
  IF v_user_fishing_inv_count > 0 THEN
    RAISE NOTICE '✅ user_fishing_inventory has % users with bait', v_user_fishing_inv_count;
  ELSE
    RAISE NOTICE 'ℹ️  user_fishing_inventory empty (will use fishing_inventory fallback)';
  END IF;
  
  RAISE NOTICE '';
  RAISE NOTICE '📝 NEXT STEPS:';
  RAISE NOTICE '  1. Vercel sudah deploy code terbaru? Check timestamp!';
  RAISE NOTICE '  2. Test: Login → Fish AFK → Start AFK';
  RAISE NOTICE '  3. Should work now with %+ bait!', COALESCE(v_fishing_inv_count * 300, 0);
  RAISE NOTICE '';
END $$;

-- Show sample data
SELECT 
  'fishing_inventory' as table_name,
  fi.user_id,
  u.username,
  fi.bait,
  fi.fishing_saldo,
  fi.updated_at
FROM fishing_inventory fi
JOIN users u ON u.id = fi.user_id
WHERE fi.bait > 0
ORDER BY fi.updated_at DESC
LIMIT 5;

SELECT 
  'user_fishing_inventory' as table_name,
  ufi.user_id,
  u.username,
  ufi.bait_balance,
  ufi.fishing_saldo,
  ufi.equipped_rod,
  ufi.updated_at
FROM user_fishing_inventory ufi
JOIN users u ON u.id = ufi.user_id
WHERE ufi.bait_balance > 0
ORDER BY ufi.updated_at DESC
LIMIT 5;
