-- ============================================================================
-- FIX BAIT & FISHING - COMPLETE SOLUTION
-- ============================================================================
-- Run this ONCE in Supabase SQL Editor
-- ============================================================================

-- ============================================================================
-- STEP 1: DROP OLD TABLES (Clean Start)
-- ============================================================================
DROP TABLE IF EXISTS afk_fishing_sessions CASCADE;
DROP TABLE IF EXISTS fish_inventory CASCADE;
DROP TABLE IF EXISTS fishing_inventory CASCADE;
DROP TABLE IF EXISTS user_rods CASCADE;
DROP TABLE IF EXISTS fishing_access CASCADE;

-- ============================================================================
-- STEP 2: CREATE fishing_access
-- ============================================================================
CREATE TABLE fishing_access (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE,
  granted_by UUID,
  expires_at TIMESTAMPTZ NOT NULL,
  is_active BOOLEAN DEFAULT TRUE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (granted_by) REFERENCES users(id) ON DELETE SET NULL
);

CREATE INDEX idx_fishing_access_user ON fishing_access(user_id);
CREATE INDEX idx_fishing_access_active ON fishing_access(is_active);

ALTER TABLE fishing_access ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS fishing_access_all ON fishing_access;
CREATE POLICY fishing_access_all ON fishing_access FOR ALL USING (TRUE) WITH CHECK (TRUE);

GRANT ALL ON fishing_access TO service_role, anon, authenticated;

-- ============================================================================
-- STEP 3: CREATE user_rods
-- ============================================================================
CREATE TABLE user_rods (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  rod_id TEXT NOT NULL,
  granted_by UUID,
  granted_at TIMESTAMPTZ DEFAULT NOW(),
  notes TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  UNIQUE(user_id, rod_id),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (granted_by) REFERENCES users(id) ON DELETE SET NULL
);

CREATE INDEX idx_user_rods_user ON user_rods(user_id);
CREATE INDEX idx_user_rods_rod ON user_rods(rod_id);

ALTER TABLE user_rods ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS user_rods_all ON user_rods;
CREATE POLICY user_rods_all ON user_rods FOR ALL USING (TRUE) WITH CHECK (TRUE);

GRANT ALL ON user_rods TO service_role, anon, authenticated;

-- ============================================================================
-- STEP 4: CREATE fishing_inventory (BAIT STORAGE)
-- ============================================================================
CREATE TABLE fishing_inventory (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE,
  bait INTEGER DEFAULT 0 NOT NULL,
  fishing_saldo INTEGER DEFAULT 0 NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX idx_fishing_inventory_user ON fishing_inventory(user_id);

ALTER TABLE fishing_inventory ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS fishing_inventory_all ON fishing_inventory;
CREATE POLICY fishing_inventory_all ON fishing_inventory FOR ALL USING (TRUE) WITH CHECK (TRUE);

GRANT ALL ON fishing_inventory TO service_role, anon, authenticated;

-- ============================================================================
-- STEP 5: CREATE fish_inventory (FISH CAUGHT)
-- ============================================================================
CREATE TABLE fish_inventory (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  fish_name TEXT NOT NULL,
  fish_lb DECIMAL(10, 2) NOT NULL,
  fish_value DECIMAL(10, 2) NOT NULL,
  rod_used TEXT,
  caught_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX idx_fish_inventory_user ON fish_inventory(user_id);
CREATE INDEX idx_fish_inventory_caught ON fish_inventory(caught_at);

ALTER TABLE fish_inventory ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS fish_inventory_all ON fish_inventory;
CREATE POLICY fish_inventory_all ON fish_inventory FOR ALL USING (TRUE) WITH CHECK (TRUE);

GRANT ALL ON fish_inventory TO service_role, anon, authenticated;

-- ============================================================================
-- STEP 6: CREATE afk_fishing_sessions (PERSISTENT AFK)
-- ============================================================================
CREATE TABLE afk_fishing_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID UNIQUE,
  username TEXT NOT NULL,
  equipped_rod TEXT NOT NULL DEFAULT 'basic_rod',
  is_active BOOLEAN DEFAULT TRUE,
  started_at TIMESTAMPTZ DEFAULT NOW(),
  last_heartbeat TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX idx_afk_sessions_user ON afk_fishing_sessions(user_id);
CREATE INDEX idx_afk_sessions_active ON afk_fishing_sessions(is_active);

ALTER TABLE afk_fishing_sessions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS afk_sessions_all ON afk_fishing_sessions;
CREATE POLICY afk_sessions_all ON afk_fishing_sessions FOR ALL USING (TRUE) WITH CHECK (TRUE);

GRANT ALL ON afk_fishing_sessions TO service_role, anon, authenticated;

-- ============================================================================
-- VERIFICATION
-- ============================================================================
DO $$
DECLARE
  v_count INTEGER;
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '═══════════════════════════════════════════════════════════';
  RAISE NOTICE '✅ VERIFICATION';
  RAISE NOTICE '═══════════════════════════════════════════════════════════';
  RAISE NOTICE '';
  
  -- Check each table
  SELECT COUNT(*) INTO v_count FROM information_schema.tables 
  WHERE table_schema = 'public' AND table_name = 'fishing_access';
  IF v_count > 0 THEN
    RAISE NOTICE '✅ fishing_access';
  ELSE
    RAISE EXCEPTION '❌ fishing_access NOT FOUND!';
  END IF;
  
  SELECT COUNT(*) INTO v_count FROM information_schema.tables 
  WHERE table_schema = 'public' AND table_name = 'user_rods';
  IF v_count > 0 THEN
    RAISE NOTICE '✅ user_rods';
  ELSE
    RAISE EXCEPTION '❌ user_rods NOT FOUND!';
  END IF;
  
  SELECT COUNT(*) INTO v_count FROM information_schema.tables 
  WHERE table_schema = 'public' AND table_name = 'fishing_inventory';
  IF v_count > 0 THEN
    RAISE NOTICE '✅ fishing_inventory';
  ELSE
    RAISE EXCEPTION '❌ fishing_inventory NOT FOUND!';
  END IF;
  
  SELECT COUNT(*) INTO v_count FROM information_schema.tables 
  WHERE table_schema = 'public' AND table_name = 'fish_inventory';
  IF v_count > 0 THEN
    RAISE NOTICE '✅ fish_inventory';
  ELSE
    RAISE EXCEPTION '❌ fish_inventory NOT FOUND!';
  END IF;
  
  SELECT COUNT(*) INTO v_count FROM information_schema.tables 
  WHERE table_schema = 'public' AND table_name = 'afk_fishing_sessions';
  IF v_count > 0 THEN
    RAISE NOTICE '✅ afk_fishing_sessions';
  ELSE
    RAISE EXCEPTION '❌ afk_fishing_sessions NOT FOUND!';
  END IF;
  
  RAISE NOTICE '';
  RAISE NOTICE '═══════════════════════════════════════════════════════════';
  RAISE NOTICE '🎉 SUCCESS! ALL TABLES CREATED!';
  RAISE NOTICE '═══════════════════════════════════════════════════════════';
  RAISE NOTICE '';
  RAISE NOTICE '📝 Next Steps:';
  RAISE NOTICE '1. Deploy code: git push origin main';
  RAISE NOTICE '2. Test grant bait';
  RAISE NOTICE '3. Test AFK fishing';
  RAISE NOTICE '';
END $$;
