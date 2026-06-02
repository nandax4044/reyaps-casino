-- ============================================================================
-- FIX FISHING ACCESS - CREATE MISSING TABLE
-- ============================================================================
-- Error: Could not find the table 'public.fishing_access' in the schema cache
-- Solution: Create the fishing_access table
-- ============================================================================

-- ============================================================================
-- CREATE fishing_access TABLE
-- ============================================================================

DROP TABLE IF EXISTS fishing_access CASCADE;

CREATE TABLE fishing_access (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  granted_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  is_active BOOLEAN DEFAULT TRUE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Create indexes
CREATE INDEX idx_fishing_access_user_id ON fishing_access(user_id);
CREATE INDEX idx_fishing_access_active ON fishing_access(is_active);
CREATE INDEX idx_fishing_access_expires ON fishing_access(expires_at);

-- ============================================================================
-- CREATE user_rods TABLE (if not exists)
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

CREATE INDEX IF NOT EXISTS idx_user_rods_user_id ON user_rods(user_id);
CREATE INDEX IF NOT EXISTS idx_user_rods_rod_id ON user_rods(rod_id);

-- ============================================================================
-- CREATE fishing_inventory TABLE (if not exists)
-- ============================================================================

CREATE TABLE IF NOT EXISTS fishing_inventory (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  bait INTEGER DEFAULT 0 NOT NULL,
  fishing_saldo INTEGER DEFAULT 0 NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_fishing_inventory_user_id ON fishing_inventory(user_id);

-- ============================================================================
-- CREATE fish_inventory TABLE (if not exists)
-- ============================================================================

CREATE TABLE IF NOT EXISTS fish_inventory (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  fish_name TEXT NOT NULL,
  fish_lb DECIMAL(10, 2) NOT NULL,
  fish_value DECIMAL(10, 2) NOT NULL,
  rod_used TEXT,
  caught_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_fish_inventory_user_id ON fish_inventory(user_id);
CREATE INDEX IF NOT EXISTS idx_fish_inventory_caught_at ON fish_inventory(caught_at);

-- ============================================================================
-- ENABLE ROW LEVEL SECURITY (RLS)
-- ============================================================================

ALTER TABLE fishing_access ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_rods ENABLE ROW LEVEL SECURITY;
ALTER TABLE fishing_inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE fish_inventory ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- DROP OLD POLICIES
-- ============================================================================

DROP POLICY IF EXISTS fishing_access_select ON fishing_access;
DROP POLICY IF EXISTS fishing_access_insert ON fishing_access;
DROP POLICY IF EXISTS fishing_access_update ON fishing_access;
DROP POLICY IF EXISTS fishing_access_delete ON fishing_access;

DROP POLICY IF EXISTS user_rods_select ON user_rods;
DROP POLICY IF EXISTS user_rods_insert ON user_rods;
DROP POLICY IF EXISTS user_rods_update ON user_rods;
DROP POLICY IF EXISTS user_rods_delete ON user_rods;

DROP POLICY IF EXISTS fishing_inventory_select ON fishing_inventory;
DROP POLICY IF EXISTS fishing_inventory_insert ON fishing_inventory;
DROP POLICY IF EXISTS fishing_inventory_update ON fishing_inventory;

DROP POLICY IF EXISTS fish_inventory_select ON fish_inventory;
DROP POLICY IF EXISTS fish_inventory_insert ON fish_inventory;

-- ============================================================================
-- CREATE POLICIES (PERMISSIVE FOR SERVICE_ROLE)
-- ============================================================================

-- fishing_access policies
CREATE POLICY fishing_access_select ON fishing_access 
  FOR SELECT USING (TRUE);

CREATE POLICY fishing_access_insert ON fishing_access 
  FOR INSERT WITH CHECK (TRUE);

CREATE POLICY fishing_access_update ON fishing_access 
  FOR UPDATE USING (TRUE);

CREATE POLICY fishing_access_delete ON fishing_access 
  FOR DELETE USING (TRUE);

-- user_rods policies
CREATE POLICY user_rods_select ON user_rods 
  FOR SELECT USING (TRUE);

CREATE POLICY user_rods_insert ON user_rods 
  FOR INSERT WITH CHECK (TRUE);

CREATE POLICY user_rods_update ON user_rods 
  FOR UPDATE USING (TRUE);

CREATE POLICY user_rods_delete ON user_rods 
  FOR DELETE USING (TRUE);

-- fishing_inventory policies
CREATE POLICY fishing_inventory_select ON fishing_inventory 
  FOR SELECT USING (TRUE);

CREATE POLICY fishing_inventory_insert ON fishing_inventory 
  FOR INSERT WITH CHECK (TRUE);

CREATE POLICY fishing_inventory_update ON fishing_inventory 
  FOR UPDATE USING (TRUE);

-- fish_inventory policies
CREATE POLICY fish_inventory_select ON fish_inventory 
  FOR SELECT USING (TRUE);

CREATE POLICY fish_inventory_insert ON fish_inventory 
  FOR INSERT WITH CHECK (TRUE);

-- ============================================================================
-- GRANT PERMISSIONS
-- ============================================================================

GRANT ALL ON fishing_access TO service_role, anon, authenticated;
GRANT ALL ON user_rods TO service_role, anon, authenticated;
GRANT ALL ON fishing_inventory TO service_role, anon, authenticated;
GRANT ALL ON fish_inventory TO service_role, anon, authenticated;

-- ============================================================================
-- VERIFY TABLES
-- ============================================================================

DO $$
DECLARE
  v_fishing_access BOOLEAN;
  v_user_rods BOOLEAN;
  v_fishing_inventory BOOLEAN;
  v_fish_inventory BOOLEAN;
BEGIN
  -- Check tables exist
  SELECT EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'fishing_access'
  ) INTO v_fishing_access;
  
  SELECT EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'user_rods'
  ) INTO v_user_rods;
  
  SELECT EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'fishing_inventory'
  ) INTO v_fishing_inventory;
  
  SELECT EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'fish_inventory'
  ) INTO v_fish_inventory;
  
  -- Report
  RAISE NOTICE '';
  RAISE NOTICE '═══════════════════════════════════════════════════════════';
  RAISE NOTICE '🎣 FISHING TABLES VERIFICATION';
  RAISE NOTICE '═══════════════════════════════════════════════════════════';
  RAISE NOTICE '';
  
  IF v_fishing_access THEN
    RAISE NOTICE '✅ fishing_access table exists';
  ELSE
    RAISE EXCEPTION '❌ fishing_access table NOT FOUND!';
  END IF;
  
  IF v_user_rods THEN
    RAISE NOTICE '✅ user_rods table exists';
  ELSE
    RAISE EXCEPTION '❌ user_rods table NOT FOUND!';
  END IF;
  
  IF v_fishing_inventory THEN
    RAISE NOTICE '✅ fishing_inventory table exists';
  ELSE
    RAISE EXCEPTION '❌ fishing_inventory table NOT FOUND!';
  END IF;
  
  IF v_fish_inventory THEN
    RAISE NOTICE '✅ fish_inventory table exists';
  ELSE
    RAISE EXCEPTION '❌ fish_inventory table NOT FOUND!';
  END IF;
  
  RAISE NOTICE '';
  RAISE NOTICE '═══════════════════════════════════════════════════════════';
  RAISE NOTICE '🎉 SUCCESS! ALL FISHING TABLES READY!';
  RAISE NOTICE '═══════════════════════════════════════════════════════════';
  RAISE NOTICE '';
  RAISE NOTICE '📝 Next Steps:';
  RAISE NOTICE '1. Test grant fishing access in Admin Panel';
  RAISE NOTICE '2. Should work without "table not found" error';
  RAISE NOTICE '';
END $$;
