-- ============================================================
-- ScanovaX — Schema V9 Analytics Fix
-- Run this in the Supabase SQL Editor
-- ============================================================

-- 1. Refine the increment_scan RPC to ensure Totals always increment
-- and de-duplication ONLY affects the detailed scan_events log.

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
  -- A. UPDATE TOTAL COUNTS (Always happens on every hit)
  -- 1. Increment QR code total scans (Global all-time counter)
  UPDATE public.qr_codes
  SET scan_count = coalesce(scan_count, 0) + 1
  WHERE id = target_qr_id;

  -- 2. Update profile monthly scan count (for limits/billing)
  UPDATE public.profiles 
  SET monthly_scan_count = coalesce(monthly_scan_count, 0) + 1 
  WHERE id = (SELECT user_id FROM public.qr_codes WHERE id = target_qr_id);

  -- B. LOG DETAILED EVENT (With De-duplication)
  -- We only record a fresh event row if the same user hasn't scanned 
  -- this QR in the last 5 seconds (to prevent pre-fetch/double-fire noise).
  IF NOT EXISTS (
    SELECT 1 FROM public.scan_events 
    WHERE qr_code_id = target_qr_id 
    AND public.scan_events.user_identifier = increment_scan.user_identifier 
    AND scanned_at > now() - interval '5 seconds'
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

-- 2. Ensure RLS is enabled for scan_events and owners can see their data
ALTER TABLE public.scan_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own QR scan events" ON public.scan_events;
CREATE POLICY "Users can view their own QR scan events" ON public.scan_events
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.qr_codes 
      WHERE public.qr_codes.id = public.scan_events.qr_code_id 
      AND public.qr_codes.user_id = auth.uid()
    )
  );

-- 3. Ensure scan_events table has the necessary columns (some might be missing from older v3)
ALTER TABLE public.scan_events ADD COLUMN IF NOT EXISTS ip_address TEXT DEFAULT 'Unknown';
ALTER TABLE public.scan_events ADD COLUMN IF NOT EXISTS user_identifier TEXT DEFAULT 'Anonymous';
