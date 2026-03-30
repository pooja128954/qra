import { motion } from "framer-motion";
import { useSearchParams } from "react-router-dom";
import { Scan, Users, Monitor, Smartphone, Globe } from "lucide-react";
import DashboardLayout from "@/components/DashboardLayout";
import UpgradeBanner from "@/components/UpgradeBanner";
import { useScanStats, useWeeklyScans, useTopCodes, useRecentScans, useLeads } from "@/hooks/useAnalytics";
import { useQrCodes } from "@/hooks/useQrCodes";
import { usePlan } from "@/hooks/usePlan";

const ease = [0.16, 1, 0.3, 1] as const;

function StatSkeleton() {
  return <div className="bg-card border border-border rounded-xl p-5 animate-pulse"><div className="h-3 w-24 rounded bg-accent mb-3" /><div className="h-7 w-16 rounded bg-accent" /></div>;
}

export default function Analytics() {
  const [searchParams] = useSearchParams();
  const qrId = searchParams.get("qrId");

  const { data: stats, isLoading: statsLoading } = useScanStats(qrId || undefined);
  const { data: weeklyData = [], isLoading: weeklyLoading } = useWeeklyScans(qrId || undefined);
  const { data: topCodes = [], isLoading: topLoading } = useTopCodes();
  const { data: recentScans = [], isLoading: recentLoading } = useRecentScans(qrId || undefined);
  const { data: leads = [], isLoading: leadsLoading } = useLeads(qrId || undefined);
  const { codes } = useQrCodes();

  const currentQr = qrId ? codes.find(c => c.id === qrId) : null;
  const { limits } = usePlan();

  // Block access for plans with no analytics
  if (limits.analytics === "none") {
    return (
      <DashboardLayout>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease }}>
          <h1 className="text-2xl font-semibold mb-1">Analytics</h1>
          <p className="text-sm text-muted-foreground mb-8">Track scan performance across all your QR codes.</p>
          <UpgradeBanner
            title="Analytics Locked"
            description="Upgrade your plan to unlock analytics and track your QR code performance."
          />
        </motion.div>
      </DashboardLayout>
    );
  }

  const isBasic = limits.analytics === "basic";
  const isPremiumOrFull = limits.analytics === "premium" || limits.analytics === "full";

  const overviewStats = [
    { label: "Total Scans", value: (stats?.totalScans ?? 0).toLocaleString(), icon: Scan },
    { label: "Unique Scans", value: (stats?.uniqueScans ?? 0).toLocaleString(), icon: Users },
    { label: "Desktop", value: `${stats?.desktopPct ?? 38}%`, icon: Monitor },
    { label: "Mobile", value: `${stats?.mobilePct ?? 62}%`, icon: Smartphone },
    { label: "Lead Conversions", value: leads.length.toLocaleString(), icon: Users },
  ];

  const maxScans = weeklyData.length > 0 ? Math.max(...weeklyData.map((d) => d.scans), 1) : 1;

  return (
    <DashboardLayout>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease }}>
        <h1 className="text-2xl font-semibold mb-1">Analytics</h1>
        <p className="text-sm text-muted-foreground mb-8">
          {qrId ? `Viewing stats for "${currentQr?.name || 'Loading...'}"` : "Track scan performance across all your QR codes."}
        </p>

        {/* Overview Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-10">
          {statsLoading
            ? Array.from({ length: 4 }).map((_, i) => <StatSkeleton key={i} />)
            : overviewStats.map((s, i) => {
              if (isBasic && (s.label === "Desktop" || s.label === "Mobile")) {
                return null; // Skip rendering these stat cards for basic users
              }
              return (
                <motion.div
                  key={s.label}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, ease, delay: i * 0.08 }}
                  className="bg-card border border-border rounded-xl p-5"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="label-caps text-muted-foreground">{s.label}</span>
                    <s.icon className="w-4 h-4 text-muted-foreground" />
                  </div>
                  <p className="text-2xl font-semibold tabular-nums">{s.value}</p>
                </motion.div>
              );
            })}

          {isBasic && (
            <div className="col-span-2 hidden lg:flex items-center justify-center p-4">
              <p className="text-sm text-muted-foreground">Device stats locked on Economic plan.</p>
            </div>
          )}
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          {/* Weekly Scans Bar Chart */}
          <div className="bg-card border border-border rounded-xl p-6">
            <h3 className="font-semibold mb-1">Weekly Scans</h3>
            <p className="text-xs text-muted-foreground mb-6">Last 7 days</p>

            {isBasic ? (
              <UpgradeBanner
                title="Time-Based Analytics Locked"
                description="Upgrade to Premium to visualize your scan history and track engagement over time."
              />
            ) : weeklyLoading ? (
              <div className="flex items-end gap-3 h-40">
                {Array.from({ length: 7 }).map((_, i) => (
                  <div key={i} className="flex-1 flex flex-col items-center gap-2">
                    <div className="w-full rounded-t-md bg-accent animate-pulse" style={{ height: `${20 + Math.random() * 60}%` }} />
                    <div className="h-3 w-6 rounded bg-accent animate-pulse" />
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex items-end gap-3 h-40">
                {weeklyData.map((d) => (
                  <div key={d.day} className="flex-1 flex flex-col items-center gap-2">
                    <span className="text-xs font-mono tabular-nums text-muted-foreground">{d.scans}</span>
                    <motion.div
                      initial={{ height: 0 }}
                      animate={{ height: `${(d.scans / maxScans) * 100}%` }}
                      transition={{ duration: 0.6, ease, delay: 0.3 }}
                      className="w-full bg-primary/20 rounded-t-md relative overflow-hidden min-h-[4px]"
                    >
                      <div className="absolute inset-0 bg-primary/40 rounded-t-md" />
                    </motion.div>
                    <span className="text-xs text-muted-foreground">{d.day}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Top QR Codes */}
          <div className="bg-card border border-border rounded-xl p-6">
            <h3 className="font-semibold mb-1">Top QR Codes</h3>
            <p className="text-xs text-muted-foreground mb-6">By scan count</p>
            {topLoading ? (
              <div className="space-y-4">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="flex items-center gap-3 animate-pulse">
                    <div className="h-3 w-5 rounded bg-accent" />
                    <div className="flex-1">
                      <div className="h-4 w-3/4 rounded bg-accent mb-2" />
                      <div className="h-1.5 w-full rounded-full bg-accent" />
                    </div>
                    <div className="h-4 w-10 rounded bg-accent" />
                  </div>
                ))}
              </div>
            ) : topCodes.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">No QR codes yet. Create your first one!</p>
            ) : (
              <div className="space-y-4">
                {topCodes.map((c, i) => (
                  <div key={c.name} className="flex items-center gap-3">
                    <span className="font-mono text-xs text-muted-foreground w-5">{String(i + 1).padStart(2, "0")}</span>
                    <div className="flex-1">
                      <p className="text-sm font-medium mb-1 truncate">{c.name}</p>
                      <div className="w-full h-1.5 bg-accent rounded-full overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${topCodes[0].scans > 0 ? (c.scans / topCodes[0].scans) * 100 : 0}%` }}
                          transition={{ duration: 0.6, ease, delay: 0.3 + i * 0.1 }}
                          className="h-full bg-primary rounded-full"
                        />
                      </div>
                    </div>
                    <span className="font-mono text-sm tabular-nums">{c.scans.toLocaleString()}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Recent Leads Table */}
          <div className="bg-card border border-border rounded-xl p-6 lg:col-span-2">
            <div className="flex items-center gap-2 mb-1">
              <Users className="w-4 h-4 text-primary" />
              <h3 className="font-semibold">Recent Leads (Lead Capture)</h3>
            </div>
            <p className="text-xs text-muted-foreground mb-6">Detailed information from users who filled the lead form</p>

            {isBasic ? (
              <UpgradeBanner
                title="Lead Data Locked"
                description="Upgrade to Premium to collect and view detailed lead information from your QR codes."
              />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border text-muted-foreground text-[10px] uppercase tracking-wider">
                      <th className="text-left font-semibold pb-3 pl-2">Name / Email</th>
                      <th className="text-left font-semibold pb-3">Phone</th>
                      <th className="text-left font-semibold pb-3">Location</th>
                      <th className="text-left font-semibold pb-3">Device</th>
                      <th className="text-right font-semibold pb-3 pr-2">Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {leadsLoading ? (
                      Array.from({ length: 3 }).map((_, i) => (
                        <tr key={i} className="border-b border-border/50 last:border-0 animate-pulse">
                          <td className="py-4 pl-2"><div className="h-4 w-32 bg-accent rounded mb-1" /><div className="h-3 w-40 bg-accent rounded opacity-50" /></td>
                          <td className="py-4"><div className="h-4 w-24 bg-accent rounded" /></td>
                          <td className="py-4"><div className="h-4 w-20 bg-accent rounded" /></td>
                          <td className="py-4"><div className="h-4 w-12 bg-accent rounded" /></td>
                          <td className="py-4 pr-2 text-right"><div className="h-4 w-20 bg-accent rounded ml-auto" /></td>
                        </tr>
                      ))
                    ) : leads.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="py-12 text-center text-muted-foreground italic">
                          No leads captured yet. Enable "Lead Capture" in the Generator to start collecting data.
                        </td>
                      </tr>
                    ) : (
                      leads.map((lead: any) => (
                        <tr key={lead.id} className="border-b border-border/50 last:border-0 hover:bg-accent/30 transition-colors group">
                          <td className="py-4 pl-2">
                            <div className="font-semibold text-foreground">{lead.name}</div>
                            <div className="text-[10px] text-muted-foreground lowercase">{lead.email}</div>
                          </td>
                          <td className="py-4 text-xs font-mono text-muted-foreground">{lead.phone || "—"}</td>
                          <td className="py-4">
                            <div className="text-xs font-medium">{lead.city || "Unknown"}</div>
                            <div className="text-[10px] text-muted-foreground">{lead.country || "Unknown"}</div>
                          </td>
                          <td className="py-4">
                            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                              {lead.device_type === "mobile" ? <Smartphone className="w-3 h-3" /> : <Monitor className="w-3 h-3" />}
                              {lead.device_type || "PC"}
                            </div>
                          </td>
                          <td className="py-4 pr-2 text-right text-[10px] font-mono text-muted-foreground tabular-nums">
                            {new Date(lead.created_at).toLocaleDateString()}
                            <br />
                            {new Date(lead.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Scan History & Locations */}
          <div className="bg-card border border-border rounded-xl p-6 lg:col-span-2">
            <div className="flex items-center gap-2 mb-1">
              <Globe className="w-4 h-4 text-muted-foreground" />
              <h3 className="font-semibold">Recent Scans & Locations</h3>
            </div>
            <p className="text-xs text-muted-foreground mb-6">Real-time scan history and visitor locations</p>
            
            {isBasic ? (
              <UpgradeBanner
                title="Location Data Locked"
                description="Upgrade to Premium to view where in the world your QR codes are being scanned."
              />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border text-muted-foreground text-[10px] uppercase tracking-wider">
                      <th className="text-left font-semibold pb-3 pl-2">Location (State, City)</th>
                      <th className="text-left font-semibold pb-3">Device Type</th>
                      <th className="text-right font-semibold pb-3 pr-2">Scanned At</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentLoading ? (
                      Array.from({ length: 5 }).map((_, i) => (
                        <tr key={i} className="border-b border-border/50 last:border-0 animate-pulse">
                          <td className="py-4 pl-2"><div className="h-4 w-40 bg-accent rounded" /></td>
                          <td className="py-4"><div className="h-4 w-20 bg-accent rounded" /></td>
                          <td className="py-4 pr-2 text-right"><div className="h-4 w-24 bg-accent rounded ml-auto" /></td>
                        </tr>
                      ))
                    ) : recentScans.length === 0 ? (
                      <tr>
                        <td colSpan={3} className="py-12 text-center text-muted-foreground">
                          No scan data available yet.
                        </td>
                      </tr>
                    ) : (
                      recentScans.map((scan: any) => (
                        <tr key={scan.id} className="border-b border-border/50 last:border-0 hover:bg-accent/30 transition-colors group">
                          <td className="py-4 pl-2">
                            <span className="font-medium text-foreground">{scan.state || "Unknown"}</span>
                            <span className="text-muted-foreground ml-2">({scan.city || "Unknown"})</span>
                          </td>
                          <td className="py-4 text-muted-foreground capitalize">
                            <div className="flex items-center gap-2">
                              {scan.device_type === "mobile" ? <Smartphone className="w-3.5 h-3.5" /> : <Monitor className="w-3.5 h-3.5" />}
                              {scan.device_type || "Desktop"}
                            </div>
                          </td>
                          <td className="py-4 pr-2 text-right text-xs font-mono text-muted-foreground tabular-nums">
                            {new Date(scan.scanned_at).toLocaleString("en-US", { 
                              month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" 
                            })}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </motion.div>
    </DashboardLayout>
  );
}
