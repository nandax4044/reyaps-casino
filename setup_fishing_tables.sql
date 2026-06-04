-- ============================================================================
-- COMPREHENSIVE FISHING SYSTEM SETUP FOR SUPABASE
-- ============================================================================
-- This script creates all necessary tables, indexes, policies, and functions
-- for the AFK Fishing System. Run this in your Supabase SQL Editor.
-- ============================================================================

-- ============================================================================
-- SECTION 1: DROP EXISTING TABLES (CLEAN SLATE)
-- ============================================================================

-- Drop existing tables if they exist to ensure clean state
DROP TABLE IF EXISTS public.fish_inventory CASCADE;
DROP TABLE IF EXISTS public.afk_access CASCADE;
DROP TABLE IF EXISTS public.fishing_inventory CASCADE;
DROP TABLE IF EXISTS public.afk_fishing_sessions CASCADE;

-- Drop existing functions
DROP FUNCTION IF EXISTS public.increment_fishing_saldo CASCADE;
DROP FUNCTION IF EXISTS public.increment_fish_caught CASCADE;
DROP FUNCTION IF EXISTS public.consume_bait CASCADE;

-- ============================================================================
-- SECTION 2: CREATE FISH_INVENTORY TABLE
-- ============================================================================

-- Create fish_inventory table to store caught fish
CREATE TABLE public.fish_inventory (
  -- Primary key
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  
  -- User reference
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  
  -- Fish identification
  fish_id TEXT NOT NULL,
  fish_name TEXT NOT NULL,
  
  -- Fish weight/size
  base_lb DECIMAL(10, 2) NOT NULL DEFAULT 0,
  lb DECIMAL(10, 2) NOT NULL DEFAULT 0,
  lb_bonus DECIMAL(10, 2) NOT NULL DEFAULT 0,
  
  -- Fish quality
  is_perfect BOOLEAN DEFAULT FALSE,
  
  -- Fish sale status
  is_sold BOOLEAN DEFAULT FALSE,
  sell_price DECIMAL(10, 2) NOT NULL DEFAULT 0,
  sold_at TIMESTAMP WITH TIME ZONE,
  
  -- Timestamps
  caught_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for fish_inventory
CREATE INDEX idx_fish_inventory_user_id ON public.fish_inventory(user_id);
CREATE INDEX idx_fish_inventory_caught_at ON public.fish_inventory(caught_at DESC);
CREATE INDEX idx_fish_inventory_fish_id ON public.fish_inventory(fish_id);
CREATE INDEX idx_fish_inventory_is_sold ON public.fish_inventory(is_sold);
CREATE INDEX idx_fish_inventory_user_caught ON public.fish_inventory(user_id, caught_at DESC);

-- Add comments to fish_inventory columns
COMMENT ON TABLE public.fish_inventory IS 'Stores all caught fish with their details and sale status';
COMMENT ON COLUMN public.fish_inventory.id IS 'Unique identifier for each fish record';
COMMENT ON COLUMN public.fish_inventory.user_id IS 'Reference to the user who caught the fish';
COMMENT ON COLUMN public.fish_inventory.fish_id IS 'ID of the fish type';
COMMENT ON COLUMN public.fish_inventory.fish_name IS 'Name of the fish';
COMMENT ON COLUMN public.fish_inventory.base_lb IS 'Base weight of the fish in pounds';
COMMENT ON COLUMN public.fish_inventory.lb IS 'Actual weight of the fish including bonuses';
COMMENT ON COLUMN public.fish_inventory.lb_bonus IS 'Bonus weight added to the fish';
COMMENT ON COLUMN public.fish_inventory.is_perfect IS 'Whether the fish is a perfect catch';
COMMENT ON COLUMN public.fish_inventory.is_sold IS 'Whether the fish has been sold';
COMMENT ON COLUMN public.fish_inventory.sell_price IS 'Price at which the fish was sold';
COMMENT ON COLUMN public.fish_inventory.sold_at IS 'Timestamp when the fish was sold';
COMMENT ON COLUMN public.fish_inventory.caught_at IS 'Timestamp when the fish was caught';

-- ============================================================================
-- SECTION 3: CREATE AFK_ACCESS TABLE
-- ============================================================================

-- Create afk_access table for managing fishing feature access
CREATE TABLE public.afk_access (
  -- Primary key
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  
  -- User references
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  granted_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
  
  -- Feature access
  feature TEXT NOT NULL DEFAULT 'fishing',
  
  -- Access timing
  granted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE,
  
  -- Access status
  is_active BOOLEAN DEFAULT TRUE,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for afk_access
CREATE INDEX idx_afk_access_user_id ON public.afk_access(user_id);
CREATE INDEX idx_afk_access_is_active ON public.afk_access(is_active);
CREATE INDEX idx_afk_access_feature ON public.afk_access(feature);
CREATE INDEX idx_afk_access_granted_at ON public.afk_access(granted_at DESC);
CREATE INDEX idx_afk_access_user_feature ON public.afk_access(user_id, feature);
CREATE INDEX idx_afk_access_expires_at ON public.afk_access(expires_at);

-- Add comments to afk_access columns
COMMENT ON TABLE public.afk_access IS 'Manages access to AFK features like fishing';
COMMENT ON COLUMN public.afk_access.id IS 'Unique identifier for each access record';
COMMENT ON COLUMN public.afk_access.user_id IS 'Reference to the user granted access';
COMMENT ON COLUMN public.afk_access.granted_by IS 'Reference to the admin who granted access';
COMMENT ON COLUMN public.afk_access.feature IS 'The feature the user has access to (e.g., fishing)';
COMMENT ON COLUMN public.afk_access.granted_at IS 'Timestamp when access was granted';
COMMENT ON COLUMN public.afk_access.expires_at IS 'Timestamp when access expires (null = permanent)';
COMMENT ON COLUMN public.afk_access.is_active IS 'Whether the access is currently active';

-- ============================================================================
-- SECTION 4: CREATE FISHING_INVENTORY TABLE
-- ============================================================================

-- Create fishing_inventory table for user fishing stats
CREATE TABLE public.fishing_inventory (
  -- Primary key
  user_id UUID PRIMARY KEY REFERENCES public.users(id) ON DELETE CASCADE,
  
  -- Fishing resources
  bait INTEGER DEFAULT 0,
  fishing_saldo DECIMAL(10, 2) DEFAULT 0,
  
  -- Fishing stats
  total_fish_caught INTEGER DEFAULT 0,
  total_fish_sold INTEGER DEFAULT 0,
  total_earnings DECIMAL(10, 2) DEFAULT 0,
  
  -- Equipment
  equipped_rod_id TEXT,
  
  -- Timestamps
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for fishing_inventory
CREATE INDEX idx_fishing_inventory_user_id ON public.fishing_inventory(user_id);
CREATE INDEX idx_fishing_inventory_equipped_rod ON public.fishing_inventory(equipped_rod_id);

-- Add comments to fishing_inventory columns
COMMENT ON TABLE public.fishing_inventory IS 'Stores user fishing statistics and inventory';
COMMENT ON COLUMN public.fishing_inventory.user_id IS 'Reference to the user (primary key)';
COMMENT ON COLUMN public.fishing_inventory.bait IS 'Amount of bait available for fishing';
COMMENT ON COLUMN public.fishing_inventory.fishing_saldo IS 'Fishing-specific balance';
COMMENT ON COLUMN public.fishing_inventory.total_fish_caught IS 'Total number of fish caught';
COMMENT ON COLUMN public.fishing_inventory.total_fish_sold IS 'Total number of fish sold';
COMMENT ON COLUMN public.fishing_inventory.total_earnings IS 'Total earnings from selling fish';
COMMENT ON COLUMN public.fishing_inventory.equipped_rod_id IS 'ID of the currently equipped fishing rod';

-- ============================================================================
-- SECTION 5: CREATE AFK_FISHING_SESSIONS TABLE
-- ============================================================================

-- Create afk_fishing_sessions table for tracking active fishing sessions
CREATE TABLE public.afk_fishing_sessions (
  -- Primary key
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  
  -- User information
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  username TEXT NOT NULL,
  
  -- Session details
  rod_id TEXT NOT NULL,
  rod_name TEXT,
  
  -- Session timing
  started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  ended_at TIMESTAMP WITH TIME ZONE,
  duration_seconds INTEGER DEFAULT 0,
  
  -- Session status
  is_active BOOLEAN DEFAULT TRUE,
  
  -- Session statistics
  fish_caught INTEGER DEFAULT 0,
  fish_sold INTEGER DEFAULT 0,
  earnings DECIMAL(10, 2) DEFAULT 0,
  
  -- Session notes
  notes TEXT,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for afk_fishing_sessions
CREATE INDEX idx_afk_fishing_sessions_user_id ON public.afk_fishing_sessions(user_id);
CREATE INDEX idx_afk_fishing_sessions_is_active ON public.afk_fishing_sessions(is_active);
CREATE INDEX idx_afk_fishing_sessions_started_at ON public.afk_fishing_sessions(started_at DESC);
CREATE INDEX idx_afk_fishing_sessions_rod_id ON public.afk_fishing_sessions(rod_id);
CREATE INDEX idx_afk_fishing_sessions_user_active ON public.afk_fishing_sessions(user_id, is_active);

-- Add comments to afk_fishing_sessions columns
COMMENT ON TABLE public.afk_fishing_sessions IS 'Tracks active and completed AFK fishing sessions';
COMMENT ON COLUMN public.afk_fishing_sessions.id IS 'Unique identifier for each fishing session';
COMMENT ON COLUMN public.afk_fishing_sessions.user_id IS 'Reference to the user fishing';
COMMENT ON COLUMN public.afk_fishing_sessions.username IS 'Username of the fisher';
COMMENT ON COLUMN public.afk_fishing_sessions.rod_id IS 'ID of the fishing rod being used';
COMMENT ON COLUMN public.afk_fishing_sessions.rod_name IS 'Name of the fishing rod';
COMMENT ON COLUMN public.afk_fishing_sessions.started_at IS 'Timestamp when the session started';
COMMENT ON COLUMN public.afk_fishing_sessions.ended_at IS 'Timestamp when the session ended';
COMMENT ON COLUMN public.afk_fishing_sessions.duration_seconds IS 'Duration of the session in seconds';
COMMENT ON COLUMN public.afk_fishing_sessions.is_active IS 'Whether the session is currently active';
COMMENT ON COLUMN public.afk_fishing_sessions.fish_caught IS 'Number of fish caught in this session';
COMMENT ON COLUMN public.afk_fishing_sessions.fish_sold IS 'Number of fish sold in this session';
COMMENT ON COLUMN public.afk_fishing_sessions.earnings IS 'Total earnings from this session';
COMMENT ON COLUMN public.afk_fishing_sessions.notes IS 'Additional notes about the session';

-- ============================================================================
-- SECTION 6: ENABLE ROW LEVEL SECURITY
-- ============================================================================

-- Enable RLS on all fishing tables
ALTER TABLE public.fish_inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.afk_access ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fishing_inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.afk_fishing_sessions ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- SECTION 7: CREATE RLS POLICIES FOR FISH_INVENTORY
-- ============================================================================

-- Policy: Users can view their own fish inventory
DROP POLICY IF EXISTS "Users can view their own fish inventory" ON public.fish_inventory;
CREATE POLICY "Users can view their own fish inventory"
  ON public.fish_inventory FOR SELECT
  USING (auth.uid() = user_id);

-- Policy: Users can insert their own fish
DROP POLICY IF EXISTS "Users can insert their own fish" ON public.fish_inventory;
CREATE POLICY "Users can insert their own fish"
  ON public.fish_inventory FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Policy: Users can update their own fish
DROP POLICY IF EXISTS "Users can update their own fish" ON public.fish_inventory;
CREATE POLICY "Users can update their own fish"
  ON public.fish_inventory FOR UPDATE
  USING (auth.uid() = user_id);

-- Policy: Users can delete their own fish
DROP POLICY IF EXISTS "Users can delete their own fish" ON public.fish_inventory;
CREATE POLICY "Users can delete their own fish"
  ON public.fish_inventory FOR DELETE
  USING (auth.uid() = user_id);

-- Policy: Staff can view all fish inventory
DROP POLICY IF EXISTS "Staff can view all fish inventory" ON public.fish_inventory;
CREATE POLICY "Staff can view all fish inventory"
  ON public.fish_inventory FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = auth.uid() AND users.is_staff = true
    )
  );

-- ============================================================================
-- SECTION 8: CREATE RLS POLICIES FOR FISHING_INVENTORY
-- ============================================================================

-- Policy: Users can view their own fishing inventory
DROP POLICY IF EXISTS "Users can view their own fishing inventory" ON public.fishing_inventory;
CREATE POLICY "Users can view their own fishing inventory"
  ON public.fishing_inventory FOR SELECT
  USING (auth.uid() = user_id);

-- Policy: Users can insert their own fishing inventory
DROP POLICY IF EXISTS "Users can insert their own fishing inventory" ON public.fishing_inventory;
CREATE POLICY "Users can insert their own fishing inventory"
  ON public.fishing_inventory FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Policy: Users can update their own fishing inventory
DROP POLICY IF EXISTS "Users can update their own fishing inventory" ON public.fishing_inventory;
CREATE POLICY "Users can update their own fishing inventory"
  ON public.fishing_inventory FOR UPDATE
  USING (auth.uid() = user_id);

-- Policy: Staff can view all fishing inventory
DROP POLICY IF EXISTS "Staff can view all fishing inventory" ON public.fishing_inventory;
CREATE POLICY "Staff can view all fishing inventory"
  ON public.fishing_inventory FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = auth.uid() AND users.is_staff = true
    )
  );

