-- ============================================================================
-- FISHING SYSTEM - COMPLETE DATABASE SCHEMA
-- ============================================================================
-- Run this ONCE in Supabase SQL Editor
-- This creates ALL tables needed for fishing system
-- ============================================================================

-- ============================================================================
-- CLEANUP: Drop old tables if exist (fresh start)
-- ============================================================================
DROP TABLE IF EXISTS afk_fishing_sessions CASCADE;
DROP TABLE IF EXISTS fish_inventory CASCADE;
DROP TABLE IF EXISTS fishing_inventory CASCADE;
DROP TABLE IF EXISTS user_rods CASCADE;
DROP TABLE IF EXISTS fishing_access CASCADE;

-- ============================================================================
-- TABLE 1: fishing_access - Who can access fishing
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
CREATE INDEX idx_fishing_access_active ON fishing_access(is_active, expires_at);

ALTER TABLE fishing_access ENABLE ROW LEVEL SECURITY;
CREATE POLICY "fishing_access_all" ON fishing_access FOR ALL USING (TRUE) WITH CHECK (TRUE);
GRANT ALL ON fishing_access TO service_role, anon, authenticated;

-- ============================================================================
-- TABLE 2: fishing_inventory - User bait & saldo
-- ============================================================================
CREATE TABLE fishing_inventory (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  bait INTEGER DEFAULT 0 NOT NULL CHECK (bait >= 0),
  fishing_saldo INTEGER DEFAULT 0 NOT NULL CHECK (fishing_saldo >= 0),
  equipped_rod TEXT DEFAULT 'basic_rod',
  total_fish_caught INTEGER DEFAULT 0 NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX idx_fishing_inventory_user_id ON fishing_inventory(user_id);

ALTER TABLE fishing_inventory ENABLE ROW LEVEL SECURITY;
CREATE POLICY "fishing_inventory_all" ON fishing_inventory FOR ALL USING (TRUE) WITH CHECK (TRUE);
GRANT ALL ON fishing_inventory TO service_role, anon, authenticated;

-- ============================================================================
-- TABLE 3: user_rods - User owned rods
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
CREATE POLICY "user_rods_all" ON user_rods FOR ALL USING (TRUE) WITH CHECK (TRUE);
GRANT ALL ON user_rods TO service_role, anon, authenticated;

-- ============================================================================
-- TABLE 4: fish_inventory - Caught fish logs
-- ============================================================================
CREATE TABLE fish_inventory (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  fish_name TEXT NOT NULL,
  fish_lb DECIMAL(10, 2) NOT NULL,
  fish_value DECIMAL(10, 2) NOT NULL,
  rod_used TEXT,
  is_sold BOOLEAN DEFAULT FALSE,
  caught_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  sold_at TIMESTAMPTZ
);

CREATE INDEX idx_fish_inventory_user_id ON fish_inventory(user_id);
CREATE INDEX idx_fish_inventory_caught_at ON fish_inventory(caught_at);

ALTER TABLE fish_inventory ENABLE ROW LEVEL SECURITY;
CREATE POLICY "fish_inventory_all" ON fish_inventory FOR ALL USING (TRUE) WITH CHECK (TRUE);
GRANT ALL ON fish_inventory TO service_role, anon, authenticated;

-- ============================================================================
-- TABLE 5: afk_fishing_sessions - Persistent AFK sessions
-- ============================================================================
CREATE TABLE afk_fishing_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  username TEXT NOT NULL,
  equipped_rod TEXT NOT NULL DEFAULT 'basic_rod',
  is_active BOOLEAN DEFAULT TRUE,
  started_at TIMESTAMPTZ DEFAULT NOW(),
  last_heartbeat TIMESTAMPTZ DEFAULT NOW(),
  fish_caught INTEGER DEFAULT 0,
  bait_consumed INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_afk_sessions_user_id ON afk_fishing_sessions(user_id);
CREATE INDEX idx_afk_sessions_active ON afk_fishing_sessions(is_active);
CREATE INDEX idx_afk_sessions_heartbeat ON afk_fishing_sessions(last_heartbeat);

ALTER TABLE afk_fishing_sessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "afk_sessions_all" ON afk_fishing_sessions FOR ALL USING (TRUE) WITH CHECK (TRUE);
GRANT ALL ON afk_fishing_sessions TO service_role, anon, authenticated;

-- ============================================================================
-- FUNCTION: Auto-create inventory when granting access
-- ============================================================================
CREATE OR REPLACE FUNCTION create_fishing_inventory_on_access()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.is_active = TRUE AND NEW.feature = 'fishing' THEN
    INSERT INTO fishing_inventory (user_id, bait, fishing_saldo, equipped_rod, total_fish_caught)
    VALUES (NEW.user_id, 0, 0, 'basic_rod', 0)
    ON CONFLICT (user_id) DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- TRIGGER: Auto-create inventory on access grant
-- ============================================================================
DROP TRIGGER IF EXISTS trigger_create_fishing_inventory ON fishing_access;
CREATE TRIGGER trigger_create_fishing_inventory
  AFTER INSERT OR UPDATE ON fishing_access
  FOR EACH ROW
  EXECUTE FUNCTION create_fishing_inventory_on_access();

-- ============================================================================
-- FUNCTION: Consume bait (deduct 1 bait)
-- ============================================================================
CREATE OR REPLACE FUNCTION consume_bait(p_user_id UUID)
RETURNS TABLE(success BOOLEAN, remaining_bait INTEGER) AS $$
DECLARE
  v_current_bait INTEGER;
BEGIN
  -- Get current bait
  SELECT bait INTO v_current_bait
  FROM fishing_inventory
  WHERE user_id = p_user_id;

  -- Check if has bait
  IF v_current_bait IS NULL OR v_current_bait <= 0 THEN
    RETURN QUERY SELECT FALSE, 0;
    RETURN;
  END IF;

  -- Deduct 1 bait
  UPDATE fishing_inventory
  SET 
    bait = bait - 1,
    updated_at = NOW()
  WHERE user_id = p_user_id;

  -- Return success with remaining bait
  RETURN QUERY 
    SELECT TRUE, (v_current_bait - 1)::INTEGER;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION consume_bait(UUID) TO service_role, anon, authenticated;

-- ============================================================================
-- FUNCTION: Add fishing saldo (when selling fish)
-- ============================================================================
CREATE OR REPLACE FUNCTION add_fishing_saldo(p_user_id UUID, p_amount INTEGER)
RETURNS TABLE(success BOOLEAN, new_saldo INTEGER) AS $$
DECLARE
  v_new_saldo INTEGER;
BEGIN
  -- Add to fishing_saldo
  UPDATE fishing_inventory
  SET 
    fishing_saldo = fishing_saldo + p_amount,
    updated_at = NOW()
  WHERE user_id = p_user_id
  RETURNING fishing_saldo INTO v_new_saldo;

  IF v_new_saldo IS NULL THEN
    -- Insert if not exists
    INSERT INTO fishing_inventory (user_id, bait, fishing_saldo, equipped_rod, total_fish_caught)
    VALUES (p_user_id, 0, p_amount, 'basic_rod', 0)
    RETURNING fishing_saldo INTO v_new_saldo;
  END IF;

  RETURN QUERY SELECT TRUE, v_new_saldo;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION add_fishing_saldo(UUID, INTEGER) TO service_role, anon, authenticated;

-- ============================================================================
-- FUNCTION: Increment fish caught counter
-- ============================================================================
CREATE OR REPLACE FUNCTION increment_fish_caught(p_user_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE fishing_inventory
  SET 
    total_fish_caught = total_fish_caught + 1,
    updated_at = NOW()
  WHERE user_id = p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION increment_fish_caught(UUID) TO service_role, anon, authenticated;

-- ============================================================================
-- FUNCTION: Convert fishing saldo to main balance
-- ============================================================================
CREATE OR REPLACE FUNCTION convert_fishing_to_main_balance(p_user_id UUID, p_amount INTEGER)
RETURNS TABLE(success BOOLEAN, new_fishing_saldo INTEGER, new_main_balance DECIMAL) AS $$
DECLARE
  v_current_fishing_saldo INTEGER;
  v_new_fishing_saldo INTEGER;
  v_new_main_balance DECIMAL;
BEGIN
  -- Get current fishing saldo
  SELECT fishing_saldo INTO v_current_fishing_saldo
  FROM fishing_inventory
  WHERE user_id = p_user_id;

  -- Check if enough saldo
  IF v_current_fishing_saldo IS NULL OR v_current_fishing_saldo < p_amount THEN
    RETURN QUERY SELECT FALSE, COALESCE(v_current_fishing_saldo, 0), 0::DECIMAL;
    RETURN;
  END IF;

  -- Deduct from fishing_saldo
  UPDATE fishing_inventory
  SET 
    fishing_saldo = fishing_saldo - p_amount,
    updated_at = NOW()
  WHERE user_id = p_user_id
  RETURNING fishing_saldo INTO v_new_fishing_saldo;

  -- Add to main balance
  UPDATE users
  SET balance = balance + p_amount
  WHERE id = p_user_id
  RETURNING balance INTO v_new_main_balance;

  RETURN QUERY SELECT TRUE, v_new_fishing_saldo, v_new_main_balance;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION convert_fishing_to_main_balance(UUID, INTEGER) TO service_role, anon, authenticated;

-- ============================================================================
-- VERIFICATION & SAMPLE DATA
-- ============================================================================
DO $$
DECLARE
  v_tables_created INTEGER := 0;
  v_functions_created INTEGER := 0;
BEGIN
  -- Count tables
  SELECT COUNT(*) INTO v_tables_created
  FROM information_schema.tables
  WHERE table_schema = 'public'
    AND table_name IN ('fishing_access', 'fishing_inventory', 'user_rods', 'fish_inventory', 'afk_fishing_sessions');

  -- Count functions
  SELECT COUNT(*) INTO v_functions_created
  FROM pg_proc
  WHERE proname IN ('consume_bait', 'add_fishing_saldo', 'increment_fish_caught', 'convert_fishing_to_main_balance');

  RAISE NOTICE '';
  RAISE NOTICE '═══════════════════════════════════════════════════════════';
  RAISE NOTICE '✅ FISHING SYSTEM - SCHEMA COMPLETE!';
  RAISE NOTICE '═══════════════════════════════════════════════════════════';
  RAISE NOTICE '';
  RAISE NOTICE '📊 CREATED:';
  RAISE NOTICE '  ├─ Tables: % / 5', v_tables_created;
  RAISE NOTICE '  └─ Functions: % / 4', v_functions_created;
  RAISE NOTICE '';
  
  IF v_tables_created = 5 AND v_functions_created = 4 THEN
    RAISE NOTICE '✅ ALL COMPONENTS READY!';
    RAISE NOTICE '';
    RAISE NOTICE '📝 TABLES:';
    RAISE NOTICE '  1. fishing_access - Who can fish';
    RAISE NOTICE '  2. fishing_inventory - Bait, saldo, rod, stats';
    RAISE NOTICE '  3. user_rods - Owned rods';
    RAISE NOTICE '  4. fish_inventory - Caught fish logs';
    RAISE NOTICE '  5. afk_fishing_sessions - Persistent AFK';
    RAISE NOTICE '';
    RAISE NOTICE '⚙️  FUNCTIONS:';
    RAISE NOTICE '  1. consume_bait() - Deduct 1 bait';
    RAISE NOTICE '  2. add_fishing_saldo() - Add saldo from fish sale';
    RAISE NOTICE '  3. increment_fish_caught() - Update fish counter';
    RAISE NOTICE '  4. convert_fishing_to_main_balance() - Convert saldo to WL';
    RAISE NOTICE '';
    RAISE NOTICE '🚀 NEXT: Deploy backend code!';
  ELSE
    RAISE EXCEPTION '❌ INCOMPLETE! Tables: %, Functions: %', v_tables_created, v_functions_created;
  END IF;
  
  RAISE NOTICE '';
END $$;

-- Script complete! Check output above for verification.

