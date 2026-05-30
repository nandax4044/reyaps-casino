-- ═══════════════════════════════════════════════════════════════════════════════
-- STEP 3: Masukkan Data Default
-- Jalankan script ini SETELAH step 2 berhasil
-- ═══════════════════════════════════════════════════════════════════════════════

-- Insert site content
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

-- Insert role badges
INSERT INTO public.role_badges (role, badge_image_url, badge_color, display_name, priority) VALUES
('Owner', '/roles/owner.png', '#ef4444', 'Owner', 100),
('Administrator', '/roles/admin.png', '#f59e0b', 'Administrator', 90),
('Moderator', '/roles/moderator.png', '#8b5cf6', 'Moderator', 80),
('VIP', '/roles/vip.png', '#10b981', 'VIP', 70),
('Player', '/roles/player.png', '#3b82f6', 'Player', 60)
ON CONFLICT (role) DO NOTHING;

-- Verifikasi
SELECT 'site_content' as table_name, COUNT(*) as row_count FROM public.site_content
UNION ALL
SELECT 'role_badges', COUNT(*) FROM public.role_badges;
