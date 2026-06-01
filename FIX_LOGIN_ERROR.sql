-- ═══════════════════════════════════════════════════════════════════════════════
-- FIX LOGIN ERROR 500 - Comprehensive Database Fix
-- ═══════════════════════════════════════════════════════════════════════════════
-- Run this in Supabase SQL Editor to fix login issues
-- ═══════════════════════════════════════════════════════════════════════════════

-- 1. Ensure users table exists with correct structure
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  username TEXT UNIQUE NOT NULL,
  balance NUMERIC(10, 2) DEFAULT 0.00,
  is_staff BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Enable RLS on users table
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- 3. Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Users can read own profile" ON public.users;
DROP POLICY IF EXISTS "Users can update own profile" ON public.users;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.users;
DROP POLICY IF EXISTS "Service role can do anything" ON public.users;
DROP POLICY IF EXISTS "Enable read for authenticated users" ON public.users;

-- 4. Create comprehensive RLS policies
-- Allow users to read their own profile
CREATE POLICY "Users can read own profile" 
ON public.users FOR SELECT 
USING (auth.uid() = id);

-- Allow users to update their own profile
CREATE POLICY "Users can update own profile" 
ON public.users FOR UPDATE 
USING (auth.uid() = id);

-- Allow users to insert their own profile (for registration)
CREATE POLICY "Users can insert own profile" 
ON public.users FOR INSERT 
WITH CHECK (auth.uid() = id);

-- Allow service role to bypass RLS (for admin operations)
CREATE POLICY "Service role can do anything" 
ON public.users 
USING (auth.role() = 'service_role');

-- 5. Create or replace trigger function for new user registration
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, username, balance, is_staff)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'username', SPLIT_PART(NEW.email, '@', 1)),
    0.00,
    FALSE
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. Drop existing trigger if exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- 7. Create trigger for automatic user profile creation
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- 8. Create index for faster username lookups
CREATE INDEX IF NOT EXISTS idx_users_username ON public.users(username);
CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);

-- 9. Verify existing users have profiles
-- This will create profiles for any auth.users that don't have a public.users entry
INSERT INTO public.users (id, email, username, balance, is_staff)
SELECT 
  au.id,
  au.email,
  COALESCE(au.raw_user_meta_data->>'username', SPLIT_PART(au.email, '@', 1)),
  0.00,
  FALSE
FROM auth.users au
LEFT JOIN public.users pu ON au.id = pu.id
WHERE pu.id IS NULL
ON CONFLICT (id) DO NOTHING;

-- 10. Create admin user if not exists (optional)
-- First, check if admin exists in auth.users
DO $$
DECLARE
  admin_id UUID;
BEGIN
  -- Try to find existing admin user
  SELECT id INTO admin_id FROM auth.users WHERE email = 'admin@staff.com';
  
  -- If admin exists in auth but not in public.users, create profile
  IF admin_id IS NOT NULL THEN
    INSERT INTO public.users (id, email, username, balance, is_staff)
    VALUES (admin_id, 'admin@staff.com', 'admin', 1000.00, TRUE)
    ON CONFLICT (id) DO UPDATE SET is_staff = TRUE, balance = GREATEST(public.users.balance, 1000.00);
  END IF;
END $$;

-- 11. Grant necessary permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE ON public.users TO anon, authenticated;

-- ═══════════════════════════════════════════════════════════════════════════════
-- VERIFICATION QUERIES
-- ═══════════════════════════════════════════════════════════════════════════════

-- Check if users table exists and has correct structure
SELECT 
  table_name, 
  column_name, 
  data_type, 
  is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'users'
ORDER BY ordinal_position;

-- Check RLS policies
SELECT 
  schemaname, 
  tablename, 
  policyname, 
  permissive, 
  roles, 
  cmd
FROM pg_policies
WHERE schemaname = 'public' AND tablename = 'users';

-- Check if trigger exists
SELECT 
  trigger_name, 
  event_manipulation, 
  event_object_table, 
  action_statement
FROM information_schema.triggers
WHERE trigger_schema = 'public' OR event_object_schema = 'auth';

-- Count users
SELECT 
  (SELECT COUNT(*) FROM auth.users) as auth_users_count,
  (SELECT COUNT(*) FROM public.users) as public_users_count;

-- Show sample users (without sensitive data)
SELECT 
  id, 
  email, 
  username, 
  balance, 
  is_staff, 
  created_at
FROM public.users
ORDER BY created_at DESC
LIMIT 5;

-- ═══════════════════════════════════════════════════════════════════════════════
-- DONE! Your database should now be ready for login.
-- ═══════════════════════════════════════════════════════════════════════════════
