import { motion } from "framer-motion";
import { Link, useLocation } from "react-router-dom";
import {
  LayoutDashboard, FolderOpen, BarChart3, Plus,
  Scan, Users, Monitor, Smartphone, Globe
} from "lucide-react";
import Header from "@/components/Header";

const ease = [0.16, 1, 0.3, 1] as const;

const sidebarLinks = [
  { label: "Dashboard", to: "/dashboard", icon: LayoutDashboard },
  { label: "My QR Codes", to: "/dashboard/codes", icon: FolderOpen },
  { label: "Analytics", to: "/dashboard/analytics", icon: BarChart3 },
];

const overviewStats = [
  { label: "Total Scans", value: "14,892", icon: Scan },
  { label: "Unique Scans", value: "9,341", icon: Users },
  { label: "Desktop", value: "38%", icon: Monitor },
  { label: "Mobile", value: "62%", icon: Smartphone },
];

const dailyData = [
  { day: "Mon", scans: 420 },
  { day: "Tue", scans: 380 },
  { day: "Wed", scans: 510 },
  { day: "Thu", scans: 470 },
  { day: "Fri", scans: 620 },
  { day: "Sat", scans: 340 },
  { day: "Sun", scans: 290 },
];

const topCodes = [
  { name: "Product Launch Campaign", scans: 3421 },
  { name: "Event Check-In", scans: 1893 },
  { name: "WiFi Guest Access", scans: 842 },
  { name: "Menu QR Code", scans: 567 },
];

const topLocations = [
  { country: "United States", scans: 5120, flag: "🇺🇸" },
  { country: "Germany", scans: 2340, flag: "🇩🇪" },
  { country: "Japan", scans: 1890, flag: "🇯🇵" },
  { country: "United Kingdom", scans: 1456, flag: "🇬🇧" },
  { country: "Brazil", scans: 987, flag: "🇧🇷" },
];

const maxScans = Math.max(...dailyData.map((d) => d.scans));

export default function Analytics() {
  const location = useLocation();

  return (
    <div className="min-h-screen">
      <Header />
      <div className="flex pt-16">
        <aside className="hidden lg:flex flex-col w-[280px] border-r border-border p-6 min-h-[calc(100vh-4rem)] bg-card">
          <nav className="space-y-1 flex-1">
            {sidebarLinks.map((l) => (
              <Link key={l.to} to={l.to}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  location.pathname === l.to ? "bg-accent text-foreground" : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
                }`}>
                <l.icon className="w-4 h-4" />{l.label}
              </Link>
            ))}
          </nav>
          <Link to="/generator" className="flex items-center justify-center gap-2 bg-primary text-primary-foreground px-4 py-2.5 rounded-lg text-sm font-medium hover:opacity-90 btn-press">
            <Plus className="w-4 h-4" /> New QR Code
          </Link>
        </aside>

        <main className="flex-1 p-6 lg:p-10">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease }}>
            <h1 className="text-2xl font-semibold mb-1">Analytics</h1>
            <p className="text-sm text-muted-foreground mb-8">Track scan performance across all your QR codes.</p>

            {/* Overview Stats */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
              {overviewStats.map((s, i) => (
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
              ))}
            </div>

            <div className="grid lg:grid-cols-2 gap-6">
              {/* Bar Chart */}
              <div className="bg-card border border-border rounded-xl p-6">
                <h3 className="font-semibold mb-1">Weekly Scans</h3>
                <p className="text-xs text-muted-foreground mb-6">Last 7 days</p>
                <div className="flex items-end gap-3 h-40">
                  {dailyData.map((d) => (
                    <div key={d.day} className="flex-1 flex flex-col items-center gap-2">
                      <span className="text-xs font-mono tabular-nums text-muted-foreground">{d.scans}</span>
                      <motion.div
                        initial={{ height: 0 }}
                        animate={{ height: `${(d.scans / maxScans) * 100}%` }}
                        transition={{ duration: 0.6, ease, delay: 0.3 }}
                        className="w-full bg-primary/20 rounded-t-md relative overflow-hidden"
                      >
                        <div className="absolute inset-0 bg-primary/40 rounded-t-md" />
                      </motion.div>
                      <span className="text-xs text-muted-foreground">{d.day}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Top Codes */}
              <div className="bg-card border border-border rounded-xl p-6">
                <h3 className="font-semibold mb-1">Top QR Codes</h3>
                <p className="text-xs text-muted-foreground mb-6">By scan count</p>
                <div className="space-y-4">
                  {topCodes.map((c, i) => (
                    <div key={c.name} className="flex items-center gap-3">
                      <span className="font-mono text-xs text-muted-foreground w-5">{String(i + 1).padStart(2, "0")}</span>
                      <div className="flex-1">
                        <p className="text-sm font-medium mb-1">{c.name}</p>
                        <div className="w-full h-1.5 bg-accent rounded-full overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${(c.scans / topCodes[0].scans) * 100}%` }}
                            transition={{ duration: 0.6, ease, delay: 0.3 + i * 0.1 }}
                            className="h-full bg-primary rounded-full"
                          />
                        </div>
                      </div>
                      <span className="font-mono text-sm tabular-nums">{c.scans.toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Top Locations */}
              <div className="bg-card border border-border rounded-xl p-6 lg:col-span-2">
                <div className="flex items-center gap-2 mb-1">
                  <Globe className="w-4 h-4 text-muted-foreground" />
                  <h3 className="font-semibold">Scan Locations</h3>
                </div>
                <p className="text-xs text-muted-foreground mb-6">Top countries by scan volume</p>
                <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-4">
                  {topLocations.map((l, i) => (
                    <motion.div
                      key={l.country}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3, ease, delay: 0.4 + i * 0.05 }}
                      className="border border-border rounded-lg p-4 text-center"
                    >
                      <span className="text-2xl mb-2 block">{l.flag}</span>
                      <p className="text-sm font-medium">{l.country}</p>
                      <p className="font-mono text-sm tabular-nums text-muted-foreground">{l.scans.toLocaleString()}</p>
                    </motion.div>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        </main>
      </div>
    </div>
  );
}
