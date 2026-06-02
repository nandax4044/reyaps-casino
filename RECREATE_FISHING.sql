-- ============================================================================
-- RECREATE FISHING SYSTEM - DROP & CREATE IN ONE FILE
-- ============================================================================
-- Jalankan file ini SEKALI untuk reset fishing system
-- ============================================================================

-- ============================================================================
-- PART 1: DROP EVERYTHING (Clean Slate)
-- ============================================================================

-- Drop triggers
DROP TRIGGER IF EXISTS trigger_create_fishing_inventory ON fishing_access CASCADE;

-- Drop all functions
DROP FUNCTION IF EXISTS consume_bait(UUID) CASCADE;
DROP FUNCTION IF EXISTS add_fishing_saldo(UUID, INTEGER) CASCADE;
DROP FUNCTION IF EXISTS increment_fish_caught(UUID) CASCADE;
DROP FUNCTION IF EXISTS convert_fishing_to_main_balance(UUID, INTEGER) CASCADE;
DROP FUNCTION IF EXISTS convert_fishing_to_balance(UUID, INTEGER) CASCADE;
DROP FUNCTION IF EXISTS create_fishing_inventory_on_access() CASCADE;
DROP FUNCTION IF EXISTS increment_fishing_saldo(UUID, DECIMAL) CASCADE;
DROP FUNCTION IF EXISTS increment_fishing_saldo(UUID, INTEGER) CASCADE;
DROP FUNCTION IF EXISTS update_equipped_rod(UUID, TEXT) CASCADE;
DROP FUNCTION IF EXISTS grant_bait(UUID, INTEGER, UUID, TEXT) CASCADE;
DROP FUNCTION IF EXISTS deduct_bait(UUID, INTEGER) CASCADE;

-- Drop all tables
DROP TABLE IF EXISTS afk_fishing_sessions CASCADE;
DROP TABLE IF EXISTS fish_inventory CASCADE;
DROP TABLE IF EXISTS fishing_inventory CASCADE;
DROP TABLE IF EXISTS user_fishing_inventory CASCADE;
DROP TABLE IF EXISTS user_rods CASCADE;
DROP TABLE IF EXISTS user_rod_access CASCADE;
DROP TABLE IF EXISTS fishing_access CASCADE;
DROP TABLE IF EXISTS afk_access CASCADE;

-- ============================================================================
-- PART 2: CREATE TABLES
-- ============================================================================

-- TABLE 1: fishing_access
CREATE TABLE fishing_access (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  granted_by UUID REFERENCES users(id) ON DELETE SET NULL,
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '365 days'),
  is_active BOOLEAN DEFAULT TRUE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX idx_fishing_access_user ON fishing_access(user_id);
CREATE INDEX idx_fishing_access_active ON fishing_access(is_active, expires_at);

ALTER TABLE fishing_access ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all access to fishing_access" ON fishing_access FOR ALL USING (TRUE) WITH CHECK (TRUE);
GRANT ALL ON fishing_access TO service_role, anon, authenticated;

