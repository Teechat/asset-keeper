-- =====================================================
-- AssetKeeper Database Schema
-- Run this in Supabase SQL Editor
-- =====================================================

-- Users table (each LINE user who follows the OA)
CREATE TABLE IF NOT EXISTS users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  line_user_id TEXT UNIQUE NOT NULL,
  display_name TEXT,
  picture_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Assets table (things to maintain)
CREATE TABLE IF NOT EXISTS assets (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'Other',
  item_name TEXT,
  subcategory TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Reminders table (due dates + recurrence for each asset)
CREATE TABLE IF NOT EXISTS reminders (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  asset_id UUID NOT NULL REFERENCES assets(id) ON DELETE CASCADE,
  due_date DATE NOT NULL,
  recurrence TEXT NOT NULL DEFAULT 'none'
    CHECK (recurrence IN ('none', 'daily', 'weekly', 'monthly', 'yearly', 'custom')),
  recurrence_value INTEGER NOT NULL DEFAULT 1,
  recurrence_unit TEXT NOT NULL DEFAULT 'years'
    CHECK (recurrence_unit IN ('days', 'weeks', 'months', 'years')),
  advance_notice_days INTEGER[] NOT NULL DEFAULT '{7,1}',
  last_sent_at TIMESTAMPTZ,
  is_completed BOOLEAN NOT NULL DEFAULT FALSE,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for common query patterns
CREATE INDEX IF NOT EXISTS idx_assets_user_id ON assets(user_id);
CREATE INDEX IF NOT EXISTS idx_reminders_asset_id ON reminders(asset_id);
CREATE INDEX IF NOT EXISTS idx_reminders_due_date ON reminders(due_date) WHERE is_completed = FALSE;

-- Auto-update updated_at on assets
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER assets_updated_at
  BEFORE UPDATE ON assets
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- =====================================================
-- Row Level Security (RLS)
-- These are disabled for server-side use (admin client)
-- Enable only if you add user auth later
-- =====================================================

-- ALTER TABLE users ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE assets ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE reminders ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- Sample data (remove in production)
-- =====================================================

-- INSERT INTO users (line_user_id, display_name)
-- VALUES ('U_test_user_001', 'Test User');
