-- ============================================================================
-- COMPLETE DATABASE SCHEMA - REYABET FISHING SYSTEM
-- ============================================================================
-- Version: 1.0.0
-- Last Updated: 2026-06-01
-- Description: Complete schema with fishing, bait system, and admin features
-- ============================================================================

-- Clean slate
DROP TABLE IF EXISTS bait_transactions CASCADE;
DROP TABLE IF EXISTS afk_fishing_sessions CASCADE;
DROP TABLE IF EXISTS fishing_logs CASCADE;
DROP TABLE IF EXISTS fish_inventory CASCADE;
DROP TABLE IF EXISTS user_rod_access CASCADE;
DROP TABLE IF EXISTS user_rods CASCADE;
DROP TABLE IF EXISTS user_fishing_inventory CASCADE;
DROP TABLE IF EXISTS fishing_price_config CASCADE;
DROP TABLE IF EXISTS afk_access CASCADE;
DROP TABLE IF EXISTS game_configs CASCADE;
DROP TABLE IF EXISTS inventory CASCADE;
DROP TABLE IF EXISTS users CASCADE;
DROP TABLE IF EXISTS schema_version CASCADE;

DROP FUNCTION IF EXISTS create_fishing_inventory_on_access() CASCADE;
DROP FUNCTION IF EXISTS increment_fishing_saldo(UUID, DECIMAL) CASCADE;
DROP FUNCTION IF EXISTS increment_fish_caught(UUID) CASCADE;
DROP FUNCTION IF EXISTS update_equipped_rod(UUID, TEXT) CASCADE;
DROP FUNCTION IF EXISTS consume_bait(UUID) CASCADE;
DROP FUNCTION IF EXISTS grant_bait(UUID, INTEGER, UUID, TEXT) CASCADE;

-- ============================================================================
-- CORE TABLES
-- ============================================================================

CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  username TEXT UNIQUE NOT NULL,
  password TEXT,
  balance DECIMAL(10, 2) DEFAULT 0.00,
  is_staff BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_username ON users(username);

CREATE TABLE inventory (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  item_name TEXT NOT NULL,
  rarity TEXT DEFAULT 'Common',
  value DECIMAL(10, 2) DEFAULT 0,
  icon TEXT DEFAULT '🎁',
  image TEXT,
  obtained_at TIMESTAMPTZ DEFAULT NOW(),
  status TEXT DEFAULT 'available'
);

CREATE INDEX idx_inventory_user_id ON inventory(user_id);

CREATE TABLE game_configs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  game_type TEXT UNIQUE NOT NULL,
  config_data JSONB NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- FISHING TABLES
-- ============================================================================

CREATE TABLE afk_access (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  feature TEXT NOT NULL DEFAULT 'fishing',
  is_active BOOLEAN DEFAULT TRUE,
  granted_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL,
  granted_by UUID REFERENCES users(id),
  notes TEXT,
  UNIQUE(user_id, feature)
);

CREATE INDEX idx_afk_access_user_id ON afk_access(user_id);
CREATE INDEX idx_afk_access_active ON afk_access(is_active, expires_at);

CREATE TABLE user_fishing_inventory (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  fishing_saldo DECIMAL(10, 2) DEFAULT 0.00,
  total_fish_caught INTEGER DEFAULT 0,
  equipped_rod TEXT DEFAULT 'ez_rod',
  bait_balance INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_user_fishing_inventory_user_id ON user_fishing_inventory(user_id);

CREATE TABLE user_rod_access (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  rod_id TEXT NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  granted_at TIMESTAMPTZ DEFAULT NOW(),
  granted_by UUID REFERENCES users(id),
  notes TEXT,
  UNIQUE(user_id, rod_id)
);

CREATE INDEX idx_user_rod_access_user_id ON user_rod_access(user_id);

CREATE TABLE fish_inventory (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  fish_id INTEGER NOT NULL,
  fish_name TEXT NOT NULL,
  base_lb INTEGER NOT NULL,
  lb INTEGER NOT NULL,
  lb_bonus DECIMAL(5, 2) DEFAULT 0,
  is_perfect BOOLEAN DEFAULT FALSE,
  is_sold BOOLEAN DEFAULT FALSE,
  sell_price DECIMAL(10, 2) DEFAULT 0,
  caught_at TIMESTAMPTZ DEFAULT NOW(),
  sold_at TIMESTAMPTZ
);

CREATE INDEX idx_fish_inventory_user_id ON fish_inventory(user_id);
CREATE INDEX idx_fish_inventory_caught_at ON fish_inventory(caught_at DESC);

CREATE TABLE fishing_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  fish_name TEXT NOT NULL,
  lb INTEGER NOT NULL,
  base_lb INTEGER NOT NULL,
  is_sold BOOLEAN DEFAULT FALSE,
  sell_price DECIMAL(10, 2) DEFAULT 0,
  caught_at TIMESTAMPTZ DEFAULT NOW(),
  sold_at TIMESTAMPTZ
);

