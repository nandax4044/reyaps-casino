-- ============================================================================
-- COMPLETE FIX: CREATE ALL FISHING TABLES
-- ============================================================================
-- Run this in Supabase SQL Editor
-- Project: rwngqiakigebtwxohiri
-- ============================================================================

-- DROP existing tables if they exist (fresh start)
DROP TABLE IF EXISTS fishing_access CASCADE;
DROP TABLE IF EXISTS user_rods CASCADE;
DROP TABLE IF EXISTS fishing_inventory CASCADE;
DROP TABLE IF EXISTS fish_inventory CASCADE;

-- ============================================================================
-- TABLE 1: fishing_access
-- ============================================================================
CREATE TABLE fishing_access (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  granted_by UUID REFERENCES users(id) ON DELETE SET NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  is_active BOOLEAN DEFAULT TRUE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX idx_fishing_access_user_id ON fishing_access(user_id);
CREATE INDEX idx_fishing_access_active ON fishing_access(is_active);
CREATE INDEX idx_fishing_access_expires ON fishing_access(expires_at);

ALTER TABLE fishing_access ENABLE ROW LEVEL SECURITY;

CREATE POLICY fishing_access_all ON fishing_access FOR ALL USING (TRUE) WITH CHECK (TRUE);

GRANT ALL ON fishing_access TO service_role, anon, authenticated;

-- ============================================================================
-- TABLE 2: user_rods
-- ============================================================================
CREATE TABLE user_rods (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  rod_id TEXT NOT NULL,
  granted_by UUID REFERENCES users(id) ON DELETE SET NULL,
  granted_at TIMESTAMPTZ DEFAULT NOW(),
  notes TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  UNIQUE(user_id, rod_id)
);

CREATE INDEX idx_user_rods_user_id ON user_rods(user_id);
CREATE INDEX idx_user_rods_rod_id ON user_rods(rod_id);

ALTER TABLE user_rods ENABLE ROW LEVEL SECURITY;

CREATE POLICY user_rods_all ON user_rods FOR ALL USING (TRUE) WITH CHECK (TRUE);

GRANT ALL ON user_rods TO service_role, anon, authenticated;

-- ============================================================================
-- TABLE 3: fishing_inventory
-- ============================================================================
CREATE TABLE IF NOT EXISTS fishing_inventory (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  bait INTEGER DEFAULT 0 NOT NULL,
  fishing_saldo INTEGER DEFAULT 0 NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_fishing_inventory_user_id ON fishing_inventory(user_id);

ALTER TABLE fishing_inventory ENABLE ROW LEVEL SECURITY;

CREATE POLICY fishing_inventory_all ON fishing_inventory FOR ALL USING (TRUE) WITH CHECK (TRUE);

GRANT ALL ON fishing_inventory TO service_role, anon, authenticated;

-- ============================================================================
-- TABLE 4: fish_inventory
-- ============================================================================
CREATE TABLE fish_inventory (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  fish_name TEXT NOT NULL,
  fish_lb DECIMAL(10, 2) NOT NULL,
  fish_value DECIMAL(10, 2) NOT NULL,
  rod_used TEXT,
  caught_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX idx_fish_inventory_user_id ON fish_inventory(user_id);
CREATE INDEX idx_fish_inventory_caught_at ON fish_inventory(caught_at);

ALTER TABLE fish_inventory ENABLE ROW LEVEL SECURITY;

CREATE POLICY fish_inventory_all ON fish_inventory FOR ALL USING (TRUE) WITH CHECK (TRUE);

GRANT ALL ON fish_inventory TO service_role, anon, authenticated;

-- ============================================================================
-- TABLE 5: afk_fishing_sessions (for persistent AFK)
-- ============================================================================
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

CREATE POLICY afk_sessions_all ON afk_fishing_sessions FOR ALL USING (TRUE) WITH CHECK (TRUE);

GRANT ALL ON afk_fishing_sessions TO service_role, anon, authenticated;

-- ============================================================================
-- VERIFY SUCCESS
-- ============================================================================
DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '═══════════════════════════════════════════════════════════';
  RAISE NOTICE '✅ ALL TABLES CREATED SUCCESSFULLY!';
  RAISE NOTICE '═══════════════════════════════════════════════════════════';
  RAISE NOTICE '';
  RAISE NOTICE '✅ fishing_access - User access tracking';
  RAISE NOTICE '✅ user_rods - Rod ownership';
  RAISE NOTICE '✅ fishing_inventory - Bait & saldo';
  RAISE NOTICE '✅ fish_inventory - Caught fish logs';
  RAISE NOTICE '';
  RAISE NOTICE '📝 NEXT: Deploy code with git push origin main';
  RAISE NOTICE '';
END $$;