-- Policy: Staff can update all fishing inventory
DROP POLICY IF EXISTS "Staff can update all fishing inventory" ON public.fishing_inventory;
CREATE POLICY "Staff can update all fishing inventory"
  ON public.fishing_inventory FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = auth.uid() AND users.is_staff = true
    )
  );

-- ============================================================================
-- SECTION 9: CREATE RLS POLICIES FOR AFK_FISHING_SESSIONS
-- ============================================================================

-- Policy: Users can view their own fishing sessions
DROP POLICY IF EXISTS "Users can view their own fishing sessions" ON public.afk_fishing_sessions;
CREATE POLICY "Users can view their own fishing sessions"
  ON public.afk_fishing_sessions FOR SELECT
  USING (auth.uid() = user_id);

-- Policy: Users can insert their own fishing sessions
DROP POLICY IF EXISTS "Users can insert their own fishing sessions" ON public.afk_fishing_sessions;
CREATE POLICY "Users can insert their own fishing sessions"
  ON public.afk_fishing_sessions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Policy: Users can update their own fishing sessions
DROP POLICY IF EXISTS "Users can update their own fishing sessions" ON public.afk_fishing_sessions;
CREATE POLICY "Users can update their own fishing sessions"
  ON public.afk_fishing_sessions FOR UPDATE
  USING (auth.uid() = user_id);

