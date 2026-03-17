import { Link } from "react-router-dom";
import { QrCode, Github, Twitter } from "lucide-react";

export default function Footer() {
  return (
    <footer className="border-t border-border bg-card">
      <div className="container py-12 grid grid-cols-1 md:grid-cols-4 gap-8">
        <div className="md:col-span-1">
          <Link to="/" className="flex items-center gap-2 font-semibold text-lg tracking-tight mb-3">
            <div className="w-7 h-7 rounded-md bg-primary flex items-center justify-center">
              <QrCode className="w-4 h-4 text-primary-foreground" />
            </div>
            ScanovaX
          </Link>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Precision routing for the physical world. High-performance QR codes with integrated telemetry.
          </p>
        </div>

        <div>
          <h4 className="label-caps text-muted-foreground mb-4">Product</h4>
          <ul className="space-y-2.5 text-sm">
            <li><Link to="/generator" className="text-muted-foreground hover:text-foreground transition-colors">Generator</Link></li>
            <li><Link to="/pricing" className="text-muted-foreground hover:text-foreground transition-colors">Pricing</Link></li>
            <li><Link to="/dashboard" className="text-muted-foreground hover:text-foreground transition-colors">Dashboard</Link></li>
          </ul>
        </div>

        <div>
          <h4 className="label-caps text-muted-foreground mb-4">Resources</h4>
          <ul className="space-y-2.5 text-sm">
            <li><span className="text-muted-foreground">Documentation</span></li>
            <li><span className="text-muted-foreground">API Reference</span></li>
            <li><span className="text-muted-foreground">Changelog</span></li>
          </ul>
        </div>

        <div>
          <h4 className="label-caps text-muted-foreground mb-4">Connect</h4>
          <div className="flex gap-3">
            <a href="#" className="w-9 h-9 rounded-lg border border-border flex items-center justify-center text-muted-foreground hover:text-foreground hover:border-foreground/20 transition-colors">
              <Twitter className="w-4 h-4" />
            </a>
            <a href="#" className="w-9 h-9 rounded-lg border border-border flex items-center justify-center text-muted-foreground hover:text-foreground hover:border-foreground/20 transition-colors">
              <Github className="w-4 h-4" />
            </a>
          </div>
        </div>
      </div>

      <div className="container py-6 border-t border-border">
        <p className="text-xs text-muted-foreground">
          © 2026 ScanovaX. All rights reserved.
        </p>
      </div>
    </footer>
  );
}
