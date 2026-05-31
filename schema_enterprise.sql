-- ═══════════════════════════════════════════════════════════════════════════════
-- REYABET ENTERPRISE - Complete Database Schema
-- Run this entire script in Supabase SQL Editor
-- ═══════════════════════════════════════════════════════════════════════════════

-- ─── DROP EXISTING TABLES (if you want fresh start) ────────────────────────────
-- Uncomment these lines if you want to start fresh:
-- DROP TABLE IF EXISTS public.chat_messages CASCADE;
-- DROP TABLE IF EXISTS public.chat_bans CASCADE;
-- DROP TABLE IF EXISTS public.online_sessions CASCADE;
-- DROP TABLE IF EXISTS public.site_content CASCADE;
-- DROP TABLE IF EXISTS public.news_posts CASCADE;
-- DROP TABLE IF EXISTS public.media_library CASCADE;
-- DROP TABLE IF EXISTS public.analytics_events CASCADE;
-- DROP TABLE IF EXISTS public.role_badges CASCADE;
-- DROP TABLE IF EXISTS public.inventory CASCADE;
-- DROP TABLE IF EXISTS public.game_configs CASCADE;
-- DROP TABLE IF EXISTS public.users CASCADE;

-- ─── CREATE TABLES ──────────────────────────────────────────────────────────────

-- 1. Users Table (Enhanced with role system)
CREATE TABLE IF NOT EXISTS public.users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    username VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255), -- Optional, only for non-auth users
    balance NUMERIC(15, 2) NOT NULL DEFAULT 500.00,
    role VARCHAR(50) NOT NULL DEFAULT 'Player', -- Player, VIP, Moderator, Administrator, Owner
    is_staff BOOLEAN NOT NULL DEFAULT FALSE,
    avatar_url TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    last_seen TIMESTAMPTZ DEFAULT NOW()
);

-- 2. User Inventory Table
CREATE TABLE IF NOT EXISTS public.inventory (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    item_name VARCHAR(255) NOT NULL,
    rarity VARCHAR(50) NOT NULL,
    value NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
    icon VARCHAR(50),
    image TEXT,
    obtained_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    status VARCHAR(50) NOT NULL DEFAULT 'available'
);

-- 3. Game Configs Table
CREATE TABLE IF NOT EXISTS public.game_configs (
    game_type VARCHAR(50) PRIMARY KEY,
    config_data JSONB NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. Global Chat Messages Table
CREATE TABLE IF NOT EXISTS public.chat_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    username VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL DEFAULT 'Player',
    message TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMPTZ,
    deleted_by UUID REFERENCES public.users(id) ON DELETE SET NULL
);

-- 5. Chat Bans Table
CREATE TABLE IF NOT EXISTS public.chat_bans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    banned_by UUID REFERENCES public.users(id) ON DELETE SET NULL NOT NULL,
    reason TEXT,
    expires_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 6. Online Sessions Table (for live player tracking)
CREATE TABLE IF NOT EXISTS public.online_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    username VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL DEFAULT 'Player',
    activity VARCHAR(255) DEFAULT 'Browsing',
    last_heartbeat TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(user_id)
);