-- Policy: Staff can view all fishing sessions
DROP POLICY IF EXISTS "Staff can view all fishing sessions" ON public.afk_fishing_sessions;
CREATE POLICY "Staff can view all fishing sessions"
  ON public.afk_fishing_sessions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = auth.uid() AND users.is_staff = true
    )
  );

-- Policy: Staff can update all fishing sessions
DROP POLICY IF EXISTS "Staff can update all fishing sessions" ON public.afk_fishing_sessions;
CREATE POLICY "Staff can update all fishing sessions"
  ON public.afk_fishing_sessions FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = auth.uid() AND users.is_staff = true
    )
  );

-- Policy: Staff can delete fishing sessions
DROP POLICY IF EXISTS "Staff can delete fishing sessions" ON public.afk_fishing_sessions;
CREATE POLICY "Staff can delete fishing sessions"
  ON public.afk_fishing_sessions FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = auth.uid() AND users.is_staff = true
    )
  );

-- ============================================================================
-- SECTION 10: CREATE RLS POLICIES FOR AFK_ACCESS
-- ============================================================================

-- Policy: Staff can view all afk access
DROP POLICY IF EXISTS "Staff can view all afk access" ON public.afk_access;
CREATE POLICY "Staff can view all afk access"
  ON public.afk_access FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = auth.uid() AND users.is_staff = true
    )
  );

