-- ═══════════════════════════════════════════════════════════════════════════════
-- FIX DUPLICATE USERNAME ERROR
-- ═══════════════════════════════════════════════════════════════════════════════
-- Jalankan ini jika mendapat error: duplicate key value violates unique constraint
-- ═══════════════════════════════════════════════════════════════════════════════

-- 1. Lihat user yang duplikat
SELECT 
  au.id as auth_id,
  au.email as auth_email,
  au.raw_user_meta_data->>'username' as auth_username,
  pu.id as profile_id,
  pu.email as profile_email,
  pu.username as profile_username
FROM auth.users au
LEFT JOIN public.users pu ON au.id = pu.id
ORDER BY au.created_at DESC;

-- 2. Cari username yang duplikat
SELECT username, COUNT(*) as count
FROM public.users
GROUP BY username
HAVING COUNT(*) > 1;

-- 3. Hapus duplikat (HATI-HATI! Backup dulu jika ada data penting)
-- Ini akan menghapus user profile yang tidak punya auth.users
DELETE FROM public.users
WHERE id NOT IN (SELECT id FROM auth.users);

-- 4. Sync auth.users dengan public.users (tanpa error duplikat)
DO $$
DECLARE
  auth_user RECORD;
  new_username TEXT;
  username_counter INTEGER;
BEGIN
  -- Loop through auth users yang belum punya profile
  FOR auth_user IN 
    SELECT 
      au.id, 
      au.email, 
      au.raw_user_meta_data
    FROM auth.users au
    LEFT JOIN public.users pu ON au.id = pu.id
    WHERE pu.id IS NULL
  LOOP
    -- Generate username dari metadata atau email
    new_username := COALESCE(
      auth_user.raw_user_meta_data->>'username', 
      SPLIT_PART(auth_user.email, '@', 1)
    );
    
    -- Cek apakah username sudah ada
    IF EXISTS (SELECT 1 FROM public.users WHERE username = new_username) THEN
      -- Tambahkan suffix angka jika username sudah ada
      username_counter := 1;
      WHILE EXISTS (SELECT 1 FROM public.users WHERE username = new_username || '_' || username_counter) LOOP
        username_counter := username_counter + 1;
      END LOOP;
      new_username := new_username || '_' || username_counter;
    END IF;
    
    -- Insert user profile dengan username yang unik
    BEGIN
      INSERT INTO public.users (id, email, username, balance, is_staff)
      VALUES (
        auth_user.id, 
        auth_user.email, 
        new_username, 
        0.00, 
        FALSE
      );
      
      RAISE NOTICE 'Created profile for user: % with username: %', auth_user.email, new_username;
    EXCEPTION 
      WHEN unique_violation THEN
        RAISE NOTICE 'Skipped user % - already exists', auth_user.email;
    END;
  END LOOP;
END $$;

-- 5. Verifikasi hasil
SELECT 
  'Auth Users' as table_name,
  COUNT(*) as count
FROM auth.users
UNION ALL
SELECT 
  'Public Users' as table_name,
  COUNT(*) as count
FROM public.users;

-- 6. Lihat user yang baru dibuat
SELECT 
  id,
  email,
  username,
  balance,
  is_staff,
  created_at
FROM public.users
ORDER BY created_at DESC
LIMIT 10;

-- ═══════════════════════════════════════════════════════════════════════════════
-- SELESAI!
-- ═══════════════════════════════════════════════════════════════════════════════
-- Jika masih ada error, coba:
-- 1. Cek apakah username "tama" sudah ada: SELECT * FROM public.users WHERE username = 'tama';
-- 2. Jika ingin hapus user tertentu: DELETE FROM public.users WHERE username = 'tama';
-- 3. Atau rename: UPDATE public.users SET username = 'tama_old' WHERE username = 'tama';
-- ═══════════════════════════════════════════════════════════════════════════════
