-- ═══════════════════════════════════════════════════════════════════════════════
-- REYABET ENTERPRISE - Migration Script (Aman untuk Database yang Sudah Ada)
-- Script ini menambahkan fitur enterprise tanpa menghapus data yang sudah ada
-- ═══════════════════════════════════════════════════════════════════════════════

-- ─── LANGKAH 1: Tambah kolom yang hilang ke tabel users ────────────────────────

-- Tambah kolom role jika belum ada
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='users' AND column_name='role') THEN
        ALTER TABLE public.users ADD COLUMN role VARCHAR(50) NOT NULL DEFAULT 'Player';
    END IF;
END $$;

-- Tambah kolom avatar_url jika belum ada
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='users' AND column_name='avatar_url') THEN
        ALTER TABLE public.users ADD COLUMN avatar_url TEXT;
    END IF;
END $$;

-- Tambah kolom last_seen jika belum ada
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='users' AND column_name='last_seen') THEN
        ALTER TABLE public.users ADD COLUMN last_seen TIMESTAMPTZ DEFAULT NOW();
    END IF;
END $$;

-- ─── LANGKAH 2: Buat tabel enterprise baru ─────────────────────────────────────

-- 1. Tabel Chat Messages (Pesan Chat Global)
CREATE TABLE IF NOT EXISTS public.chat_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    username VARCHAR(255) NOT NULL,
    is_staff BOOLEAN NOT NULL DEFAULT FALSE,
    message TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMPTZ,
    deleted_by UUID REFERENCES public.users(id) ON DELETE SET NULL
);

-- 2. Tabel Chat Bans (Ban/Mute User dari Chat)
CREATE TABLE IF NOT EXISTS public.chat_bans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    banned_by UUID REFERENCES public.users(id) ON DELETE SET NULL NOT NULL,
    reason TEXT,
    expires_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. Tabel Online Sessions (Tracking Pemain Online)
CREATE TABLE IF NOT EXISTS public.online_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    username VARCHAR(255) NOT NULL,
    is_staff BOOLEAN NOT NULL DEFAULT FALSE,
    activity VARCHAR(255) DEFAULT 'Browsing',
    last_heartbeat TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(user_id)
);

