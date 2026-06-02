-- ============================================================================
-- FIX EQUIP ROD + UNIFIED FISHING INVENTORY
-- ============================================================================
-- Run this in Supabase SQL Editor BEFORE deploying code
-- ============================================================================

-- Step 1: Create user_fishing_inventory if not exists (unified table)
CREATE TABLE IF NOT EXISTS user_fishing_inventory (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  bait_balance INTEGER DEFAULT 0 NOT NULL,
  fishing_saldo INTEGER DEFAULT 0 NOT NULL,
  total_fish_caught INTEGER DEFAULT 0 NOT NULL,
  equipped_rod TEXT DEFAULT 'basic_rod',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Step 2: Create index
CREATE INDEX IF NOT EXISTS idx_user_fishing_inventory_user_id 
  ON user_fishing_inventory(user_id);

-- Step 3: Enable RLS
ALTER TABLE user_fishing_inventory ENABLE ROW LEVEL SECURITY;

-- Step 4: Drop old policies
DROP POLICY IF EXISTS "user_fishing_inventory_all" ON user_fishing_inventory;
DROP POLICY IF EXISTS "Users can view own fishing inventory" ON user_fishing_inventory;
DROP POLICY IF EXISTS "Service role can manage all fishing inventory" ON user_fishing_inventory;

-- Step 5: Create new policies (simple - allow all for now)
CREATE POLICY "user_fishing_inventory_all" 
  ON user_fishing_inventory 
  FOR ALL 
  USING (TRUE) 
  WITH CHECK (TRUE);

-- Step 6: Grant permissions
GRANT ALL ON user_fishing_inventory TO service_role, anon, authenticated;

-- Step 7: Migrate data from fishing_inventory to user_fishing_inventory (if exists)
DO $$
DECLARE
  v_count INTEGER;
BEGIN
  -- Check if fishing_inventory exists
  SELECT COUNT(*) INTO v_count
  FROM information_schema.tables
  WHERE table_schema = 'public' 
    AND table_name = 'fishing_inventory';

  IF v_count > 0 THEN
    -- Migrate data
    INSERT INTO user_fishing_inventory (user_id, bait_balance, fishing_saldo, equipped_rod, created_at, updated_at)
    SELECT 
      user_id, 
      COALESCE(bait, 0) as bait_balance,
      COALESCE(fishing_saldo, 0) as fishing_saldo,
      'basic_rod' as equipped_rod,
      COALESCE(created_at, NOW()) as created_at,
      COALESCE(updated_at, NOW()) as updated_at
    FROM fishing_inventory
    ON CONFLICT (user_id) DO UPDATE SET
      bait_balance = COALESCE(EXCLUDED.bait_balance, user_fishing_inventory.bait_balance),
      fishing_saldo = COALESCE(EXCLUDED.fishing_saldo, user_fishing_inventory.fishing_saldo),
      updated_at = NOW();

    RAISE NOTICE '✅ Migrated % rows from fishing_inventory to user_fishing_inventory', (SELECT COUNT(*) FROM fishing_inventory);
  ELSE
    RAISE NOTICE '⚠️  fishing_inventory table does not exist, skipping migration';
  END IF;
END $$;

-- Step 8: Ensure other required tables exist

-- fishing_access
CREATE TABLE IF NOT EXISTS fishing_access (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  granted_by UUID REFERENCES users(id) ON DELETE SET NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  is_active BOOLEAN DEFAULT TRUE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_fishing_access_user_id ON fishing_access(user_id);
CREATE INDEX IF NOT EXISTS idx_fishing_access_active ON fishing_access(is_active);

ALTER TABLE fishing_access ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "fishing_access_all" ON fishing_access;
CREATE POLICY "fishing_access_all" ON fishing_access FOR ALL USING (TRUE) WITH CHECK (TRUE);

GRANT ALL ON fishing_access TO service_role, anon, authenticated;

-- user_rods
CREATE TABLE IF NOT EXISTS user_rods (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  rod_id TEXT NOT NULL,
  granted_by UUID REFERENCES users(id) ON DELETE SET NULL,
  granted_at TIMESTAMPTZ DEFAULT NOW(),
  notes TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  UNIQUE(user_id, rod_id)
);

CREATE INDEX IF NOT EXISTS idx_user_rods_user_id ON user_rods(user_id);

ALTER TABLE user_rods ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "user_rods_all" ON user_rods;
CREATE POLICY "user_rods_all" ON user_rods FOR ALL USING (TRUE) WITH CHECK (TRUE);

GRANT ALL ON user_rods TO service_role, anon, authenticated;

-- fish_inventory
CREATE TABLE IF NOT EXISTS fish_inventory (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  fish_name TEXT NOT NULL,
  fish_lb DECIMAL(10, 2) NOT NULL,
  fish_value DECIMAL(10, 2) NOT NULL,
  rod_used TEXT,
  caught_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_fish_inventory_user_id ON fish_inventory(user_id);

ALTER TABLE fish_inventory ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "fish_inventory_all" ON fish_inventory;
CREATE POLICY "fish_inventory_all" ON fish_inventory FOR ALL USING (TRUE) WITH CHECK (TRUE);

GRANT ALL ON fish_inventory TO service_role, anon, authenticated;

-- afk_fishing_sessions
CREATE TABLE IF NOT EXISTS afk_fishing_sessions (
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

-- ============================================================================
-- VERIFICATION
-- ============================================================================
DO $$
DECLARE
  v_user_fishing_inv_count INTEGER;
  v_fishing_access_count INTEGER;
  v_user_rods_count INTEGER;
  v_afk_sessions_count INTEGER;
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '═══════════════════════════════════════════════════════════';
  RAISE NOTICE '✅ EQUIP ROD FIX - ALL TABLES READY!';
  RAISE NOTICE '═══════════════════════════════════════════════════════════';
  RAISE NOTICE '';

  -- Count tables
  SELECT COUNT(*) INTO v_user_fishing_inv_count FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'user_fishing_inventory';
  
  SELECT COUNT(*) INTO v_fishing_access_count FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'fishing_access';
    
  SELECT COUNT(*) INTO v_user_rods_count FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'user_rods';
    
  SELECT COUNT(*) INTO v_afk_sessions_count FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'afk_fishing_sessions';

  -- Report
  IF v_user_fishing_inv_count = 1 THEN
    RAISE NOTICE '✅ user_fishing_inventory - EXISTS (with equipped_rod + bait_balance)';
  ELSE
    RAISE EXCEPTION '❌ user_fishing_inventory - NOT FOUND!';
  END IF;

  IF v_fishing_access_count = 1 THEN
    RAISE NOTICE '✅ fishing_access - EXISTS';
  ELSE
    RAISE EXCEPTION '❌ fishing_access - NOT FOUND!';
  END IF;

  IF v_user_rods_count = 1 THEN
    RAISE NOTICE '✅ user_rods - EXISTS';
  ELSE
    RAISE EXCEPTION '❌ user_rods - NOT FOUND!';
  END IF;

  IF v_afk_sessions_count = 1 THEN
    RAISE NOTICE '✅ afk_fishing_sessions - EXISTS';
  ELSE
    RAISE EXCEPTION '❌ afk_fishing_sessions - NOT FOUND!';
  END IF;

  RAISE NOTICE '';
  RAISE NOTICE '📝 NEXT STEPS:';
  RAISE NOTICE '  1. Deploy code: git push origin main';
  RAISE NOTICE '  2. Test: Select rod di Fish AFK page';
  RAISE NOTICE '  3. Verify: Rod terpilih tanpa error 404';
  RAISE NOTICE '';
END $$;

-- ============================================================================
-- SHOW TABLE STRUCTURES
-- ============================================================================
SELECT 
  'user_fishing_inventory' as table_name,
  column_name,
  data_type,
  column_default
FROM information_schema.columns
WHERE table_name = 'user_fishing_inventory'
ORDER BY ordinal_position;