-- Policy: Staff can insert afk access
DROP POLICY IF EXISTS "Staff can insert afk access" ON public.afk_access;
CREATE POLICY "Staff can insert afk access"
  ON public.afk_access FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = auth.uid() AND users.is_staff = true
    )
  );

-- Policy: Staff can update afk access
DROP POLICY IF EXISTS "Staff can update afk access" ON public.afk_access;
CREATE POLICY "Staff can update afk access"
  ON public.afk_access FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = auth.uid() AND users.is_staff = true
    )
  );

-- Policy: Staff can delete afk access
DROP POLICY IF EXISTS "Staff can delete afk access" ON public.afk_access;
CREATE POLICY "Staff can delete afk access"
  ON public.afk_access FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = auth.uid() AND users.is_staff = true
    )
  );

-- Policy: Users can view their own afk access
DROP POLICY IF EXISTS "Users can view their own afk access" ON public.afk_access;
CREATE POLICY "Users can view their own afk access"
  ON public.afk_access FOR SELECT
  USING (auth.uid() = user_id);

-- ============================================================================
-- SECTION 11: CREATE INCREMENT_FISHING_SALDO FUNCTION
-- ============================================================================

-- Function to increment user balance (for fish sales)
CREATE OR REPLACE FUNCTION increment_fishing_saldo(p_user_id UUID, p_amount DECIMAL)
RETURNS VOID AS $$
BEGIN
  UPDATE public.users
  SET balance = balance + p_amount
  WHERE id = p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.increment_fishing_saldo(UUID, DECIMAL) TO authenticated;

