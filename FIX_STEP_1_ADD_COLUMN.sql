-- ============================================================================
-- STEP 1: ADD BAIT_BALANCE COLUMN
-- ============================================================================
-- Copy paste SQL ini ke Supabase SQL Editor dan RUN
-- ============================================================================

-- Add bait_balance column if it doesn't exist
DO $$
BEGIN
  -- Check if column exists
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_schema = 'public'
    AND table_name = 'user_fishing_inventory' 
    AND column_name = 'bait_balance'
  ) THEN
    -- Add the column
    ALTER TABLE user_fishing_inventory 
    ADD COLUMN bait_balance INTEGER DEFAULT 0 NOT NULL;
    
    RAISE NOTICE '✅ Added bait_balance column';
  ELSE
    RAISE NOTICE '✅ bait_balance column already exists';
  END IF;
  
  -- Check if old bait_count column exists and migrate
  IF EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_schema = 'public'
    AND table_name = 'user_fishing_inventory' 
    AND column_name = 'bait_count'
  ) THEN
    -- Migrate data
    UPDATE user_fishing_inventory 
    SET bait_balance = COALESCE(bait_count, 0);
    
    -- Drop old column
    ALTER TABLE user_fishing_inventory 
    DROP COLUMN bait_count;
    
    RAISE NOTICE '✅ Migrated data from bait_count to bait_balance';
  END IF;
END $$;

-- Show table structure to verify
SELECT 
  column_name, 
  data_type, 
  column_default,
  is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
AND table_name = 'user_fishing_inventory'
ORDER BY ordinal_position;

-- Show success message
DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '═══════════════════════════════════════════════════════════';
  RAISE NOTICE '✅ STEP 1 COMPLETE!';
  RAISE NOTICE '═══════════════════════════════════════════════════════════';
  RAISE NOTICE '';
  RAISE NOTICE 'Column bait_balance has been added to user_fishing_inventory';
  RAISE NOTICE '';
  RAISE NOTICE 'Next: Run STEP 2 (FIX_STEP_2_RLS_POLICIES.sql)';
  RAISE NOTICE '';
  RAISE NOTICE '═══════════════════════════════════════════════════════════';
END $$;
