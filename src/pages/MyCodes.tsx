import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Plus, Download, Trash2, BarChart, Pencil, QrCode } from "lucide-react";
import DashboardLayout from "@/components/DashboardLayout";

const ease = [0.16, 1, 0.3, 1] as const;

const codes = [
  { name: "Product Launch Campaign", type: "URL", scans: 3421, created: "Mar 12, 2026", status: "active", url: "https://launch.acme.com" },
  { name: "Event Check-In", type: "vCard", scans: 1893, created: "Mar 10, 2026", status: "active", url: "John Doe Contact" },
  { name: "WiFi Guest Access", type: "WiFi", scans: 842, created: "Mar 8, 2026", status: "active", url: "SSID: Acme-Guest" },
  { name: "Menu QR Code", type: "URL", scans: 567, created: "Mar 5, 2026", status: "paused", url: "https://menu.acme.com" },
  { name: "Social Profile Card", type: "Social", scans: 234, created: "Mar 1, 2026", status: "active", url: "@acme_official" },
  { name: "App Download Link", type: "App", scans: 189, created: "Feb 28, 2026", status: "active", url: "https://apps.apple.com/acme" },
];

export default function MyCodes() {
  return (
    <DashboardLayout>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease }}>
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-semibold mb-1">My QR Codes</h1>
            <p className="text-sm text-muted-foreground">{codes.length} codes total</p>
          </div>
          <Link to="/dashboard/qr-generator" className="inline-flex items-center gap-2 bg-foreground text-background px-5 py-2.5 rounded-lg text-sm font-medium hover:opacity-90 btn-press">
            <Plus className="w-4 h-4" /> Create QR
          </Link>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {codes.map((c, i) => (
            <motion.div
              key={c.name}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, ease, delay: i * 0.06 }}
              className="bg-card border border-border rounded-xl p-5 hover-lift group"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="w-10 h-10 rounded-lg bg-accent flex items-center justify-center">
                  <QrCode className="w-5 h-5 text-muted-foreground" />
                </div>
                <span className={`inline-flex items-center gap-1.5 text-xs font-medium px-2 py-0.5 rounded-full ${
                  c.status === "active" ? "bg-success/10 text-success" : "bg-muted text-muted-foreground"
                }`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${c.status === "active" ? "bg-success" : "bg-muted-foreground"}`} />
                  {c.status}
                </span>
              </div>

              <h3 className="font-semibold text-sm mb-1 truncate">{c.name}</h3>
              <p className="text-xs text-muted-foreground font-mono mb-1">{c.type} · {c.url}</p>
              <p className="text-xs text-muted-foreground mb-4">{c.created}</p>

              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold tabular-nums">{c.scans.toLocaleString()} scans</span>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button className="p-1.5 rounded-md hover:bg-accent transition-colors" title="Edit"><Pencil className="w-3.5 h-3.5" /></button>
                  <button className="p-1.5 rounded-md hover:bg-accent transition-colors" title="Download"><Download className="w-3.5 h-3.5" /></button>
                  <button className="p-1.5 rounded-md hover:bg-accent transition-colors" title="Analytics"><BarChart className="w-3.5 h-3.5" /></button>
                  <button className="p-1.5 rounded-md hover:bg-destructive/10 text-destructive transition-colors" title="Delete"><Trash2 className="w-3.5 h-3.5" /></button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </DashboardLayout>
  );
}