-- TABLE 2: fishing_inventory (MAIN TABLE)
CREATE TABLE fishing_inventory (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  bait INTEGER DEFAULT 0 NOT NULL CHECK (bait >= 0),
  fishing_saldo INTEGER DEFAULT 0 NOT NULL CHECK (fishing_saldo >= 0),
  equipped_rod TEXT DEFAULT 'basic_rod' NOT NULL,
  total_fish_caught INTEGER DEFAULT 0 NOT NULL CHECK (total_fish_caught >= 0),
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX idx_fishing_inventory_user ON fishing_inventory(user_id);

ALTER TABLE fishing_inventory ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all access to fishing_inventory" ON fishing_inventory FOR ALL USING (TRUE) WITH CHECK (TRUE);
GRANT ALL ON fishing_inventory TO service_role, anon, authenticated;

-- TABLE 3: fish_inventory
CREATE TABLE fish_inventory (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  fish_id INTEGER,
  fish_name TEXT NOT NULL,
  base_lb INTEGER NOT NULL CHECK (base_lb > 0),
  lb INTEGER NOT NULL CHECK (lb > 0),
  lb_bonus INTEGER DEFAULT 0 CHECK (lb_bonus >= 0),
  is_perfect BOOLEAN DEFAULT FALSE,
  is_sold BOOLEAN DEFAULT FALSE,
  sell_price INTEGER DEFAULT 0 CHECK (sell_price >= 0),
  rod_used TEXT,
  caught_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  sold_at TIMESTAMPTZ
);

CREATE INDEX idx_fish_inventory_user ON fish_inventory(user_id);
CREATE INDEX idx_fish_inventory_caught ON fish_inventory(caught_at DESC);
CREATE INDEX idx_fish_inventory_sold ON fish_inventory(is_sold);

ALTER TABLE fish_inventory ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all access to fish_inventory" ON fish_inventory FOR ALL USING (TRUE) WITH CHECK (TRUE);
GRANT ALL ON fish_inventory TO service_role, anon, authenticated;

-- TABLE 4: afk_fishing_sessions
CREATE TABLE afk_fishing_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  username TEXT NOT NULL,
  equipped_rod TEXT NOT NULL DEFAULT 'basic_rod',
  is_active BOOLEAN DEFAULT TRUE,
  started_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  last_heartbeat TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  fish_caught INTEGER DEFAULT 0 NOT NULL CHECK (fish_caught >= 0),
  bait_consumed INTEGER DEFAULT 0 NOT NULL CHECK (bait_consumed >= 0),
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX idx_afk_sessions_user ON afk_fishing_sessions(user_id);
CREATE INDEX idx_afk_sessions_active ON afk_fishing_sessions(is_active);
CREATE INDEX idx_afk_sessions_heartbeat ON afk_fishing_sessions(last_heartbeat DESC);

ALTER TABLE afk_fishing_sessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all access to afk_fishing_sessions" ON afk_fishing_sessions FOR ALL USING (TRUE) WITH CHECK (TRUE);
GRANT ALL ON afk_fishing_sessions TO service_role, anon, authenticated;

-- TABLE 5: user_rods
CREATE TABLE user_rods (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  rod_id TEXT NOT NULL,
  granted_by UUID REFERENCES users(id) ON DELETE SET NULL,
  granted_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  notes TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  UNIQUE(user_id, rod_id)
);

CREATE INDEX idx_user_rods_user ON user_rods(user_id);
CREATE INDEX idx_user_rods_rod ON user_rods(rod_id);

ALTER TABLE user_rods ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all access to user_rods" ON user_rods FOR ALL USING (TRUE) WITH CHECK (TRUE);
GRANT ALL ON user_rods TO service_role, anon, authenticated;

-- ============================================================================
-- PART 3: CREATE FUNCTIONS
-- ============================================================================

-- FUNCTION 1: consume_bait
CREATE FUNCTION consume_bait(p_user_id UUID)
RETURNS TABLE(success BOOLEAN, remaining_bait INTEGER) AS $$
DECLARE
  v_current_bait INTEGER;
BEGIN
  SELECT bait INTO v_current_bait FROM fishing_inventory WHERE user_id = p_user_id;
  
  IF v_current_bait IS NULL OR v_current_bait <= 0 THEN
    RETURN QUERY SELECT FALSE, 0;
    RETURN;
  END IF;

  UPDATE fishing_inventory SET bait = bait - 1, updated_at = NOW() WHERE user_id = p_user_id;
  RETURN QUERY SELECT TRUE, (v_current_bait - 1)::INTEGER;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION consume_bait(UUID) TO service_role, anon, authenticated;

-- FUNCTION 2: add_fishing_saldo
CREATE FUNCTION add_fishing_saldo(p_user_id UUID, p_amount INTEGER)
RETURNS TABLE(success BOOLEAN, new_saldo INTEGER) AS $$
DECLARE
  v_new_saldo INTEGER;
BEGIN
  UPDATE fishing_inventory SET fishing_saldo = fishing_saldo + p_amount, updated_at = NOW()
  WHERE user_id = p_user_id RETURNING fishing_saldo INTO v_new_saldo;

  IF v_new_saldo IS NULL THEN
    INSERT INTO fishing_inventory (user_id, bait, fishing_saldo, equipped_rod, total_fish_caught)
    VALUES (p_user_id, 0, p_amount, 'basic_rod', 0) RETURNING fishing_saldo INTO v_new_saldo;
  END IF;

  RETURN QUERY SELECT TRUE, v_new_saldo;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION add_fishing_saldo(UUID, INTEGER) TO service_role, anon, authenticated;

-- FUNCTION 3: increment_fish_caught
CREATE FUNCTION increment_fish_caught(p_user_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE fishing_inventory SET total_fish_caught = total_fish_caught + 1, updated_at = NOW()
  WHERE user_id = p_user_id;
  
  IF NOT FOUND THEN
    INSERT INTO fishing_inventory (user_id, bait, fishing_saldo, equipped_rod, total_fish_caught)
    VALUES (p_user_id, 0, 0, 'basic_rod', 1);
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION increment_fish_caught(UUID) TO service_role, anon, authenticated;

-- FUNCTION 4: convert_fishing_to_balance
CREATE FUNCTION convert_fishing_to_balance(p_user_id UUID, p_amount INTEGER)
RETURNS TABLE(success BOOLEAN, new_fishing_saldo INTEGER, new_balance DECIMAL) AS $$
DECLARE
  v_current_saldo INTEGER;
  v_new_saldo INTEGER;
  v_new_balance DECIMAL;
BEGIN
  SELECT fishing_saldo INTO v_current_saldo FROM fishing_inventory WHERE user_id = p_user_id;

  IF v_current_saldo IS NULL OR v_current_saldo < p_amount THEN
    RETURN QUERY SELECT FALSE, COALESCE(v_current_saldo, 0), 0::DECIMAL;
    RETURN;
  END IF;

  UPDATE fishing_inventory SET fishing_saldo = fishing_saldo - p_amount, updated_at = NOW()
  WHERE user_id = p_user_id RETURNING fishing_saldo INTO v_new_saldo;

  UPDATE users SET balance = balance + p_amount WHERE id = p_user_id RETURNING balance INTO v_new_balance;

  RETURN QUERY SELECT TRUE, v_new_saldo, v_new_balance;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION convert_fishing_to_balance(UUID, INTEGER) TO service_role, anon, authenticated;

-- FUNCTION 5: increment_fishing_saldo (alias for compatibility)
CREATE FUNCTION increment_fishing_saldo(p_user_id UUID, p_amount INTEGER)
RETURNS VOID AS $$
BEGIN
  PERFORM add_fishing_saldo(p_user_id, p_amount);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION increment_fishing_saldo(UUID, INTEGER) TO service_role, anon, authenticated;

-- ============================================================================
-- PART 4: VERIFICATION
-- ============================================================================
DO $$
DECLARE
  v_tables INTEGER;
  v_functions INTEGER;
  v_table_names TEXT[];
  v_function_names TEXT[];
BEGIN
  -- Count tables
  SELECT COUNT(*) INTO v_tables
  FROM information_schema.tables
  WHERE table_schema = 'public'
    AND table_name IN ('fishing_access', 'fishing_inventory', 'fish_inventory', 'afk_fishing_sessions', 'user_rods');

  -- Count functions
  SELECT COUNT(*) INTO v_functions
  FROM pg_proc
  WHERE proname IN ('consume_bait', 'add_fishing_saldo', 'increment_fish_caught', 'convert_fishing_to_balance', 'increment_fishing_saldo');

  RAISE NOTICE '';
  RAISE NOTICE '════════════════════════════════════════════════════════';
  RAISE NOTICE '✅ FISHING SYSTEM RECREATED!';
  RAISE NOTICE '════════════════════════════════════════════════════════';
  RAISE NOTICE '';
  RAISE NOTICE '📊 CREATED:';
  RAISE NOTICE '   Tables: % / 5', v_tables;
  RAISE NOTICE '   Functions: % / 5', v_functions;
  RAISE NOTICE '';
  
  IF v_tables = 5 THEN
    RAISE NOTICE '✅ TABLES:';
    RAISE NOTICE '   1. fishing_access - Access control';
    RAISE NOTICE '   2. fishing_inventory - Bait, saldo, rod (MAIN)';
    RAISE NOTICE '   3. fish_inventory - Caught fish logs';
    RAISE NOTICE '   4. afk_fishing_sessions - AFK tracking';
    RAISE NOTICE '   5. user_rods - Premium rods';
  ELSE
    RAISE EXCEPTION '❌ Tables incomplete: % / 5', v_tables;
  END IF;
  
  RAISE NOTICE '';
  
  IF v_functions = 5 THEN
    RAISE NOTICE '✅ FUNCTIONS:';
    RAISE NOTICE '   1. consume_bait(user_id) - Deduct 1 bait';
    RAISE NOTICE '   2. add_fishing_saldo(user_id, amount) - Add saldo';
    RAISE NOTICE '   3. increment_fish_caught(user_id) - Increment counter';
    RAISE NOTICE '   4. convert_fishing_to_balance(user_id, amount) - Convert to WL';
    RAISE NOTICE '   5. increment_fishing_saldo(user_id, amount) - Alias';
  ELSE
    RAISE EXCEPTION '❌ Functions incomplete: % / 5', v_functions;
  END IF;
  
  RAISE NOTICE '';
  RAISE NOTICE '════════════════════════════════════════════════════════';
  RAISE NOTICE '🎉 SUCCESS! Fishing system ready to use!';
  RAISE NOTICE '════════════════════════════════════════════════════════';
  RAISE NOTICE '';
  RAISE NOTICE '📝 NEXT STEPS:';
  RAISE NOTICE '   1. Login as admin';
  RAISE NOTICE '   2. Grant fishing access to users';
  RAISE NOTICE '   3. Grant bait (e.g., 100 bait)';
  RAISE NOTICE '   4. Test fishing in app';
  RAISE NOTICE '';
END $$;
