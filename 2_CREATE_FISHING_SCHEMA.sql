-- ============================================================================
-- STEP 2: CREATE FISHING SCHEMA (CLEAN & SIMPLE)
-- ============================================================================
-- Jalankan SETELAH 1_DROP_ALL_FISHING.sql
-- ============================================================================

-- ============================================================================
-- TABLE 1: fishing_access - Who can fish
-- ============================================================================
CREATE TABLE fishing_access (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  granted_by UUID REFERENCES users(id) ON DELETE SET NULL,
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '30 days'),
  is_active BOOLEAN DEFAULT TRUE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX idx_fishing_access_user ON fishing_access(user_id);
CREATE INDEX idx_fishing_access_active ON fishing_access(is_active, expires_at);

ALTER TABLE fishing_access ENABLE ROW LEVEL SECURITY;
CREATE POLICY "fishing_access_policy" ON fishing_access FOR ALL USING (TRUE) WITH CHECK (TRUE);
GRANT ALL ON fishing_access TO service_role, anon, authenticated;

-- ============================================================================
-- TABLE 2: fishing_inventory - Main inventory (bait, saldo, rod)
-- ============================================================================
CREATE TABLE fishing_inventory (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  bait INTEGER DEFAULT 0 NOT NULL CHECK (bait >= 0),
  fishing_saldo INTEGER DEFAULT 0 NOT NULL CHECK (fishing_saldo >= 0),
  equipped_rod TEXT DEFAULT 'basic_rod',
  total_fish_caught INTEGER DEFAULT 0 NOT NULL CHECK (total_fish_caught >= 0),
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX idx_fishing_inventory_user ON fishing_inventory(user_id);

ALTER TABLE fishing_inventory ENABLE ROW LEVEL SECURITY;
CREATE POLICY "fishing_inventory_policy" ON fishing_inventory FOR ALL USING (TRUE) WITH CHECK (TRUE);
GRANT ALL ON fishing_inventory TO service_role, anon, authenticated;

-- ============================================================================
-- TABLE 3: fish_inventory - Caught fish logs
-- ============================================================================
CREATE TABLE fish_inventory (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  fish_id INTEGER,
  fish_name TEXT NOT NULL,
  base_lb INTEGER NOT NULL,
  lb INTEGER NOT NULL,
  lb_bonus INTEGER DEFAULT 0,
  is_perfect BOOLEAN DEFAULT FALSE,
  is_sold BOOLEAN DEFAULT FALSE,
  sell_price INTEGER DEFAULT 0,
  rod_used TEXT,
  caught_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  sold_at TIMESTAMPTZ
);

CREATE INDEX idx_fish_inventory_user ON fish_inventory(user_id);
CREATE INDEX idx_fish_inventory_caught ON fish_inventory(caught_at DESC);

ALTER TABLE fish_inventory ENABLE ROW LEVEL SECURITY;
CREATE POLICY "fish_inventory_policy" ON fish_inventory FOR ALL USING (TRUE) WITH CHECK (TRUE);
GRANT ALL ON fish_inventory TO service_role, anon, authenticated;

-- ============================================================================
-- TABLE 4: afk_fishing_sessions - AFK tracking
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

CREATE INDEX idx_afk_sessions_user ON afk_fishing_sessions(user_id);
CREATE INDEX idx_afk_sessions_active ON afk_fishing_sessions(is_active);

ALTER TABLE afk_fishing_sessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "afk_sessions_policy" ON afk_fishing_sessions FOR ALL USING (TRUE) WITH CHECK (TRUE);
GRANT ALL ON afk_fishing_sessions TO service_role, anon, authenticated;

-- ============================================================================
-- TABLE 5: user_rods - Owned rods (optional, for premium rods)
-- ============================================================================
CREATE TABLE user_rods (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  rod_id TEXT NOT NULL,
  granted_by UUID REFERENCES users(id) ON DELETE SET NULL,
  granted_at TIMESTAMPTZ DEFAULT NOW(),
  is_active BOOLEAN DEFAULT TRUE,
  UNIQUE(user_id, rod_id)
);

CREATE INDEX idx_user_rods_user ON user_rods(user_id);

ALTER TABLE user_rods ENABLE ROW LEVEL SECURITY;
CREATE POLICY "user_rods_policy" ON user_rods FOR ALL USING (TRUE) WITH CHECK (TRUE);
GRANT ALL ON user_rods TO service_role, anon, authenticated;

-- ============================================================================
-- FUNCTION 1: Consume bait (kurangi 1 bait)
-- ============================================================================
CREATE OR REPLACE FUNCTION consume_bait(p_user_id UUID)
RETURNS TABLE(success BOOLEAN, remaining_bait INTEGER) AS $$
DECLARE
  v_current_bait INTEGER;
BEGIN
  SELECT bait INTO v_current_bait
  FROM fishing_inventory
  WHERE user_id = p_user_id;

  IF v_current_bait IS NULL OR v_current_bait <= 0 THEN
    RETURN QUERY SELECT FALSE, 0;
    RETURN;
  END IF;

  UPDATE fishing_inventory
  SET bait = bait - 1, updated_at = NOW()
  WHERE user_id = p_user_id;

  RETURN QUERY SELECT TRUE, (v_current_bait - 1)::INTEGER;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION consume_bait(UUID) TO service_role, anon, authenticated;

-- ============================================================================
-- FUNCTION 2: Add fishing saldo (dari jual ikan)
-- ============================================================================
CREATE OR REPLACE FUNCTION add_fishing_saldo(p_user_id UUID, p_amount INTEGER)
RETURNS TABLE(success BOOLEAN, new_saldo INTEGER) AS $$
DECLARE
  v_new_saldo INTEGER;
BEGIN
  UPDATE fishing_inventory
  SET fishing_saldo = fishing_saldo + p_amount, updated_at = NOW()
  WHERE user_id = p_user_id
  RETURNING fishing_saldo INTO v_new_saldo;

  IF v_new_saldo IS NULL THEN
    INSERT INTO fishing_inventory (user_id, bait, fishing_saldo, equipped_rod, total_fish_caught)
    VALUES (p_user_id, 0, p_amount, 'basic_rod', 0)
    RETURNING fishing_saldo INTO v_new_saldo;
  END IF;

  RETURN QUERY SELECT TRUE, v_new_saldo;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION add_fishing_saldo(UUID, INTEGER) TO service_role, anon, authenticated;

-- ============================================================================
-- FUNCTION 3: Increment fish caught
-- ============================================================================
CREATE OR REPLACE FUNCTION increment_fish_caught(p_user_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE fishing_inventory
  SET total_fish_caught = total_fish_caught + 1, updated_at = NOW()
  WHERE user_id = p_user_id;
  
  IF NOT FOUND THEN
    INSERT INTO fishing_inventory (user_id, bait, fishing_saldo, equipped_rod, total_fish_caught)
    VALUES (p_user_id, 0, 0, 'basic_rod', 1);
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION increment_fish_caught(UUID) TO service_role, anon, authenticated;

-- ============================================================================
-- FUNCTION 4: Convert fishing saldo to main balance
-- ============================================================================
CREATE OR REPLACE FUNCTION convert_fishing_to_balance(p_user_id UUID, p_amount INTEGER)
RETURNS TABLE(success BOOLEAN, new_fishing_saldo INTEGER, new_balance DECIMAL) AS $$
DECLARE
  v_current_saldo INTEGER;
  v_new_saldo INTEGER;
  v_new_balance DECIMAL;
BEGIN
  SELECT fishing_saldo INTO v_current_saldo
  FROM fishing_inventory
  WHERE user_id = p_user_id;

  IF v_current_saldo IS NULL OR v_current_saldo < p_amount THEN
    RETURN QUERY SELECT FALSE, COALESCE(v_current_saldo, 0), 0::DECIMAL;
    RETURN;
  END IF;

  UPDATE fishing_inventory
  SET fishing_saldo = fishing_saldo - p_amount, updated_at = NOW()
  WHERE user_id = p_user_id
  RETURNING fishing_saldo INTO v_new_saldo;

  UPDATE users
  SET balance = balance + p_amount
  WHERE id = p_user_id
  RETURNING balance INTO v_new_balance;

  RETURN QUERY SELECT TRUE, v_new_saldo, v_new_balance;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION convert_fishing_to_balance(UUID, INTEGER) TO service_role, anon, authenticated;

-- ============================================================================
-- FUNCTION 5: Increment fishing saldo (alias for compatibility)
-- ============================================================================
CREATE OR REPLACE FUNCTION increment_fishing_saldo(p_user_id UUID, p_amount INTEGER)
RETURNS VOID AS $$
BEGIN
  PERFORM add_fishing_saldo(p_user_id, p_amount);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION increment_fishing_saldo(UUID, INTEGER) TO service_role, anon, authenticated;

-- ============================================================================
-- VERIFICATION
-- ============================================================================
DO $$
DECLARE
  v_tables INTEGER;
  v_functions INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_tables
  FROM information_schema.tables
  WHERE table_schema = 'public'
    AND table_name IN ('fishing_access', 'fishing_inventory', 'fish_inventory', 'afk_fishing_sessions', 'user_rods');

  SELECT COUNT(*) INTO v_functions
  FROM pg_proc
  WHERE proname IN ('consume_bait', 'add_fishing_saldo', 'increment_fish_caught', 'convert_fishing_to_balance', 'increment_fishing_saldo');

  RAISE NOTICE '';
  RAISE NOTICE '═══════════════════════════════════════════';
  RAISE NOTICE '✅ FISHING SCHEMA CREATED!';
  RAISE NOTICE '═══════════════════════════════════════════';
  RAISE NOTICE '';
  RAISE NOTICE '📊 CREATED:';
  RAISE NOTICE '  Tables: % / 5', v_tables;
  RAISE NOTICE '  Functions: % / 5', v_functions;
  RAISE NOTICE '';
  
  IF v_tables = 5 AND v_functions = 5 THEN
    RAISE NOTICE '✅ ALL COMPLETE!';
    RAISE NOTICE '';
    RAISE NOTICE '📝 TABLES:';
    RAISE NOTICE '  1. fishing_access';
    RAISE NOTICE '  2. fishing_inventory (bait, saldo, rod)';
    RAISE NOTICE '  3. fish_inventory (logs)';
    RAISE NOTICE '  4. afk_fishing_sessions';
    RAISE NOTICE '  5. user_rods';
    RAISE NOTICE '';
    RAISE NOTICE '⚙️  FUNCTIONS:';
    RAISE NOTICE '  1. consume_bait()';
    RAISE NOTICE '  2. add_fishing_saldo()';
    RAISE NOTICE '  3. increment_fish_caught()';
    RAISE NOTICE '  4. convert_fishing_to_balance()';
    RAISE NOTICE '  5. increment_fishing_saldo()';
    RAISE NOTICE '';
    RAISE NOTICE '🚀 NEXT: Deploy backend code & test!';
  ELSE
    RAISE EXCEPTION '❌ INCOMPLETE! Tables: %, Functions: %', v_tables, v_functions;
  END IF;
  
  RAISE NOTICE '';
END $$;
