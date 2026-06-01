-- ============================================================================
-- FIX FISH LB DATA
-- ============================================================================
-- This ensures all fish records have lb data
-- For old records without lb, set lb = base_lb
-- ============================================================================

-- Update fish records that have NULL lb
UPDATE fish_inventory
SET lb = COALESCE(base_lb, 0)
WHERE lb IS NULL;

-- Verify
SELECT 
  COUNT(*) as total_fish,
  COUNT(CASE WHEN lb IS NULL THEN 1 END) as null_lb_count,
  COUNT(CASE WHEN lb IS NOT NULL THEN 1 END) as has_lb_count
FROM fish_inventory;

-- Show sample data
SELECT 
  fish_name,
  base_lb,
  lb,
  lb_bonus,
  sell_price,
  caught_at
FROM fish_inventory
ORDER BY caught_at DESC
LIMIT 10;

-- Success message
DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '═══════════════════════════════════════════════════════════';
  RAISE NOTICE '✅ FISH LB DATA FIXED!';
  RAISE NOTICE '═══════════════════════════════════════════════════════════';
  RAISE NOTICE '';
  RAISE NOTICE 'All fish records now have lb data';
  RAISE NOTICE 'Old records: lb = base_lb';
  RAISE NOTICE 'New records: lb includes bonus from rod';
  RAISE NOTICE '';
  RAISE NOTICE 'Refresh the Fishing AFK Logs page to see the changes!';
  RAISE NOTICE '';
  RAISE NOTICE '═══════════════════════════════════════════════════════════';
  RAISE NOTICE '';
END $$;
v