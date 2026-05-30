-- ═══════════════════════════════════════════════════════════════════════════════
-- SEED GAME CONFIGS - Insert Default Configurations
-- Run this to populate game_configs table with default values from JSON files
-- ═══════════════════════════════════════════════════════════════════════════════

-- ─── STEP 1: Clear existing configs (prevent duplicates) ──────────────────────
DELETE FROM public.game_configs;

-- ─── STEP 2: Insert default configs ────────────────────────────────────────────
-- Note: You need to manually copy the JSON content from your data files
-- This is a template - replace the {...} with actual JSON content

-- Insert Cases/Chests Config
-- Copy content from: src/data/case_opening.json
INSERT INTO public.game_configs (game_type, config_data, updated_at)
VALUES (
  'cases',
  '{
    "cases": [],
    "gameSettings": {
      "defaultSpinDurationMs": 5500,
      "fastSpinDurationMs": 1500,
      "soundTickFrequencyHz": 220,
      "pointerShadowGlowHex": "#ea580c",
      "spinEasing": "cubic-bezier(0.04, 0.84, 0.12, 1)"
    }
  }'::jsonb,
  NOW()
);

-- Insert Wheel Config
-- Copy content from: src/data/roda.json
INSERT INTO public.game_configs (game_type, config_data, updated_at)
VALUES (
  'wheel',
  '{
    "prizes": []
  }'::jsonb,
  NOW()
);

-- Insert Crash Config
-- Copy content from: src/data/permainan.json
INSERT INTO public.game_configs (game_type, config_data, updated_at)
VALUES (
  'crash',
  '{
    "prizes": []
  }'::jsonb,
  NOW()
);

-- ─── STEP 3: Verify insertion ──────────────────────────────────────────────────
SELECT 
  game_type,
  jsonb_typeof(config_data) as data_type,
  updated_at
FROM public.game_configs
ORDER BY game_type;

-- ═══════════════════════════════════════════════════════════════════════════════
-- NOTES:
-- 
-- 1. This script inserts EMPTY configs as placeholders
-- 2. The actual configs will be loaded from JSON files as fallback
-- 3. You can edit configs via Admin Dashboard after this
-- 4. To insert full configs, replace the {...} with actual JSON from data files
--
-- ALTERNATIVE: Just let the app use JSON defaults (no need to run this script)
-- The server will automatically fallback to JSON files if DB is empty
-- ═══════════════════════════════════════════════════════════════════════════════
