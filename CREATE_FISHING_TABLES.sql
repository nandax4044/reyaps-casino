-- ============================================================================
-- CREATE FISHING TABLES - COMPLETE SETUP
-- ============================================================================
-- Run this in Supabase SQL Editor to create all required fishing tables
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '═══════════════════════════════════════════════════════════';
  RAISE NOTICE '🎣 CREATING FISHING TABLES...';
  RAISE NOTICE '═══════════════════════════════════════════════════════════';
  RAISE NOTICE '';
END $$;

-- ============================================================================
-- TABLE 1: fishing_access (MISSING TABLE - THIS IS THE PROBLEM!)
-- ============================================================================

CREATE TABLE IF NOT EXISTS fishing_access (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  granted_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_fishing_access_user_id ON fishing_access(user_id);
CREATE INDEX IF NOT EXISTS idx_fishing_access_active ON fishing_access(is_active);
CREATE INDEX IF NOT EXISTS idx_fishing_access_expires ON fishing_access(expires_at);

-- Enable RLS
ALTER TABLE fishing_access ENABLE ROW LEVEL SECURITY;

-- Drop old policies
DROP POLICY IF EXISTS fishing_access_select ON fishing_access;
DROP POLICY IF EXISTS fishing_access_insert ON fishing_access;
DROP POLICY IF EXISTS fishing_access_update ON fishing_access;
DROP POLICY IF EXISTS fishing_access_delete ON fishing_access;

-- Create policies (permissive for service_role)
CREATE POLICY fishing_access_select ON fishing_access 
  FOR SELECT USING (TRUE);

CREATE POLICY fishing_access_insert ON fishing_access 
  FOR INSERT WITH CHECK (TRUE);

CREATE POLICY fishing_access_update ON fishing_access 
  FOR UPDATE USING (TRUE);

CREATE POLICY fishing_access_delete ON fishing_access 
  FOR DELETE USING (TRUE);

-- Grant permissions
GRANT ALL ON fishing_access TO service_role;
GRANT SELECT ON fishing_access TO authenticated;

DO $$
BEGIN
  RAISE NOTICE '✅ Table: fishing_access';
END $$;

-- ============================================================================
-- TABLE 2: user_rods (for rod management)
-- ============================================================================

CREATE TABLE IF NOT EXISTS user_rods (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  rod_id TEXT NOT NULL,
  granted_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  granted_at TIMESTAMPTZ DEFAULT NOW(),
  notes TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  UNIQUE(user_id, rod_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_user_rods_user_id ON user_rods(user_id);
CREATE INDEX IF NOT EXISTS idx_user_rods_rod_id ON user_rods(rod_id);

-- Enable RLS
ALTER TABLE user_rods ENABLE ROW LEVEL SECURITY;

-- Drop old policies
DROP POLICY IF EXISTS user_rods_select ON user_rods;
DROP POLICY IF EXISTS user_rods_insert ON user_rods;
DROP POLICY IF EXISTS user_rods_update ON user_rods;
DROP POLICY IF EXISTS user_rods_delete ON user_rods;

-- Create policies
CREATE POLICY user_rods_select ON user_rods 
  FOR SELECT USING (TRUE);

CREATE POLICY user_rods_insert ON user_rods 
  FOR INSERT WITH CHECK (TRUE);

CREATE POLICY user_rods_update ON user_rods 
  FOR UPDATE USING (TRUE);

CREATE POLICY user_rods_delete ON user_rods 
  FOR DELETE USING (TRUE);

-- Grant permissions
GRANT ALL ON user_rods TO service_role;
GRANT SELECT ON user_rods TO authenticated;

DO $$
BEGIN
  RAISE NOTICE '✅ Table: user_rods';
END $$;

-- ============================================================================
-- TABLE 3: fishing_inventory (for bait and fishing saldo)
-- ============================================================================

CREATE TABLE IF NOT EXISTS fishing_inventory (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  bait INTEGER DEFAULT 0 NOT NULL,
  fishing_saldo INTEGER DEFAULT 0 NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_fishing_inventory_user_id ON fishing_inventory(user_id);

-- Enable RLS
ALTER TABLE fishing_inventory ENABLE ROW LEVEL SECURITY;

-- Drop old policies
DROP POLICY IF EXISTS fishing_inventory_select ON fishing_inventory;
DROP POLICY IF EXISTS fishing_inventory_insert ON fishing_inventory;
DROP POLICY IF EXISTS fishing_inventory_update ON fishing_inventory;

-- Create policies
CREATE POLICY fishing_inventory_select ON fishing_inventory 
  FOR SELECT USING (TRUE);

CREATE POLICY fishing_inventory_insert ON fishing_inventory 
  FOR INSERT WITH CHECK (TRUE);

CREATE POLICY fishing_inventory_update ON fishing_inventory 
  FOR UPDATE USING (TRUE);

-- Grant permissions
GRANT ALL ON fishing_inventory TO service_role;
GRANT SELECT ON fishing_inventory TO authenticated;

DO $$
BEGIN
  RAISE NOTICE '✅ Table: fishing_inventory';
END $$;

-- ============================================================================
-- TABLE 4: fish_inventory (for caught fish)
-- ============================================================================

CREATE TABLE IF NOT EXISTS fish_inventory (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  fish_name TEXT NOT NULL,
  fish_lb DECIMAL(10, 2) NOT NULL,
  fish_value DECIMAL(10, 2) NOT NULL,
  rod_used TEXT,
  caught_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_fish_inventory_user_id ON fish_inventory(user_id);
CREATE INDEX IF NOT EXISTS idx_fish_inventory_caught_at ON fish_inventory(caught_at);

-- Enable RLS
ALTER TABLE fish_inventory ENABLE ROW LEVEL SECURITY;

-- Drop old policies
DROP POLICY IF EXISTS fish_inventory_select ON fish_inventory;
DROP POLICY IF EXISTS fish_inventory_insert ON fish_inventory;

-- Create policies
CREATE POLICY fish_inventory_select ON fish_inventory 
  FOR SELECT USING (TRUE);

CREATE POLICY fish_inventory_insert ON fish_inventory 
  FOR INSERT WITH CHECK (TRUE);

-- Grant permissions
GRANT ALL ON fish_inventory TO service_role;
GRANT SELECT ON fish_inventory TO authenticated;

DO $$
BEGIN
  RAISE NOTICE '✅ Table: fish_inventory';
END $$;

-- ============================================================================
-- TABLE 5: afk_fishing_sessions (for persistent AFK fishing)
-- ============================================================================

CREATE TABLE IF NOT EXISTS afk_fishing_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT NOT NULL,
  equipped_rod TEXT NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  started_at TIMESTAMPTZ DEFAULT NOW(),
  last_heartbeat TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_afk_fishing_sessions_user_id ON afk_fishing_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_afk_fishing_sessions_active ON afk_fishing_sessions(is_active);

-- Enable RLS
ALTER TABLE afk_fishing_sessions ENABLE ROW LEVEL SECURITY;

-- Drop old policies
DROP POLICY IF EXISTS afk_fishing_sessions_select ON afk_fishing_sessions;
DROP POLICY IF EXISTS afk_fishing_sessions_insert ON afk_fishing_sessions;
DROP POLICY IF EXISTS afk_fishing_sessions_update ON afk_fishing_sessions;
DROP POLICY IF EXISTS afk_fishing_sessions_delete ON afk_fishing_sessions;

-- Create policies
CREATE POLICY afk_fishing_sessions_select ON afk_fishing_sessions 
  FOR SELECT USING (TRUE);

CREATE POLICY afk_fishing_sessions_insert ON afk_fishing_sessions 
  FOR INSERT WITH CHECK (TRUE);

CREATE POLICY afk_fishing_sessions_update ON afk_fishing_sessions 
  FOR UPDATE USING (TRUE);

CREATE POLICY afk_fishing_sessions_delete ON afk_fishing_sessions 
  FOR DELETE USING (TRUE);

-- Grant permissions
GRANT ALL ON afk_fishing_sessions TO service_role;
GRANT SELECT ON afk_fishing_sessions TO authenticated;

DO $$
BEGIN
  RAISE NOTICE '✅ Table: afk_fishing_sessions';
END $$;

-- ============================================================================
-- VERIFICATION
-- ============================================================================

DO $$
DECLARE
  v_fishing_access_exists BOOLEAN;
  v_user_rods_exists BOOLEAN;
  v_fishing_inventory_exists BOOLEAN;
  v_fish_inventory_exists BOOLEAN;
  v_afk_sessions_exists BOOLEAN;
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '═══════════════════════════════════════════════════════════';
  RAISE NOTICE '🔍 VERIFYING TABLES...';
  RAISE NOTICE '═══════════════════════════════════════════════════════════';
  RAISE NOTICE '';
  
  -- Check each table
  SELECT EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'fishing_access'
  ) INTO v_fishing_access_exists;
  
  SELECT EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'user_rods'
  ) INTO v_user_rods_exists;
  
  SELECT EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'fishing_inventory'
  ) INTO v_fishing_inventory_exists;
  
  SELECT EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'fish_inventory'
  ) INTO v_fish_inventory_exists;
  
  SELECT EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'afk_fishing_sessions'
  ) INTO v_afk_sessions_exists;
  
  -- Report results
  IF v_fishing_access_exists THEN
    RAISE NOTICE '✅ fishing_access table exists';
  ELSE
    RAISE EXCEPTION '❌ fishing_access table MISSING!';
  END IF;
  
  IF v_user_rods_exists THEN
    RAISE NOTICE '✅ user_rods table exists';
  ELSE
    RAISE EXCEPTION '❌ user_rods table MISSING!';
  END IF;
  
  IF v_fishing_inventory_exists THEN
    RAISE NOTICE '✅ fishing_inventory table exists';
  ELSE
    RAISE EXCEPTION '❌ fishing_inventory table MISSING!';
  END IF;
  
  IF v_fish_inventory_exists THEN
    RAISE NOTICE '✅ fish_inventory table exists';
  ELSE
    RAISE EXCEPTION '❌ fish_inventory table MISSING!';
  END IF;
  
  IF v_afk_sessions_exists THEN
    RAISE NOTICE '✅ afk_fishing_sessions table exists';
  ELSE
    RAISE EXCEPTION '❌ afk_fishing_sessions table MISSING!';
  END IF;
  
  RAISE NOTICE '';
  RAISE NOTICE '═══════════════════════════════════════════════════════════';
  RAISE NOTICE '🎉 ALL FISHING TABLES CREATED SUCCESSFULLY!';
  RAISE NOTICE '═══════════════════════════════════════════════════════════';
  RAISE NOTICE '';
  RAISE NOTICE '📋 Created Tables:';
  RAISE NOTICE '   1. fishing_access      - Track who has fishing access';
  RAISE NOTICE '   2. user_rods           - Track rod ownership';
  RAISE NOTICE '   3. fishing_inventory   - Track bait & fishing saldo';
  RAISE NOTICE '   4. fish_inventory      - Log all caught fish';
  RAISE NOTICE '   5. afk_fishing_sessions - Track active AFK sessions';
  RAISE NOTICE '';
  RAISE NOTICE '📝 NEXT STEPS:';
  RAISE NOTICE '';
  RAISE NOTICE '1. DEPLOY UPDATED API:';
  RAISE NOTICE '   Run: .\deploy-fixes.ps1';
  RAISE NOTICE '';
  RAISE NOTICE '2. TEST GRANT ACCESS:';
  RAISE NOTICE '   - Login as admin';
  RAISE NOTICE '   - Admin Panel → Fishing Management';
  RAISE NOTICE '   - Grant access to a user (7 days)';
  RAISE NOTICE '   - ✅ Should work without "table not found" error';
  RAISE NOTICE '';
  RAISE NOTICE '3. TEST FISHING:';
  RAISE NOTICE '   - Login as user with access';
  RAISE NOTICE '   - Go to Fishing page';
  RAISE NOTICE '   - Start fishing';
  RAISE NOTICE '';
  RAISE NOTICE '═══════════════════════════════════════════════════════════';
  RAISE NOTICE '';
END $$;

-- Show table structures
DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '═══════════════════════════════════════════════════════════';
  RAISE NOTICE '📊 TABLE STRUCTURES:';
  RAISE NOTICE '═══════════════════════════════════════════════════════════';
  RAISE NOTICE '';
END $$;

-- fishing_access structure
SELECT 
  'fishing_access' AS table_name,
  column_name, 
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
AND table_name = 'fishing_access'
ORDER BY ordinal_position;

-- user_rods structure
SELECT 
  'user_rods' AS table_name,
  column_name, 
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
AND table_name = 'user_rods'
ORDER BY ordinal_position;

-- fishing_inventory structure
SELECT 
  'fishing_inventory' AS table_name,
  column_name, 
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
AND table_name = 'fishing_inventory'
ORDER BY ordinal_position;
