-- =====================================================
-- pg_cron setup for scheduled reminders
-- Run this AFTER enabling pg_cron extension in Supabase
-- Dashboard → Database → Extensions → pg_cron → Enable
-- =====================================================

-- Enable the pg_cron extension (if not already done via UI)
-- CREATE EXTENSION IF NOT EXISTS pg_cron;

-- 1st of each month at 08:00 ICT (01:00 UTC) — full monthly overview
-- Shows every task due during the new month
SELECT cron.schedule(
  'monthly-summary',
  '0 1 1 * *',               -- 01:00 UTC on the 1st of each month
  $$
  SELECT net.http_get(
    url := current_setting('app.cron_url') || '/api/reminders?mode=monthly&secret=' || current_setting('app.cron_secret')
  )
  $$
);

-- Daily at 08:00 ICT (01:00 UTC) — 7-day and 1-day advance notices only
-- Skips the 1st of the month (monthly summary already runs then)
SELECT cron.schedule(
  'daily-advance-check',
  '0 1 2-31 * *',            -- 01:00 UTC on days 2–31 (skip 1st)
  $$
  SELECT net.http_get(
    url := current_setting('app.cron_url') || '/api/reminders?mode=check&secret=' || current_setting('app.cron_secret')
  )
  $$
);

-- =====================================================
-- Set app config values before running the jobs above
-- Replace with your actual values:
-- =====================================================

-- ALTER DATABASE postgres SET app.cron_url = 'https://your-app.vercel.app';
-- ALTER DATABASE postgres SET app.cron_secret = 'your_cron_secret_here';

-- =====================================================
-- Verify or remove jobs:
-- =====================================================
-- SELECT * FROM cron.job;
-- SELECT cron.unschedule('monthly-summary');
-- SELECT cron.unschedule('daily-advance-check');