CREATE INDEX idx_fishing_logs_user_id ON fishing_logs(user_id);
CREATE INDEX idx_fishing_logs_caught_at ON fishing_logs(user_id, caught_at DESC);

CREATE TABLE afk_fishing_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  rod_id TEXT NOT NULL,
  started_at TIMESTAMPTZ DEFAULT NOW(),
  last_catch_at TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT TRUE
);

CREATE INDEX idx_afk_fishing_sessions_user_id ON afk_fishing_sessions(user_id);

CREATE TABLE bait_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  amount INTEGER NOT NULL,
  transaction_type TEXT NOT NULL,
  granted_by UUID REFERENCES users(id),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_bait_transactions_user_id ON bait_transactions(user_id);

CREATE TABLE fishing_price_config (
  id TEXT PRIMARY KEY,
  label TEXT NOT NULL,
  lb_min INTEGER NOT NULL,
  lb_max INTEGER NOT NULL,
  price_per_lb INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- FUNCTIONS
-- ============================================================================

CREATE OR REPLACE FUNCTION create_fishing_inventory_on_access()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.feature = 'fishing' THEN
    INSERT INTO user_fishing_inventory (user_id, equipped_rod, bait_balance)
    VALUES (NEW.user_id, 'ez_rod', 0)
    ON CONFLICT (user_id) DO NOTHING;
    
    INSERT INTO user_rod_access (user_id, rod_id, is_active, granted_by, notes)
    VALUES (NEW.user_id, 'ez_rod', TRUE, NEW.granted_by, 'Free starter rod')
    ON CONFLICT (user_id, rod_id) DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION increment_fishing_saldo(p_user_id UUID, p_amount DECIMAL)
RETURNS VOID AS $$
BEGIN
  UPDATE user_fishing_inventory
  SET fishing_saldo = fishing_saldo + p_amount, updated_at = NOW()
  WHERE user_id = p_user_id;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION increment_fish_caught(p_user_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE user_fishing_inventory
  SET total_fish_caught = total_fish_caught + 1, updated_at = NOW()
  WHERE user_id = p_user_id;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION update_equipped_rod(p_user_id UUID, p_rod TEXT)
RETURNS VOID AS $$
BEGIN
  UPDATE user_fishing_inventory
  SET equipped_rod = p_rod, updated_at = NOW()
  WHERE user_id = p_user_id;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION consume_bait(p_user_id UUID)
RETURNS INTEGER AS $$
DECLARE
  v_new_bait_balance INTEGER;
BEGIN
  UPDATE user_fishing_inventory
  SET bait_balance = GREATEST(bait_balance - 1, 0), updated_at = NOW()
  WHERE user_id = p_user_id
  RETURNING bait_balance INTO v_new_bait_balance;
  
  INSERT INTO bait_transactions (user_id, amount, transaction_type, notes)
  VALUES (p_user_id, -1, 'consume', 'Consumed for fishing');
  
  RETURN v_new_bait_balance;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION grant_bait(p_user_id UUID, p_amount INTEGER, p_granted_by UUID, p_notes TEXT DEFAULT NULL)
RETURNS INTEGER AS $$
DECLARE
  v_new_bait_balance INTEGER;
BEGIN
  -- Ensure user has fishing inventory
  INSERT INTO user_fishing_inventory (user_id, bait_balance)
  VALUES (p_user_id, 0)
  ON CONFLICT (user_id) DO NOTHING;
  
  -- Update bait balance
  UPDATE user_fishing_inventory
  SET bait_balance = bait_balance + p_amount, updated_at = NOW()
  WHERE user_id = p_user_id
  RETURNING bait_balance INTO v_new_bait_balance;
  
  -- Record transaction
  INSERT INTO bait_transactions (user_id, amount, transaction_type, granted_by, notes)
  VALUES (p_user_id, p_amount, 'grant', p_granted_by, p_notes);
  
  RETURN v_new_bait_balance;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- TRIGGERS
-- ============================================================================

DROP TRIGGER IF EXISTS trigger_create_fishing_inventory ON afk_access;
CREATE TRIGGER trigger_create_fishing_inventory
  AFTER INSERT ON afk_access
  FOR EACH ROW
  EXECUTE FUNCTION create_fishing_inventory_on_access();

-- ============================================================================
-- ROW LEVEL SECURITY
-- ============================================================================

ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE game_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE afk_access ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_fishing_inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_rod_access ENABLE ROW LEVEL SECURITY;
ALTER TABLE fish_inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE fishing_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE afk_fishing_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE bait_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE fishing_price_config ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS users_select_own ON users;
DROP POLICY IF EXISTS users_insert_own ON users;
DROP POLICY IF EXISTS users_update_own ON users;
DROP POLICY IF EXISTS inventory_select_own ON inventory;
DROP POLICY IF EXISTS inventory_insert_own ON inventory;
DROP POLICY IF EXISTS inventory_update_own ON inventory;
DROP POLICY IF EXISTS game_configs_select_all ON game_configs;
DROP POLICY IF EXISTS afk_access_select_own ON afk_access;
DROP POLICY IF EXISTS user_fishing_inventory_select_own ON user_fishing_inventory;
DROP POLICY IF EXISTS user_fishing_inventory_insert_system ON user_fishing_inventory;
DROP POLICY IF EXISTS user_fishing_inventory_update_own ON user_fishing_inventory;
DROP POLICY IF EXISTS user_rod_access_select_own ON user_rod_access;
DROP POLICY IF EXISTS fish_inventory_select_own ON fish_inventory;
DROP POLICY IF EXISTS fish_inventory_insert_own ON fish_inventory;
DROP POLICY IF EXISTS fish_inventory_update_own ON fish_inventory;
DROP POLICY IF EXISTS fishing_logs_select_own ON fishing_logs;
DROP POLICY IF EXISTS fishing_logs_insert_own ON fishing_logs;
DROP POLICY IF EXISTS afk_fishing_sessions_select_own ON afk_fishing_sessions;
DROP POLICY IF EXISTS afk_fishing_sessions_insert_own ON afk_fishing_sessions;
DROP POLICY IF EXISTS afk_fishing_sessions_update_own ON afk_fishing_sessions;
DROP POLICY IF EXISTS bait_transactions_select_own ON bait_transactions;
DROP POLICY IF EXISTS fishing_price_config_select_all ON fishing_price_config;

-- Create policies
CREATE POLICY users_select_own ON users FOR SELECT USING (auth.uid() = id);
CREATE POLICY users_insert_own ON users FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY users_update_own ON users FOR UPDATE USING (auth.uid() = id);

CREATE POLICY inventory_select_own ON inventory FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY inventory_insert_own ON inventory FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY inventory_update_own ON inventory FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY game_configs_select_all ON game_configs FOR SELECT USING (TRUE);

CREATE POLICY afk_access_select_own ON afk_access FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY user_fishing_inventory_select_own ON user_fishing_inventory FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY user_fishing_inventory_insert_system ON user_fishing_inventory FOR INSERT WITH CHECK (TRUE);
CREATE POLICY user_fishing_inventory_update_own ON user_fishing_inventory FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY user_fishing_inventory_update_system ON user_fishing_inventory FOR UPDATE USING (TRUE);

CREATE POLICY user_rod_access_select_own ON user_rod_access FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY fish_inventory_select_own ON fish_inventory FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY fish_inventory_insert_own ON fish_inventory FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY fish_inventory_insert_system ON fish_inventory FOR INSERT WITH CHECK (TRUE);
CREATE POLICY fish_inventory_update_own ON fish_inventory FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY fishing_logs_select_own ON fishing_logs FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY fishing_logs_insert_own ON fishing_logs FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY fishing_logs_insert_system ON fishing_logs FOR INSERT WITH CHECK (TRUE);

CREATE POLICY afk_fishing_sessions_select_own ON afk_fishing_sessions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY afk_fishing_sessions_insert_own ON afk_fishing_sessions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY afk_fishing_sessions_update_own ON afk_fishing_sessions FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY bait_transactions_select_own ON bait_transactions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY bait_transactions_insert_system ON bait_transactions FOR INSERT WITH CHECK (TRUE);

CREATE POLICY fishing_price_config_select_all ON fishing_price_config FOR SELECT USING (TRUE);

-- ============================================================================
-- GRANTS
-- ============================================================================

GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO service_role;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO service_role;

-- ============================================================================
-- DEFAULT DATA
-- ============================================================================

-- Admin User (CORRECT AUTH ID)
INSERT INTO users (id, email, username, password, balance, is_staff, created_at, updated_at)
VALUES (
  'e44ca573-fcf3-47fa-b73e-283747bd21bb',
  'satriarizkyananda27@gmail.com',
  'nanddev',
  encode(digest('nanda900', 'sha256'), 'hex'),
  10000.00,
  TRUE,
  NOW(),
  NOW()
)
ON CONFLICT (id) DO UPDATE
SET email = EXCLUDED.email,
    username = EXCLUDED.username,
    is_staff = EXCLUDED.is_staff,
    updated_at = NOW();

-- Fishing Price Config
INSERT INTO fishing_price_config (id, label, lb_min, lb_max, price_per_lb) VALUES
('tier1', 'Tier 1 (1-10 LB)', 1, 10, 5),
('tier2', 'Tier 2 (11-25 LB)', 11, 25, 8),
('tier3', 'Tier 3 (26-50 LB)', 26, 50, 12),
('tier4', 'Tier 4 (51-100 LB)', 51, 100, 18),
('tier5', 'Tier 5 (101+ LB)', 101, 999, 25)
ON CONFLICT (id) DO UPDATE
SET label = EXCLUDED.label,
    lb_min = EXCLUDED.lb_min,
    lb_max = EXCLUDED.lb_max,
    price_per_lb = EXCLUDED.price_per_lb,
    updated_at = NOW();

-- ============================================================================
-- SCHEMA VERSION
-- ============================================================================

CREATE TABLE schema_version (
  version TEXT PRIMARY KEY,
  applied_at TIMESTAMPTZ DEFAULT NOW(),
  description TEXT
);

INSERT INTO schema_version (version, description)
VALUES ('1.0.0', 'Complete fishing system with bait and admin features')
ON CONFLICT (version) DO UPDATE
SET applied_at = NOW();

-- ============================================================================
-- SUCCESS MESSAGE
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '═══════════════════════════════════════════════════════════';
  RAISE NOTICE '✅ SCHEMA CREATED SUCCESSFULLY!';
  RAISE NOTICE '═══════════════════════════════════════════════════════════';
  RAISE NOTICE '';
  RAISE NOTICE '📊 Tables Created: 13';
  RAISE NOTICE '🔧 Functions Created: 6';
  RAISE NOTICE '🔒 RLS Policies: Enabled';
  RAISE NOTICE '';
  RAISE NOTICE '👤 Admin User:';
  RAISE NOTICE '   Username: nanddev';
  RAISE NOTICE '   Password: nanda900';
  RAISE NOTICE '   Email: satriarizkyananda27@gmail.com';
  RAISE NOTICE '';
  RAISE NOTICE '✅ Ready to use!';
  RAISE NOTICE '';
  RAISE NOTICE '═══════════════════════════════════════════════════════════';
END $$;
