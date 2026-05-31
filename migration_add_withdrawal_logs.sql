-- ═══════════════════════════════════════════════════════════════════════════════
-- MIGRATION: Add Withdrawal Logs Table & Discord Integration
-- Run this in Supabase SQL Editor
-- ═══════════════════════════════════════════════════════════════════════════════

-- 1. Create Withdrawal Logs Table
CREATE TABLE IF NOT EXISTS public.withdrawal_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    inventory_item_id UUID REFERENCES public.inventory(id) ON DELETE CASCADE NOT NULL,
    item_name VARCHAR(255) NOT NULL,
    item_value NUMERIC(15, 2) NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'pending', -- pending, completed, rejected, cancelled
    requested_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    completed_at TIMESTAMPTZ,
    admin_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
    admin_notes TEXT,
    discord_message_id VARCHAR(255),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Create Indexes for Withdrawal Logs
CREATE INDEX IF NOT EXISTS idx_withdrawal_logs_user_id ON public.withdrawal_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_withdrawal_logs_status ON public.withdrawal_logs(status);
CREATE INDEX IF NOT EXISTS idx_withdrawal_logs_requested_at ON public.withdrawal_logs(requested_at DESC);
CREATE INDEX IF NOT EXISTS idx_withdrawal_logs_admin_id ON public.withdrawal_logs(admin_id);

-- 3. Disable RLS for Development
ALTER TABLE public.withdrawal_logs DISABLE ROW LEVEL SECURITY;

-- 4. Grant Permissions
GRANT ALL ON public.withdrawal_logs TO anon, authenticated;

-- 5. Add Discord Webhook URL to Site Content
INSERT INTO public.site_content (content_key, content_value, content_type) VALUES
('discord_webhook_url', 'https://discord.com/api/webhooks/YOUR_WEBHOOK_ID/YOUR_WEBHOOK_TOKEN', 'url'),
('discord_staff_channel_id', '1234567890', 'text'),
('discord_invite_link', 'https://discord.gg/dewagacor-staff', 'url')
ON CONFLICT (content_key) DO NOTHING;

-- ═══════════════════════════════════════════════════════════════════════════════
-- MIGRATION COMPLETE!
-- ✅ Withdrawal logs table created
-- ✅ Discord integration fields added
-- ═══════════════════════════════════════════════════════════════════════════════