-- Add comment to function
COMMENT ON FUNCTION public.increment_fishing_saldo IS 'Increments user balance by specified amount';

-- ============================================================================
-- SECTION 12: CREATE INCREMENT_FISH_CAUGHT FUNCTION
-- ============================================================================

-- Function to increment total fish caught for a user
CREATE OR REPLACE FUNCTION increment_fish_caught(p_user_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE public.fishing_inventory
  SET total_fish_caught = total_fish_caught + 1,
      updated_at = NOW()
  WHERE user_id = p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.increment_fish_caught(UUID) TO authenticated;

-- Add comment to function
COMMENT ON FUNCTION public.increment_fish_caught IS 'Increments total fish caught count for a user';

-- ============================================================================
-- SECTION 13: CREATE INCREMENT_FISH_SOLD FUNCTION
-- ============================================================================

-- Function to increment total fish sold for a user
CREATE OR REPLACE FUNCTION increment_fish_sold(p_user_id UUID, p_price DECIMAL)
RETURNS VOID AS $$
BEGIN
  UPDATE public.fishing_inventory
  SET total_fish_sold = total_fish_sold + 1,
      total_earnings = total_earnings + p_price,
      updated_at = NOW()
  WHERE user_id = p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.increment_fish_sold(UUID, DECIMAL) TO authenticated;

-- Add comment to function
COMMENT ON FUNCTION public.increment_fish_sold IS 'Increments total fish sold and earnings for a user';

-- ============================================================================
-- SECTION 14: CREATE CONSUME_BAIT FUNCTION
-- ============================================================================

-- Function to consume bait from user inventory
CREATE OR REPLACE FUNCTION consume_bait(p_user_id UUID)
RETURNS TABLE(remaining_bait INTEGER) AS $$
DECLARE
  current_bait INTEGER;
BEGIN
  -- Get current bait
  SELECT bait INTO current_bait FROM public.fishing_inventory WHERE user_id = p_user_id;
  
  -- Check if bait available
  IF current_bait IS NULL OR current_bait <= 0 THEN
    RETURN QUERY SELECT 0;
    RETURN;
  END IF;
  
  -- Decrease bait
  UPDATE public.fishing_inventory
  SET bait = bait - 1,
      updated_at = NOW()
  WHERE user_id = p_user_id;
  
  -- Return remaining bait
  RETURN QUERY SELECT bait FROM public.fishing_inventory WHERE user_id = p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.consume_bait(UUID) TO authenticated;

-- Add comment to function
COMMENT ON FUNCTION public.consume_bait IS 'Consumes one bait from user inventory and returns remaining bait';

-- ============================================================================
-- SECTION 15: CREATE GRANT_BAIT FUNCTION
-- ============================================================================

-- Function to grant bait to a user
CREATE OR REPLACE FUNCTION grant_bait(p_user_id UUID, p_amount INTEGER)
RETURNS VOID AS $$
BEGIN
  INSERT INTO public.fishing_inventory (user_id, bait, fishing_saldo, total_fish_caught, total_fish_sold, total_earnings)
  VALUES (p_user_id, p_amount, 0, 0, 0, 0)
  ON CONFLICT (user_id) DO UPDATE
  SET bait = fishing_inventory.bait + p_amount,
      updated_at = NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.grant_bait(UUID, INTEGER) TO authenticated;

-- Add comment to function
COMMENT ON FUNCTION public.grant_bait IS 'Grants specified amount of bait to a user';

-- ============================================================================
-- SECTION 16: CREATE GET_USER_FISHING_ACCESS FUNCTION
-- ============================================================================

-- Function to check if user has fishing access
CREATE OR REPLACE FUNCTION get_user_fishing_access(p_user_id UUID)
RETURNS TABLE(has_access BOOLEAN, expires_at TIMESTAMP WITH TIME ZONE) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COALESCE(MAX(CASE WHEN is_active = true AND (expires_at IS NULL OR expires_at > NOW()) THEN 1 ELSE 0 END), 0) = 1 AS has_access,
    MAX(expires_at) AS expires_at
  FROM public.afk_access
  WHERE user_id = p_user_id
    AND feature = 'fishing'
    AND is_active = true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.get_user_fishing_access(UUID) TO authenticated;

-- Add comment to function
COMMENT ON FUNCTION public.get_user_fishing_access IS 'Checks if user has active fishing access';

-- ============================================================================
-- SECTION 17: CREATE TRIGGER FOR UPDATED_AT
-- ============================================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for fish_inventory
DROP TRIGGER IF EXISTS update_fish_inventory_updated_at ON public.fish_inventory;
CREATE TRIGGER update_fish_inventory_updated_at
  BEFORE UPDATE ON public.fish_inventory
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Create triggers for afk_access
DROP TRIGGER IF EXISTS update_afk_access_updated_at ON public.afk_access;
CREATE TRIGGER update_afk_access_updated_at
  BEFORE UPDATE ON public.afk_access
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Create triggers for fishing_inventory
DROP TRIGGER IF EXISTS update_fishing_inventory_updated_at ON public.fishing_inventory;
CREATE TRIGGER update_fishing_inventory_updated_at
  BEFORE UPDATE ON public.fishing_inventory
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Create triggers for afk_fishing_sessions
DROP TRIGGER IF EXISTS update_afk_fishing_sessions_updated_at ON public.afk_fishing_sessions;
CREATE TRIGGER update_afk_fishing_sessions_updated_at
  BEFORE UPDATE ON public.afk_fishing_sessions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- SECTION 18: GRANT PERMISSIONS
-- ============================================================================

-- Grant usage on schemas
GRANT USAGE ON SCHEMA public TO authenticated;

-- Grant select on all tables
GRANT SELECT ON ALL TABLES IN SCHEMA public TO authenticated;

-- Grant insert on fishing tables
GRANT INSERT ON public.fish_inventory TO authenticated;
GRANT INSERT ON public.fishing_inventory TO authenticated;
GRANT INSERT ON public.afk_fishing_sessions TO authenticated;

-- Grant update on fishing tables
GRANT UPDATE ON public.fish_inventory TO authenticated;
GRANT UPDATE ON public.fishing_inventory TO authenticated;
GRANT UPDATE ON public.afk_fishing_sessions TO authenticated;

-- Grant delete on fish_inventory
GRANT DELETE ON public.fish_inventory TO authenticated;

-- ============================================================================
-- SECTION 19: CREATE SAMPLE DATA (OPTIONAL)
-- ============================================================================

-- Note: Uncomment the following lines to create sample data for testing

-- -- Sample fishing inventory for testing
-- INSERT INTO public.fishing_inventory (user_id, bait, fishing_saldo, total_fish_caught)
-- VALUES (
--   (SELECT id FROM public.users LIMIT 1),
--   100,
--   0,
--   0
-- ) ON CONFLICT (user_id) DO NOTHING;

-- ============================================================================
-- SECTION 20: VERIFICATION QUERIES
-- ============================================================================

-- Verify tables were created
SELECT 
  'fish_inventory' as table_name,
  COUNT(*) as row_count
FROM public.fish_inventory
UNION ALL
SELECT 
  'afk_access' as table_name,
  COUNT(*) as row_count
FROM public.afk_access
UNION ALL
SELECT 
  'fishing_inventory' as table_name,
  COUNT(*) as row_count
FROM public.fishing_inventory
UNION ALL
SELECT 
  'afk_fishing_sessions' as table_name,
  COUNT(*) as row_count
FROM public.afk_fishing_sessions;

-- Verify functions were created
SELECT 
  routine_name as function_name,
  routine_type as type
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND routine_name IN (
    'increment_fishing_saldo',
    'increment_fish_caught',
    'increment_fish_sold',
    'consume_bait',
    'grant_bait',
    'get_user_fishing_access',
    'update_updated_at_column'
  );

-- Verify policies were created
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename IN (
  'fish_inventory',
  'afk_access',
  'fishing_inventory',
  'afk_fishing_sessions'
)
ORDER BY tablename, policyname;

-- ============================================================================
-- END OF SCRIPT
-- ============================================================================
-- All tables, indexes, policies, and functions have been created successfully.
-- The AFK Fishing System is now ready to use.
-- ============================================================================
