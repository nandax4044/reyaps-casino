-- ============================================================================
-- CREATE TABLES IF NOT EXISTS
-- ============================================================================
-- Jalankan ini JIKA tabel belum ada
-- ============================================================================

-- TABLE: user_fishing_inventory
-- ============================================================================

CREATE TABLE IF NOT EXISTS user_fishing_inventory (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  bait_balance INTEGER DEFAULT 0 NOT NULL,
  fishing_saldo INTEGER DEFAULT 0 NOT NULL,
  total_fish_caught INTEGER DEFAULT 0 NOT NULL,
  equipped_rod TEXT DEFAULT 'ez_rod',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE user_fishing_inventory ENABLE ROW LEVEL SECURITY;

-- Drop old policies
DROP POLICY IF EXISTS user_fishing_inventory_select ON user_fishing_inventory;
DROP POLICY IF EXISTS user_fishing_inventory_insert ON user_fishing_inventory;
DROP POLICY IF EXISTS user_fishing_inventory_update ON user_fishing_inventory;

-- Create policies
CREATE POLICY user_fishing_inventory_select ON user_fishing_inventory 
  FOR SELECT USING (TRUE);

CREATE POLICY user_fishing_inventory_insert ON user_fishing_inventory 
  FOR INSERT WITH CHECK (TRUE);

CREATE POLICY user_fishing_inventory_update ON user_fishing_inventory 
  FOR UPDATE USING (TRUE);

-- Grant permissions
GRANT ALL ON user_fishing_inventory TO service_role;
GRANT SELECT ON user_fishing_inventory TO authenticated;

-- TABLE: bait_transactions
-- ============================================================================

CREATE TABLE IF NOT EXISTS bait_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  amount INTEGER NOT NULL,
  transaction_type TEXT NOT NULL CHECK (transaction_type IN ('grant', 'deduct', 'refund')),
  granted_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE bait_transactions ENABLE ROW LEVEL SECURITY;

-- Drop old policies
DROP POLICY IF EXISTS bait_transactions_select ON bait_transactions;
DROP POLICY IF EXISTS bait_transactions_insert ON bait_transactions;

-- Create policies
CREATE POLICY bait_transactions_select ON bait_transactions 
  FOR SELECT USING (TRUE);

CREATE POLICY bait_transactions_insert ON bait_transactions 
  FOR INSERT WITH CHECK (TRUE);

-- Grant permissions
GRANT ALL ON bait_transactions TO service_role;
GRANT SELECT ON bait_transactions TO authenticated;

-- TABLE: afk_access
-- ============================================================================

CREATE TABLE IF NOT EXISTS afk_access (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  feature TEXT NOT NULL,
  granted_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  granted_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT TRUE,
  UNIQUE(user_id, feature)
);

-- Enable RLS
ALTER TABLE afk_access ENABLE ROW LEVEL SECURITY;

-- Drop old policies
DROP POLICY IF EXISTS afk_access_select ON afk_access;
DROP POLICY IF EXISTS afk_access_insert ON afk_access;
DROP POLICY IF EXISTS afk_access_update ON afk_access;

-- Create policies
CREATE POLICY afk_access_select ON afk_access 
  FOR SELECT USING (TRUE);

CREATE POLICY afk_access_insert ON afk_access 
  FOR INSERT WITH CHECK (TRUE);

CREATE POLICY afk_access_update ON afk_access 
  FOR UPDATE USING (TRUE);

-- Grant permissions
GRANT ALL ON afk_access TO service_role;
GRANT SELECT ON afk_access TO authenticated;

-- VERIFICATION
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '═══════════════════════════════════════════════════════════';
  RAISE NOTICE '✅ ALL TABLES CREATED!';
  RAISE NOTICE '═══════════════════════════════════════════════════════════';
  RAISE NOTICE '';
  RAISE NOTICE 'Sekarang jalankan: FIX_BAIT_COUNT_FINAL.sql';
  RAISE NOTICE '';
END $$;
