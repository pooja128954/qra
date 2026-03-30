import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/context/AuthContext";
import { usePlan } from "@/hooks/usePlan";

interface ScanStats {
  totalScans: number;
  uniqueScans: number;
  desktopPct: number;
  mobilePct: number;
  countries: { name: string; count: number }[];
  browsers: { name: string; count: number }[];
}

interface DayScans {
  day: string;
  scans: number;
}

interface TopCode {
  name: string;
  scans: number;
}

export function useScanStats(qrId?: string) {
  const { user } = useAuth();
  const { limits } = usePlan();

  return useQuery<ScanStats>({
    queryKey: ["scan_stats", user?.id, qrId, limits.analytics],
    enabled: !!user,
    queryFn: async () => {
      let ids: string[] = [];
      let totalScansValue = 0;

      if (qrId) {
        // Only fetch for specific QR
        const { data } = await supabase.from("qr_codes").select("id, scan_count").eq("id", qrId).single() as unknown as { data: { id: string, scan_count: number } | null };
        if (data) {
          ids = [data.id];
          totalScansValue = data.scan_count;
        }
      } else {
        // Get all QR codes owned by user
        const { data: qrCodes } = await supabase.from("qr_codes").select("id, scan_count").eq("user_id", user?.id) as unknown as { data: { id: string, scan_count: number }[] | null };
        if (qrCodes) {
          ids = qrCodes.map((q) => q.id);
          totalScansValue = qrCodes.reduce((acc, q) => acc + q.scan_count, 0);
        }
      }

      if (ids.length === 0) {
        return { totalScans: 0, uniqueScans: 0, desktopPct: 0, mobilePct: 0, countries: [], browsers: [] };
      }

      // Fetch scan events for those codes (for unique and geo stats)
      let query = supabase
        .from("scan_events")
        .select("id, device_type, country, user_identifier")
        .in("qr_code_id", ids);

      // For basic analytics (premium plan), limit to last 7 days
      if (limits.analytics === "basic") {
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        query = query.gte("scanned_at", sevenDaysAgo.toISOString());
      }

      const { data: events } = await query as unknown as { data: { id: string, device_type: string | null, country: string | null, user_identifier: string | null }[] | null };

      // Total scans should be the count of all audit events in the result set
      const total = events?.length ?? 0;
      
      // Unique scans come from the distinct user_identifiers in those events
      const unique = new Set(events?.filter(e => e.user_identifier).map(e => e.user_identifier) ?? []).size;

      const eventCount = total;
      const desktop = events?.filter((e) => e.device_type === "desktop").length ?? 0;
      const mobile = events?.filter((e) => e.device_type === "mobile").length ?? 0;
      const other = eventCount - desktop - mobile;
      
      const desktopPct = eventCount > 0 ? Math.round(((desktop + other * 0.4) / eventCount) * 100) : 38;
      const mobilePct = eventCount > 0 ? 100 - desktopPct : 62;

      // Group by country
      const countryMap: Record<string, number> = {};
      events?.forEach(e => {
        const c = e.country || "Unknown";
        countryMap[c] = (countryMap[c] || 0) + 1;
      });
      const countries = Object.entries(countryMap)
        .map(([name, count]) => ({ name, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);

      return { totalScans: total, uniqueScans: unique, desktopPct, mobilePct, countries, browsers: [] };
    },
  });
}

export function useRecentScans(qrId?: string, limit = 10) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["recent_scans", user?.id, qrId],
    enabled: !!user,
    queryFn: async () => {
      let query = supabase
        .from("scan_events")
        .select(`
          id, 
          device_type,
          country, 
          state, 
          city, 
          scanned_at,
          qr_codes!inner(user_id)
        `)
        .order("scanned_at", { ascending: false })
        .limit(limit);

      if (qrId) {
        query = query.eq("qr_code_id", qrId);
      } else {
        query = query.eq("qr_codes.user_id", user?.id);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
  });
}

export function useWeeklyScans(qrId?: string) {
// ... (rest remains same)
  const { user } = useAuth();

  return useQuery<DayScans[]>({
    queryKey: ["weekly_scans", user?.id, qrId],
    enabled: !!user,
    queryFn: async () => {
      let ids: string[] = [];

      if (qrId) {
        const { data } = await supabase.from("qr_codes").select("id").eq("id", qrId).single() as unknown as { data: { id: string } | null };
        if (data) ids = [data.id];
      } else {
        const { data: qrCodes } = await supabase.from("qr_codes").select("id").eq("user_id", user?.id) as unknown as { data: { id: string }[] | null };
        if (qrCodes) ids = qrCodes.map((q) => q.id);
      }

      const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
      const result: DayScans[] = days.map((day) => ({ day, scans: 0 }));

      if (ids.length === 0) return result;

      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

      const { data: events } = await supabase
        .from("scan_events")
        .select("scanned_at")
        .in("qr_code_id", ids)
        .gte("scanned_at", sevenDaysAgo.toISOString()) as unknown as { data: { scanned_at: string }[] | null };

      events?.forEach((ev) => {
        const dayIndex = new Date(ev.scanned_at).getDay();
        result[dayIndex].scans += 1;
      });

      // Rotate so today is last
      const todayIndex = new Date().getDay();
      return [...result.slice(todayIndex + 1), ...result.slice(0, todayIndex + 1)];
    },
  });
}

export function useTopCodes(limit = 4) {
  const { user } = useAuth();
  const { limits } = usePlan();

  return useQuery<TopCode[]>({
    queryKey: ["top_codes", user?.id, limits.analytics],
    enabled: !!user,
    queryFn: async () => {
      // Get QR codes owned by user with their global scan counts
      const { data: qrCodes, error: qrError } = await supabase
        .from("qr_codes")
        .select("id, name, scan_count")
        .eq("user_id", user?.id)
        .order("scan_count", { ascending: false })
        .limit(limit);

      if (qrError) throw qrError;
      if (!qrCodes || qrCodes.length === 0) return [];

      return (qrCodes as any[]).map(qr => ({
        name: qr.name,
        scans: qr.scan_count || 0
      }));
    },
  });
}

export function useLeads(qrId?: string, limit = 10) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["leads", user?.id, qrId],
    enabled: !!user,
    queryFn: async () => {
      let query = (supabase as any)
        .from("lead_captures")
        .select(`
          *,
          qr_codes!inner(name, user_id)
        `)
        .order("created_at", { ascending: false })
        .limit(limit);

      if (qrId) {
        query = query.eq("qr_code_id", qrId);
      } else {
        query = query.eq("qr_codes.user_id", user?.id);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
  });
}
