-- ═══════════════════════════════════════════════════════════════════════════════
-- STEP 4: Buat Index untuk Performa
-- Jalankan script ini SETELAH step 3 berhasil
-- ═══════════════════════════════════════════════════════════════════════════════

-- Index untuk users
CREATE INDEX IF NOT EXISTS idx_users_role ON public.users(role);

-- Index untuk a
CREATE INDEX IF NOT EXISTS idx_chat_messages_created_at ON public.chat_messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_chat_messages_user_id ON public.chat_messages(user_id);

-- Index untuk chat_bans
CREATE INDEX IF NOT EXISTS idx_chat_bans_user_id ON public.chat_bans(user_id);

-- Index untuk online_sessions
CREATE INDEX IF NOT EXISTS idx_online_sessions_user_id ON public.online_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_online_sessions_heartbeat ON public.online_sessions(last_heartbeat DESC);

-- Index untuk news_posts
CREATE INDEX IF NOT EXISTS idx_news_posts_published ON public.news_posts(published_at DESC);

-- Index untuk analytics_events
CREATE INDEX IF NOT EXISTS idx_analytics_events_type ON public.analytics_events(event_type);
CREATE INDEX IF NOT EXISTS idx_analytics_events_created ON public.analytics_events(created_at DESC);

-- Verifikasi
SELECT 
    schemaname,
    tablename,
    indexname
FROM pg_indexes
WHERE schemaname = 'public'
AND tablename IN ('users', 'chat_messages', 'online_sessions')
ORDER BY tablename, indexname;
