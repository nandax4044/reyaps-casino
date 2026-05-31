-- ═══════════════════════════════════════════════════════════════════════════════
-- MIGRATION: Update Starting Balance to 0 for New Users
-- Run this in Supabase SQL Editor
-- ═══════════════════════════════════════════════════════════════════════════════

-- ─── STEP 1: Update Table Default Value ───────────────────────────────────────

ALTER TABLE public.users ALTER COLUMN balance SET DEFAULT 0.00;

-- ─── STEP 2: Update Trigger Function ──────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER 
LANGUAGE plpgsql 
SECURITY DEFINER 
SET search_path = public 
AS $$
BEGIN
  INSERT INTO public.users (id, email, username, balance, is_staff)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'username', split_part(NEW.email, '@', 1)),
    0.00,
    FALSE
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

-- ═══════════════════════════════════════════════════════════════════════════════
-- MIGRATION COMPLETE!
-- ═══════════════════════════════════════════════════════════════════════════════

-- ✅ Table default changed: balance DEFAULT 0.00
-- ✅ Trigger function updated: inserts 0.00 for new users

-- ═══════════════════════════════════════════════════════════════════════════════
-- TESTING (Optional - Run after migration):
-- ═══════════════════════════════════════════════════════════════════════════════

-- Check table default:
-- SELECT column_name, column_default FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'balance';

-- Check existing users (should not be affected):
-- SELECT username, balance FROM public.users ORDER BY created_at DESC LIMIT 10;

-- ═══════════════════════════════════════════════════════════════════════════════

