-- ============================================================
-- FORCED CLEANUP: PURGE ALL POTENTIAL DOUBLE-COUNTING TRIGGERS
-- ============================================================

-- 1. Identify and DROP any triggers that might be firing on scan_events
-- We drop by name if known, but also provide a way to drop ALL if needed.
DROP TRIGGER IF EXISTS on_scan_event_recorded ON public.scan_events;
DROP TRIGGER IF EXISTS increment_scan_count_trigger ON public.scan_events;
DROP TRIGGER IF EXISTS sync_scan_count_trigger ON public.scan_events;
DROP TRIGGER IF EXISTS update_qr_scan_count ON public.scan_events;

-- 2. Drop any functions associated with the triggers above
DROP FUNCTION IF EXISTS public.sync_scan_count();
DROP FUNCTION IF EXISTS public.handle_scan_increment();
DROP FUNCTION IF EXISTS public.update_scan_stats();

-- 3. Re-create the DEFINITIVE increment_scan function (v3.1)
-- This function is the ONLY place where qr_codes.scan_count is incremented.
-- It already has a 10-second de-duplication window.
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
  -- A. De-duplication check: Ignore if SAME user scanned SAME QR recently (10s)
  IF EXISTS (
    SELECT 1 FROM public.scan_events 
    WHERE qr_code_id = target_qr_id 
    AND (public.scan_events.user_identifier = increment_scan.user_identifier OR public.scan_events.ip_address = increment_scan.ip_address)
    AND scanned_at > now() - interval '10 seconds'
  ) THEN
    RETURN;
  END IF;

  -- B. Increment QR code total scans
  -- This is the SINGLE SOURCE OF TRUTH for the "Total Scans" count shown in UI
  UPDATE public.qr_codes
  SET scan_count = coalesce(scan_count, 0) + 1
  WHERE id = target_qr_id;

  -- C. Update profile monthly scan count
  UPDATE public.profiles 
  SET monthly_scan_count = coalesce(monthly_scan_count, 0) + 1 
  WHERE id = (SELECT user_id FROM public.qr_codes WHERE id = target_qr_id);

  -- D. Record the detailed scan event
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
END;
$$;

-- 4. Final verification: Ensure we don't have any generic triggers left on scan_events
-- that might call any function starting with 'sync' or 'increment'
-- (This part requires manual check if the above doesn't work)
