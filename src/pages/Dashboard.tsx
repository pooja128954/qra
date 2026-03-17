import { Link, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import {
  LayoutDashboard, QrCode, BarChart3, FolderOpen,
  ChevronRight, Scan, Activity, Plus
} from "lucide-react";
import Header from "@/components/Header";

const ease = [0.16, 1, 0.3, 1] as const;

const sidebarLinks = [
  { label: "Dashboard", to: "/dashboard", icon: LayoutDashboard },
  { label: "My QR Codes", to: "/dashboard/codes", icon: FolderOpen },
  { label: "Analytics", to: "/dashboard/analytics", icon: BarChart3 },
];

const stats = [
  { label: "Total QR Codes", value: "24", icon: QrCode, change: "+3 this week" },
  { label: "Total Scans", value: "14,892", icon: Scan, change: "+842 today" },
  { label: "Active Codes", value: "18", icon: Activity, change: "75% active" },
];

const recentCodes = [
  { name: "Product Launch Campaign", type: "URL", scans: 3421, created: "Mar 12, 2026", status: "active" },
  { name: "Event Check-In", type: "vCard", scans: 1893, created: "Mar 10, 2026", status: "active" },
  { name: "WiFi Guest Access", type: "WiFi", scans: 842, created: "Mar 8, 2026", status: "active" },
  { name: "Menu QR Code", type: "URL", scans: 567, created: "Mar 5, 2026", status: "paused" },
  { name: "Social Profile Card", type: "Social", scans: 234, created: "Mar 1, 2026", status: "active" },
];

export default function Dashboard() {
  const location = useLocation();

  return (
    <div className="min-h-screen">
      <Header />
      <div className="flex pt-16">
        {/* Sidebar */}
        <aside className="hidden lg:flex flex-col w-[280px] border-r border-border p-6 min-h-[calc(100vh-4rem)] bg-card">
          <nav className="space-y-1 flex-1">
            {sidebarLinks.map((l) => (
              <Link
                key={l.to}
                to={l.to}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  location.pathname === l.to
                    ? "bg-accent text-foreground"
                    : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
                }`}
              >
                <l.icon className="w-4 h-4" />
                {l.label}
              </Link>
            ))}
          </nav>
          <Link
            to="/generator"
            className="flex items-center justify-center gap-2 bg-primary text-primary-foreground px-4 py-2.5 rounded-lg text-sm font-medium hover:opacity-90 btn-press"
          >
            <Plus className="w-4 h-4" /> New QR Code
          </Link>
        </aside>

        {/* Main */}
        <main className="flex-1 p-6 lg:p-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease }}
          >
            <div className="flex items-center justify-between mb-8">
              <div>
                <h1 className="text-2xl font-semibold mb-1">Dashboard</h1>
                <p className="text-sm text-muted-foreground">Welcome back. Here's your overview.</p>
              </div>
              <Link
                to="/generator"
                className="hidden sm:inline-flex items-center gap-2 bg-foreground text-background px-5 py-2.5 rounded-lg text-sm font-medium hover:opacity-90 btn-press"
              >
                <Plus className="w-4 h-4" /> Create QR
              </Link>
            </div>

            {/* Stats */}
            <div className="grid sm:grid-cols-3 gap-4 mb-10">
              {stats.map((s, i) => (
                <motion.div
                  key={s.label}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, ease, delay: i * 0.08 }}
                  className="bg-card border border-border rounded-xl p-5 hover-lift"
                >
                  <div className="flex items-center justify-between mb-3">
                    <span className="label-caps text-muted-foreground">{s.label}</span>
                    <s.icon className="w-4 h-4 text-muted-foreground" />
                  </div>
                  <p className="text-2xl font-semibold tabular-nums mb-1">{s.value}</p>
                  <p className="text-xs text-muted-foreground font-mono">{s.change}</p>
                </motion.div>
              ))}
            </div>

            {/* Recent QR Codes */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-semibold">Recent QR Codes</h2>
                <Link to="/dashboard/codes" className="text-sm text-primary hover:underline flex items-center gap-1">
                  View all <ChevronRight className="w-3 h-3" />
                </Link>
              </div>
              <div className="bg-card border border-border rounded-xl overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border">
                        <th className="text-left py-3 px-4 label-caps text-muted-foreground font-medium">Name</th>
                        <th className="text-left py-3 px-4 label-caps text-muted-foreground font-medium">Type</th>
                        <th className="text-left py-3 px-4 label-caps text-muted-foreground font-medium">Scans</th>
                        <th className="text-left py-3 px-4 label-caps text-muted-foreground font-medium">Created</th>
                        <th className="text-left py-3 px-4 label-caps text-muted-foreground font-medium">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {recentCodes.map((c, i) => (
                        <motion.tr
                          key={c.name}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ delay: i * 0.05 }}
                          className="border-b border-border last:border-0 hover:bg-accent/30 transition-colors cursor-pointer"
                        >
                          <td className="py-3 px-4 font-medium">{c.name}</td>
                          <td className="py-3 px-4 text-muted-foreground font-mono text-xs">{c.type}</td>
                          <td className="py-3 px-4 tabular-nums">{c.scans.toLocaleString()}</td>
                          <td className="py-3 px-4 text-muted-foreground">{c.created}</td>
                          <td className="py-3 px-4">
                            <span className={`inline-flex items-center gap-1.5 text-xs font-medium px-2 py-0.5 rounded-full ${
                              c.status === "active"
                                ? "bg-success/10 text-success"
                                : "bg-muted text-muted-foreground"
                            }`}>
                              <span className={`w-1.5 h-1.5 rounded-full ${c.status === "active" ? "bg-success" : "bg-muted-foreground"}`} />
                              {c.status}
                            </span>
                          </td>
                        </motion.tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </motion.div>
        </main>
      </div>
    </div>
  );
}
