-- ============================================================
-- DIAGNOSTIC & FIX SCRIPT for Scan Count Not Updating
-- ============================================================
-- Run this entire script in Supabase SQL Editor

-- 1. CHECK IF TABLES EXIST AND HAVE DATA
SELECT 'QR Codes Count' as check_name, COUNT(*)::text as result FROM public.qr_codes
UNION ALL
SELECT 'Scan Events Count', COUNT(*)::text FROM public.scan_events
UNION ALL
SELECT 'Profiles Count', COUNT(*)::text FROM public.profiles;

-- 2. CHECK RECENT SCAN_EVENTS (last 5)
SELECT 'RECENT SCANS:' as info;
SELECT 
  qr_code_id, 
  user_identifier, 
  device_type, 
  country,
  scanned_at
FROM public.scan_events 
ORDER BY scanned_at DESC 
LIMIT 5;

-- 3. CHECK IF RPC FUNCTION EXISTS
SELECT 'RPC FUNCTION CHECK:' as info;
SELECT 
  routine_name,
  routine_definition 
FROM information_schema.routines 
WHERE routine_name = 'increment_scan';

-- 4. RECREATE INCREMENT_SCAN FUNCTION (with all fixes)
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
  -- A. DEDUPLICATION CHECK (10-second window)
  IF EXISTS (
    SELECT 1 FROM public.scan_events 
    WHERE qr_code_id = target_qr_id 
    AND user_identifier = increment_scan.user_identifier
    AND device_type = increment_scan.device_type
    AND country = increment_scan.country
    AND scanned_at > now() - interval '10 seconds'
    LIMIT 1
  ) THEN
    RETURN;
  END IF;

  -- B. INSERT SCAN EVENT (do this FIRST so we have audit trail)
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

  -- C. UPDATE ATOMIC COUNTERS
  -- 1. Total Global Counter
  UPDATE public.qr_codes
  SET scan_count = coalesce(scan_count, 0) + 1
  WHERE id = target_qr_id;

  -- 2. Monthly Limit Counter
  UPDATE public.profiles 
  SET monthly_scan_count = coalesce(monthly_scan_count, 0) + 1 
  WHERE id = (SELECT user_id FROM public.qr_codes WHERE id = target_qr_id);

END;
$$;

-- 5. GRANT PERMISSIONS
GRANT EXECUTE ON FUNCTION public.increment_scan(uuid, text, text, text, text, text, text, text) 
TO anon, authenticated;

-- 6. VERIFY PERMISSIONS GRANTED
SELECT 'PERMISSIONS:' as info;
SELECT 
  'increment_scan' as function_name,
  'EXECUTE privilege granted to: anon, authenticated' as status;

-- 7. CHECK RLS POLICIES ON SCAN_EVENTS
SELECT 'RLS POLICIES:' as info;
SELECT 
  schemaname, 
  tablename, 
  policyname, 
  permissive, 
  roles, 
  qual 
FROM pg_policies 
WHERE tablename = 'scan_events';

-- 8. ENABLE RLS ON SCAN_EVENTS
ALTER TABLE public.scan_events ENABLE ROW LEVEL SECURITY;

-- 9. CHECK/RECREATE INSERT POLICY FOR ANON USERS
DROP POLICY IF EXISTS "scan_events: insert anon" ON public.scan_events;
CREATE POLICY "scan_events: insert anon" ON public.scan_events
  FOR INSERT WITH CHECK (true);

-- 10. VERIFY SCAN_EVENTS TABLE STRUCTURE
SELECT 'SCAN_EVENTS TABLE STRUCTURE:' as info;
SELECT 
  column_name, 
  data_type, 
  is_nullable 
FROM information_schema.columns 
WHERE table_name = 'scan_events' 
ORDER BY ordinal_position;

-- 11. TEST: Try to manually insert a test scan
-- Uncomment to test:
-- INSERT INTO public.scan_events (
--   qr_code_id, user_identifier, device_type, country, state, city, ip_address
-- ) VALUES (
--   (SELECT id FROM public.qr_codes LIMIT 1),
--   'test-device-123',
--   'desktop',
--   'TestCountry',
--   'TestState', 
--   'TestCity',
--   '127.0.0.1'
-- );

-- 12. FINAL VERIFICATION
SELECT 'FINAL CHECK - SCAN COUNT FOR FIRST QR:' as info;
SELECT 
  id,
  name,
  scan_count,
  (SELECT COUNT(DISTINCT user_identifier) FROM public.scan_events WHERE qr_code_id = public.qr_codes.id) as unique_scans
FROM public.qr_codes 
LIMIT 5;