-- 4. Tabel Site Content (CMS - Konten Website)
CREATE TABLE IF NOT EXISTS public.site_content (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    content_key VARCHAR(100) UNIQUE NOT NULL,
    content_value TEXT NOT NULL,
    content_type VARCHAR(50) DEFAULT 'text',
    updated_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. Tabel News Posts (Sistem Berita)
CREATE TABLE IF NOT EXISTS public.news_posts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    thumbnail_url TEXT,
    author_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
    author_name VARCHAR(255),
    is_pinned BOOLEAN DEFAULT FALSE,
    published_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 6. Tabel Media Library (Manager File/Gambar)
CREATE TABLE IF NOT EXISTS public.media_library (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    filename VARCHAR(255) NOT NULL,
    file_url TEXT NOT NULL,
    file_type VARCHAR(50),
    file_size INTEGER,
    folder VARCHAR(255) DEFAULT 'root',
    uploaded_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 7. Tabel Analytics Events (Tracking Analytics)
CREATE TABLE IF NOT EXISTS public.analytics_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_type VARCHAR(100) NOT NULL,
    user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
    metadata JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 8. Tabel Role Badges (Konfigurasi Badge Role)
CREATE TABLE IF NOT EXISTS public.role_badges (
    role VARCHAR(50) PRIMARY KEY,
    badge_image_url TEXT NOT NULL,
    badge_color VARCHAR(20) DEFAULT '#3b82f6',
    display_name VARCHAR(100) NOT NULL,
    priority INTEGER DEFAULT 0,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── LANGKAH 3: Buat index untuk performa ──────────────────────────────────────

CREATE INDEX IF NOT EXISTS idx_users_role ON public.users(role);
CREATE INDEX IF NOT EXISTS idx_chat_messages_created_at ON public.chat_messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_chat_messages_user_id ON public.chat_messages(user_id);
CREATE INDEX IF NOT EXISTS idx_chat_bans_user_id ON public.chat_bans(user_id);
CREATE INDEX IF NOT EXISTS idx_online_sessions_user_id ON public.online_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_online_sessions_heartbeat ON public.online_sessions(last_heartbeat DESC);
CREATE INDEX IF NOT EXISTS idx_news_posts_published ON public.news_posts(published_at DESC);
CREATE INDEX IF NOT EXISTS idx_analytics_events_type ON public.analytics_events(event_type);
CREATE INDEX IF NOT EXISTS idx_analytics_events_created ON public.analytics_events(created_at DESC);

-- ─── LANGKAH 4: Masukkan data default ──────────────────────────────────────────

-- Data konten website default
INSERT INTO public.site_content (content_key, content_value, content_type) VALUES
('site_name', 'ReyaBet', 'text'),
('site_subtitle', 'Online gacha in ReyaPs', 'text'),
('hero_title', 'Selamat Datang di ReyaBet Casino', 'text'),
('hero_subtitle', 'Mainkan game seru dan menangkan hadiah menarik!', 'text'),
('footer_text', 'WHEEL SPINNER CASINO © 2026 • Private Premium Client Build', 'text'),
('discord_link', 'https://discord.gg/reyabet', 'url'),
('deposit_message', 'Silakan hubungi staff admin untuk melakukan top-up deposit saldo agar bisa bermain.', 'text'),
('logo_url', '/logo.png', 'url'),
('welcome_message', 'Selamat datang di ReyaBet! Mainkan game seru dan menangkan hadiah.', 'text')
ON CONFLICT (content_key) DO NOTHING;

-- Data role badges default
INSERT INTO public.role_badges (role, badge_image_url, badge_color, display_name, priority) VALUES
('Owner', '/roles/owner.png', '#ef4444', 'Owner', 100),
('Administrator', '/roles/admin.png', '#f59e0b', 'Administrator', 90),
('Moderator', '/roles/moderator.png', '#8b5cf6', 'Moderator', 80),
('VIP', '/roles/vip.png', '#10b981', 'VIP', 70),
('Player', '/roles/player.png', '#3b82f6', 'Player', 60)
ON CONFLICT (role) DO NOTHING;

-- ─── LANGKAH 5: Update user yang sudah ada dengan role ─────────────────────────

-- Set semua user ke role Player secara default
UPDATE public.users 
SET role = 'Player' 
WHERE role IS NULL OR role = '';

-- Set nanddev sebagai Owner
UPDATE public.users 
SET role = 'Owner' 
WHERE username = 'nanddev';

-- Set staff user sebagai Administrator
UPDATE public.users 
SET role = 'Administrator' 
WHERE is_staff = true AND username != 'nanddev';

-- ─── LANGKAH 6: Buat fungsi helper ─────────────────────────────────────────────

-- Fungsi untuk membersihkan session yang sudah lama
CREATE OR REPLACE FUNCTION public.cleanup_stale_sessions()
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  DELETE FROM public.online_sessions
  WHERE last_heartbeat < NOW() - INTERVAL '5 minutes';
END;
$$;

-- Fungsi untuk menghitung jumlah pemain online
CREATE OR REPLACE FUNCTION public.get_online_count()
RETURNS INTEGER
LANGUAGE plpgsql
AS $$
DECLARE
  count INTEGER;
BEGIN
  PERFORM public.cleanup_stale_sessions();
  SELECT COUNT(*) INTO count FROM public.online_sessions;
  RETURN count;
END;
$$;

-- ─── LANGKAH 7: Update trigger untuk user baru ─────────────────────────────────

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER 
LANGUAGE plpgsql 
SECURITY DEFINER 
SET search_path = public 
AS $$
BEGIN
  INSERT INTO public.users (id, email, username, balance, role, is_staff)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'username', split_part(NEW.email, '@', 1)),
    500.00,
    'Player',
    FALSE
  )
  ON CONFLICT (id) DO UPDATE SET
    role = COALESCE(public.users.role, 'Player'),
    last_seen = NOW();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ═══════════════════════════════════════════════════════════════════════════════
-- MIGRASI SELESAI! 
-- Data yang sudah ada tetap aman, fitur enterprise baru sudah ditambahkan.
-- ═══════════════════════════════════════════════════════════════════════════════

-- Verifikasi hasil migrasi
SELECT 
    'users' as table_name, 
    COUNT(*) as row_count,
    COUNT(CASE WHEN role IS NOT NULL THEN 1 END) as users_with_role
FROM public.users
UNION ALL
SELECT 'chat_messages', COUNT(*), 0 FROM public.chat_messages
UNION ALL
SELECT 'online_sessions', COUNT(*), 0 FROM public.online_sessions
UNION ALL
SELECT 'site_content', COUNT(*), 0 FROM public.site_content
UNION ALL
SELECT 'role_badges', COUNT(*), 0 FROM public.role_badges;
