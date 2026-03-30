-- ============================================================
-- ScanovaX — Schema V11 Independent Analytics Tracking
-- Run this in the Supabase SQL Editor
-- ============================================================

-- 1. Table structure upgrades
ALTER TABLE public.qr_codes ADD COLUMN IF NOT EXISTS unique_scans_count INTEGER DEFAULT 0;

-- Ensure total scans column is consistent (it was named scan_count in V10)
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'qr_codes' AND column_name = 'total_scans_count') THEN
    ALTER TABLE public.qr_codes RENAME COLUMN scan_count TO total_scans_count;
  END IF;
END $$;

-- 2. Enhanced Atomic Increment RPC
CREATE OR REPLACE FUNCTION public.increment_scan(
  target_qr_id uuid,
  scanner_email text DEFAULT NULL,
  device_type text DEFAULT 'desktop',
  country text DEFAULT 'Unknown',
  state text DEFAULT 'Unknown',
  city text DEFAULT 'Unknown',
  ip_address text DEFAULT 'Unknown',
  user_identifier text DEFAULT 'Anonymous'
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- A. TOTAL SCANS (Always increment)
  UPDATE public.qr_codes
  SET total_scans_count = coalesce(total_scans_count, 0) + 1
  WHERE id = target_qr_id;

  -- B. MONTHLY BILLING COUNTER
  UPDATE public.profiles 
  SET monthly_scan_count = coalesce(monthly_scan_count, 0) + 1 
  WHERE id = (SELECT user_id FROM public.qr_codes WHERE id = target_qr_id);

  -- C. UNIQUE SCANS (First time this identity scans this specific QR)
  IF NOT EXISTS (
    SELECT 1 FROM public.scan_events 
    WHERE qr_code_id = target_qr_id 
    AND public.scan_events.user_identifier = increment_scan.user_identifier
  ) THEN
    UPDATE public.qr_codes 
    SET unique_scans_count = coalesce(unique_scans_count, 0) + 1
    WHERE id = target_qr_id;
  END IF;

  -- D. RECORD EVENT (Every hit is logged, but we use a small 2-second debounce 
  -- to prevent double-logging if the app re-renders rapidly.)
  IF NOT EXISTS (
    SELECT 1 FROM public.scan_events 
    WHERE qr_code_id = target_qr_id 
    AND public.scan_events.user_identifier = increment_scan.user_identifier
    AND scanned_at > now() - interval '2 seconds'
  ) THEN
    INSERT INTO public.scan_events (
      qr_code_id,
      scanner_email,
      device_type,
      country,
      state,
      city,
      ip_address,
      user_identifier,
      scanned_at
    )
    VALUES (
      target_qr_id,
      scanner_email,
      device_type,
      country,
      state,
      city,
      ip_address,
      user_identifier,
      now()
    );
  END IF;
END;
$$;
