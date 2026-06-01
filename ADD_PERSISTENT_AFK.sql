-- ============================================================================
-- ADD PERSISTENT AFK FISHING SYSTEM
-- ============================================================================
-- This allows AFK fishing to continue even after server restart
-- ============================================================================

-- Check if afk_fishing_sessions table exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'afk_fishing_sessions'
  ) THEN
    -- Create the table
    CREATE TABLE afk_fishing_sessions (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID UNIQUE REFERENCES users(id) ON DELETE CASCADE,
      username TEXT NOT NULL,
      equipped_rod TEXT NOT NULL,
      is_active BOOLEAN DEFAULT TRUE,
      started_at TIMESTAMPTZ DEFAULT NOW(),
      last_heartbeat TIMESTAMPTZ DEFAULT NOW(),
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );

    CREATE INDEX idx_afk_fishing_sessions_user_id ON afk_fishing_sessions(user_id);
    CREATE INDEX idx_afk_fishing_sessions_active ON afk_fishing_sessions(is_active);
    CREATE INDEX idx_afk_fishing_sessions_heartbeat ON afk_fishing_sessions(last_heartbeat);

    RAISE NOTICE '✅ Created afk_fishing_sessions table';
  ELSE
    RAISE NOTICE '✅ afk_fishing_sessions table already exists';
  END IF;
END $$;

-- Enable RLS
ALTER TABLE afk_fishing_sessions ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS afk_fishing_sessions_select_own ON afk_fishing_sessions;
DROP POLICY IF EXISTS afk_fishing_sessions_insert_own ON afk_fishing_sessions;
DROP POLICY IF EXISTS afk_fishing_sessions_update_own ON afk_fishing_sessions;
DROP POLICY IF EXISTS afk_fishing_sessions_delete_own ON afk_fishing_sessions;
DROP POLICY IF EXISTS afk_fishing_sessions_select_system ON afk_fishing_sessions;
DROP POLICY IF EXISTS afk_fishing_sessions_insert_system ON afk_fishing_sessions;
DROP POLICY IF EXISTS afk_fishing_sessions_update_system ON afk_fishing_sessions;
DROP POLICY IF EXISTS afk_fishing_sessions_delete_system ON afk_fishing_sessions;

-- Create permissive policies
CREATE POLICY afk_fishing_sessions_select_system ON afk_fishing_sessions 
  FOR SELECT USING (TRUE);

CREATE POLICY afk_fishing_sessions_insert_system ON afk_fishing_sessions 
  FOR INSERT WITH CHECK (TRUE);

CREATE POLICY afk_fishing_sessions_update_system ON afk_fishing_sessions 
  FOR UPDATE USING (TRUE);

CREATE POLICY afk_fishing_sessions_delete_system ON afk_fishing_sessions 
  FOR DELETE USING (TRUE);

-- Grant permissions
GRANT ALL ON afk_fishing_sessions TO service_role;

-- Success message
DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '═══════════════════════════════════════════════════════════';
  RAISE NOTICE '✅ PERSISTENT AFK FISHING SYSTEM READY!';
  RAISE NOTICE '═══════════════════════════════════════════════════════════';
  RAISE NOTICE '';
  RAISE NOTICE '✅ Table afk_fishing_sessions created/verified';
  RAISE NOTICE '✅ RLS policies configured';
  RAISE NOTICE '✅ Permissions granted';
  RAISE NOTICE '';
  RAISE NOTICE '📝 Features:';
  RAISE NOTICE '   - AFK fishing state saved to database';
  RAISE NOTICE '   - Auto-resume after server restart';
  RAISE NOTICE '   - Heartbeat system to detect stale sessions';
  RAISE NOTICE '';
  RAISE NOTICE '📝 Next Steps:';
  RAISE NOTICE '   1. Update afk-fishing-worker.ts (code changes needed)';
  RAISE NOTICE '   2. Restart server';
  RAISE NOTICE '   3. Test: Start fishing → Restart server → Fishing continues';
  RAISE NOTICE '';
  RAISE NOTICE '═══════════════════════════════════════════════════════════';
  RAISE NOTICE '';
END $$;

-- Show table structure
SELECT 
  column_name, 
  data_type, 
  column_default
FROM information_schema.columns
WHERE table_schema = 'public'
AND table_name = 'afk_fishing_sessions'
ORDER BY ordinal_position;
