-- ═══════════════════════════════════════════════════════════════════════════════
-- STEP 1: Tambah Kolom ke Tabel Users
-- Jalankan script ini PERTAMA
-- ═══════════════════════════════════════════════════════════════════════════════

-- Tambah kolom role
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS role VARCHAR(50) DEFAULT 'Player';

-- Tambah kolom avatar_url
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS avatar_url TEXT;

-- Tambah kolom last_seen
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS last_seen TIMESTAMPTZ DEFAULT NOW();

-- Update semua user yang belum punya role
UPDATE public.users SET role = 'Player' WHERE role IS NULL;

-- Set nanddev sebagai Owner
UPDATE public.users SET role = 'Owner' WHERE username = 'nanddev';

-- Set staff sebagai Administrator
UPDATE public.users SET role = 'Administrator' WHERE is_staff = true AND username != 'nanddev';

-- Verifikasi
SELECT username, role, is_staff FROM public.users;