-- 7. Site Content CMS Table
CREATE TABLE IF NOT EXISTS public.site_content (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    content_key VARCHAR(100) UNIQUE NOT NULL, -- e.g., 'site_name', 'hero_title', 'footer_text'
    content_value TEXT NOT NULL,
    content_type VARCHAR(50) DEFAULT 'text', -- text, html, url, json
    updated_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 8. News Posts Table
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

-- 9. Media Library Table
CREATE TABLE IF NOT EXISTS public.media_library (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    filename VARCHAR(255) NOT NULL,
    file_url TEXT NOT NULL,
    file_type VARCHAR(50), -- image/png, image/webp, etc.
    file_size INTEGER, -- in bytes
    folder VARCHAR(255) DEFAULT 'root',
    uploaded_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 10. Analytics Events Table
CREATE TABLE IF NOT EXISTS public.analytics_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_type VARCHAR(100) NOT NULL, -- page_view, game_play, chest_open, etc.
    user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
    metadata JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 11. Role Badges Configuration Table
CREATE TABLE IF NOT EXISTS public.role_badges (
    role VARCHAR(50) PRIMARY KEY,
    badge_image_url TEXT NOT NULL,
    badge_color VARCHAR(20) DEFAULT '#3b82f6',
    display_name VARCHAR(100) NOT NULL,
    priority INTEGER DEFAULT 0, -- Higher priority shows first
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── CREATE INDEXES ─────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_inventory_user_id ON public.inventory(user_id);
CREATE INDEX IF NOT EXISTS idx_users_username ON public.users(username);
CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON public.users(role);
CREATE INDEX IF NOT EXISTS idx_inventory_status ON public.inventory(status);
CREATE INDEX IF NOT EXISTS idx_chat_messages_created_at ON public.chat_messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_chat_messages_user_id ON public.chat_messages(user_id);
CREATE INDEX IF NOT EXISTS idx_chat_bans_user_id ON public.chat_bans(user_id);
CREATE INDEX IF NOT EXISTS idx_online_sessions_user_id ON public.online_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_online_sessions_heartbeat ON public.online_sessions(last_heartbeat DESC);
CREATE INDEX IF NOT EXISTS idx_news_posts_published ON public.news_posts(published_at DESC);
CREATE INDEX IF NOT EXISTS idx_analytics_events_type ON public.analytics_events(event_type);
CREATE INDEX IF NOT EXISTS idx_analytics_events_created ON public.analytics_events(created_at DESC);

-- ─── DISABLE RLS FOR DEVELOPMENT (Enable in production with proper policies) ────
ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.game_configs DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_bans DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.online_sessions DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.site_content DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.news_posts DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.media_library DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.analytics_events DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.role_badges DISABLE ROW LEVEL SECURITY;

-- ─── GRANT PERMISSIONS ──────────────────────────────────────────────────────────
GRANT USAGE ON SCHEMA public TO anon, authenticated;

GRANT ALL ON public.users TO anon, authenticated;
GRANT ALL ON public.inventory TO anon, authenticated;
GRANT ALL ON public.game_configs TO anon, authenticated;
GRANT ALL ON public.chat_messages TO anon, authenticated;
GRANT ALL ON public.chat_bans TO anon, authenticated;
GRANT ALL ON public.online_sessions TO anon, authenticated;
GRANT ALL ON public.site_content TO anon, authenticated;
GRANT ALL ON public.news_posts TO anon, authenticated;
GRANT ALL ON public.media_library TO anon, authenticated;
GRANT ALL ON public.analytics_events TO anon, authenticated;
GRANT ALL ON public.role_badges TO anon, authenticated;

GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- ─── INSERT DEFAULT SITE CONTENT ────────────────────────────────────────────────
INSERT INTO public.site_content (content_key, content_value, content_type) VALUES
('site_name', 'ReyaBet', 'text'),
('site_subtitle', 'Online gacha in ReyaPs', 'text'),
('hero_title', 'Selamat Datang di ReyaBet Casino', 'text'),
('hero_subtitle', 'Mainkan game seru dan menangkan hadiah menarik!', 'text'),
('footer_text', 'WHEEL SPINNER CASINO © 2026 • Private Premium Client Build', 'text'),
('discord_link', 'https://discord.gg/ZHF2N94p5', 'url'),
('deposit_message', 'Silakan hubungi staff admin untuk melakukan top-up deposit saldo agar bisa bermain.', 'text'),
('logo_url', '/logo.png', 'url'),
('welcome_message', 'Selamat datang di ReyaBet! Mainkan game seru dan menangkan hadiah.', 'text')
ON CONFLICT (content_key) DO NOTHING;

-- ─── INSERT DEFAULT ROLE BADGES ─────────────────────────────────────────────────
INSERT INTO public.role_badges (role, badge_image_url, badge_color, display_name, priority) VALUES
('Owner', '/roles/owner.png', '#ef4444', 'Owner', 100),
('Administrator', '/roles/admin.png', '#f59e0b', 'Administrator', 90),
('Moderator', '/roles/moderator.png', '#8b5cf6', 'Moderator', 80),
('VIP', '/roles/vip.png', '#10b981', 'VIP', 70),
('Player', '/roles/player.png', '#3b82f6', 'Player', 60)
ON CONFLICT (role) DO NOTHING;

-- ─── TRIGGER: Auto-create public.users on auth signup ──────────────────────────
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
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ─── FUNCTION: Clean up old online sessions (call periodically) ─────────────────
CREATE OR REPLACE FUNCTION public.cleanup_stale_sessions()
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  DELETE FROM public.online_sessions
  WHERE last_heartbeat < NOW() - INTERVAL '5 minutes';
END;
$$;

-- ─── FUNCTION: Get online player count ──────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.get_online_count()
RETURNS INTEGER
LANGUAGE plpgsql
AS $$
DECLARE
  count INTEGER;
BEGIN
  -- Clean up stale sessions first
  PERFORM public.cleanup_stale_sessions();
  
  -- Return count
  SELECT COUNT(*) INTO count FROM public.online_sessions;
  RETURN count;
END;
$$;

-- ═══════════════════════════════════════════════════════════════════════════════
-- SETUP COMPLETE! 
-- Enterprise features ready:
-- ✅ Global Chat System
-- ✅ Online Player Tracking
-- ✅ CMS Content Management
-- ✅ News System
-- ✅ Media Library
-- ✅ Analytics Tracking
-- ✅ Role Badge System
-- ═══════════════════════════════════════════════════════════════════════════════
