-- ============================================================================
-- CREATE MISSING TABLES
-- ============================================================================
-- Script ini membuat tabel-tabel yang mungkin belum ada di database
-- Jalankan ini SETELAH FIX_DEPLOYMENT_ISSUES.sql
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '═══════════════════════════════════════════════════════════';
  RAISE NOTICE '📦 CREATING MISSING TABLES';
  RAISE NOTICE '═══════════════════════════════════════════════════════════';
  RAISE NOTICE '';
END $$;

-- ============================================================================
-- TABLE: fish_price_config
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE '📝 Creating fish_price_config table...';
END $$;

CREATE TABLE IF NOT EXISTS fish_price_config (
  id TEXT PRIMARY KEY,
  fish_name TEXT NOT NULL,
  price_per_lb NUMERIC(10, 2) NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert default prices
INSERT INTO fish_price_config (id, fish_name, price_per_lb) VALUES
  ('wigly', 'Wigly', 5),
  ('cotd', 'Cotd', 30),
  ('goldenrod', 'Golden Rod', 2500),
  ('hatfishing', 'Fishing Hat', 7000),
  ('tgrod', 'Thanks Giving Rod', 10000)
ON CONFLICT (id) DO UPDATE SET
  fish_name = EXCLUDED.fish_name,
  price_per_lb = EXCLUDED.price_per_lb,
  updated_at = NOW();

-- Enable RLS
ALTER TABLE fish_price_config ENABLE ROW LEVEL SECURITY;

-- Drop old policies
DROP POLICY IF EXISTS fish_price_config_select_all ON fish_price_config;
DROP POLICY IF EXISTS fish_price_config_update_admin ON fish_price_config;

-- Create policies
CREATE POLICY fish_price_config_select_all ON fish_price_config 
  FOR SELECT USING (TRUE);

CREATE POLICY fish_price_config_update_admin ON fish_price_config 
  FOR UPDATE USING (TRUE);

CREATE POLICY fish_price_config_insert_admin ON fish_price_config 
  FOR INSERT WITH CHECK (TRUE);

-- Grant permissions
GRANT ALL ON fish_price_config TO service_role;
GRANT SELECT ON fish_price_config TO anon;
GRANT SELECT ON fish_price_config TO authenticated;

DO $$
BEGIN
  RAISE NOTICE '✅ fish_price_config table created';
END $$;

-- ============================================================================
-- TABLE: fish_leaderboard
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '📝 Creating fish_leaderboard table...';
END $$;

CREATE TABLE IF NOT EXISTS fish_leaderboard (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  fish_id INTEGER NOT NULL,
  fish_name TEXT NOT NULL,
  lb NUMERIC(10, 2) NOT NULL,
  caught_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  rod_used TEXT,
  is_record BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_fish_leaderboard_fish_id ON fish_leaderboard(fish_id);
CREATE INDEX IF NOT EXISTS idx_fish_leaderboard_lb ON fish_leaderboard(lb DESC);
CREATE INDEX IF NOT EXISTS idx_fish_leaderboard_user_id ON fish_leaderboard(user_id);
CREATE INDEX IF NOT EXISTS idx_fish_leaderboard_caught_at ON fish_leaderboard(caught_at DESC);

-- Enable RLS
ALTER TABLE fish_leaderboard ENABLE ROW LEVEL SECURITY;

-- Drop old policies
DROP POLICY IF EXISTS fish_leaderboard_select_all ON fish_leaderboard;
DROP POLICY IF EXISTS fish_leaderboard_insert_own ON fish_leaderboard;
DROP POLICY IF EXISTS fish_leaderboard_insert_system ON fish_leaderboard;

-- Create policies
CREATE POLICY fish_leaderboard_select_all ON fish_leaderboard 
  FOR SELECT USING (TRUE);

CREATE POLICY fish_leaderboard_insert_system ON fish_leaderboard 
  FOR INSERT WITH CHECK (TRUE);

-- Grant permissions
GRANT ALL ON fish_leaderboard TO service_role;
GRANT SELECT ON fish_leaderboard TO anon;
GRANT SELECT ON fish_leaderboard TO authenticated;

DO $$
BEGIN
  RAISE NOTICE '✅ fish_leaderboard table created';
END $$;

-- ============================================================================
-- TABLE: bait_transactions (if not exists)
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '📝 Creating bait_transactions table...';
END $$;

CREATE TABLE IF NOT EXISTS bait_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  amount INTEGER NOT NULL,
  transaction_type TEXT NOT NULL CHECK (transaction_type IN ('grant', 'deduct', 'refund')),
  granted_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_bait_transactions_user_id ON bait_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_bait_transactions_created_at ON bait_transactions(created_at DESC);

-- Enable RLS
ALTER TABLE bait_transactions ENABLE ROW LEVEL SECURITY;

-- Drop old policies
DROP POLICY IF EXISTS bait_transactions_select_own ON bait_transactions;
DROP POLICY IF EXISTS bait_transactions_insert_system ON bait_transactions;

-- Create policies
CREATE POLICY bait_transactions_select_own ON bait_transactions 
  FOR SELECT USING (auth.uid() = user_id OR auth.uid() = granted_by);

CREATE POLICY bait_transactions_insert_system ON bait_transactions 
  FOR INSERT WITH CHECK (TRUE);

-- Grant permissions
GRANT ALL ON bait_transactions TO service_role;
GRANT SELECT ON bait_transactions TO authenticated;

DO $$
BEGIN
  RAISE NOTICE '✅ bait_transactions table created';
END $$;

-- ============================================================================
-- TABLE: user_rod_access (if not exists)
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '📝 Creating user_rod_access table...';
END $$;

CREATE TABLE IF NOT EXISTS user_rod_access (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  rod_id TEXT NOT NULL,
  granted_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  granted_at TIMESTAMPTZ DEFAULT NOW(),
  notes TEXT,
  UNIQUE(user_id, rod_id)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_user_rod_access_user_id ON user_rod_access(user_id);
CREATE INDEX IF NOT EXISTS idx_user_rod_access_rod_id ON user_rod_access(rod_id);

-- Enable RLS
ALTER TABLE user_rod_access ENABLE ROW LEVEL SECURITY;

-- Drop old policies
DROP POLICY IF EXISTS user_rod_access_select_own ON user_rod_access;
DROP POLICY IF EXISTS user_rod_access_insert_system ON user_rod_access;

-- Create policies
CREATE POLICY user_rod_access_select_own ON user_rod_access 
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY user_rod_access_insert_system ON user_rod_access 
  FOR INSERT WITH CHECK (TRUE);

CREATE POLICY user_rod_access_delete_system ON user_rod_access 
  FOR DELETE USING (TRUE);

-- Grant permissions
GRANT ALL ON user_rod_access TO service_role;
GRANT SELECT ON user_rod_access TO authenticated;

DO $$
BEGIN
  RAISE NOTICE '✅ user_rod_access table created';
END $$;

-- ============================================================================
-- VERIFICATION
-- ============================================================================

DO $$
DECLARE
  v_price_config_exists BOOLEAN;
  v_leaderboard_exists BOOLEAN;
  v_bait_trans_exists BOOLEAN;
  v_rod_access_exists BOOLEAN;
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '═══════════════════════════════════════════════════════════';
  RAISE NOTICE '🔍 VERIFICATION';
  RAISE NOTICE '═══════════════════════════════════════════════════════════';
  RAISE NOTICE '';
  
  -- Check fish_price_config
  SELECT EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'fish_price_config'
  ) INTO v_price_config_exists;
  
  IF v_price_config_exists THEN
    RAISE NOTICE '✅ Table fish_price_config exists';
  ELSE
    RAISE EXCEPTION '❌ Table fish_price_config does not exist!';
  END IF;
  
  -- Check fish_leaderboard
  SELECT EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'fish_leaderboard'
  ) INTO v_leaderboard_exists;
  
  IF v_leaderboard_exists THEN
    RAISE NOTICE '✅ Table fish_leaderboard exists';
  ELSE
    RAISE EXCEPTION '❌ Table fish_leaderboard does not exist!';
  END IF;
  
  -- Check bait_transactions
  SELECT EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'bait_transactions'
  ) INTO v_bait_trans_exists;
  
  IF v_bait_trans_exists THEN
    RAISE NOTICE '✅ Table bait_transactions exists';
  ELSE
    RAISE EXCEPTION '❌ Table bait_transactions does not exist!';
  END IF;
  
  -- Check user_rod_access
  SELECT EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'user_rod_access'
  ) INTO v_rod_access_exists;
  
  IF v_rod_access_exists THEN
    RAISE NOTICE '✅ Table user_rod_access exists';
  ELSE
    RAISE EXCEPTION '❌ Table user_rod_access does not exist!';
  END IF;
  
  RAISE NOTICE '';
  RAISE NOTICE '═══════════════════════════════════════════════════════════';
  RAISE NOTICE '🎉 ALL TABLES CREATED SUCCESSFULLY!';
  RAISE NOTICE '═══════════════════════════════════════════════════════════';
  RAISE NOTICE '';
END $$;

-- Show table counts
SELECT 
  'fish_price_config' as table_name,
  COUNT(*) as row_count
FROM fish_price_config
UNION ALL
SELECT 
  'fish_leaderboard' as table_name,
  COUNT(*) as row_count
FROM fish_leaderboard
UNION ALL
SELECT 
  'bait_transactions' as table_name,
  COUNT(*) as row_count
FROM bait_transactions
UNION ALL
SELECT 
  'user_rod_access' as table_name,
  COUNT(*) as row_count
FROM user_rod_access;
