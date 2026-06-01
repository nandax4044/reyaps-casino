-- ============================================================================
-- FIX: Add bait_balance column to user_fishing_inventory
-- ============================================================================
-- This fixes the error: column user_fishing_inventory.bait_balance does not exist
-- ============================================================================

-- Check if bait_balance column exists, if not add it
DO $$
BEGIN
  -- Check if column exists
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = 'user_fishing_inventory' 
    AND column_name = 'bait_balance'
  ) THEN
    -- Add bait_balance column
    ALTER TABLE user_fishing_inventory 
    ADD COLUMN bait_balance INTEGER DEFAULT 0;
    
    RAISE NOTICE '✅ Added bait_balance column to user_fishing_inventory';
    
    -- Check if old column exists (bait_count, bait, etc)
    IF EXISTS (
      SELECT 1 
      FROM information_schema.columns 
      WHERE table_name = 'user_fishing_inventory' 
      AND column_name = 'bait_count'
    ) THEN
      -- Migrate data from old column
      UPDATE user_fishing_inventory 
      SET bait_balance = bait_count;
      
      RAISE NOTICE '✅ Migrated data from bait_count to bait_balance';
      
      -- Drop old column
      ALTER TABLE user_fishing_inventory 
      DROP COLUMN bait_count;
      
      RAISE NOTICE '✅ Dropped old bait_count column';
    END IF;
  ELSE
    RAISE NOTICE '✅ bait_balance column already exists';
  END IF;
END $$;

-- Verify the column exists now
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = 'user_fishing_inventory' 
    AND column_name = 'bait_balance'
  ) THEN
    RAISE NOTICE '';
    RAISE NOTICE '═══════════════════════════════════════════════════════════';
    RAISE NOTICE '✅ BAIT_BALANCE COLUMN FIX COMPLETE!';
    RAISE NOTICE '═══════════════════════════════════════════════════════════';
    RAISE NOTICE '';
    RAISE NOTICE '✅ Column bait_balance exists in user_fishing_inventory';
    RAISE NOTICE '';
    RAISE NOTICE '📝 Next Steps:';
    RAISE NOTICE '   1. Restart server: npm run dev:no-watch';
    RAISE NOTICE '   2. Grant bait to user (if not already done)';
    RAISE NOTICE '   3. Start AFK fishing';
    RAISE NOTICE '   4. Check console - should work now!';
    RAISE NOTICE '';
    RAISE NOTICE '═══════════════════════════════════════════════════════════';
    RAISE NOTICE '';
  ELSE
    RAISE EXCEPTION 'Failed to add bait_balance column!';
  END IF;
END $$;

-- Show current structure
SELECT 
  column_name, 
  data_type, 
  column_default,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'user_fishing_inventory'
ORDER BY ordinal_position;
