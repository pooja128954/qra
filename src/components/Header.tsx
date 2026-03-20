import { Link, useNavigate } from "react-router-dom";
import { QrCode, Menu, X } from "lucide-react";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/context/AuthContext";

const ease = [0.16, 1, 0.3, 1] as const;

export default function Header() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { isLoggedIn } = useAuth();
  const navigate = useNavigate();

  const createQrDest = isLoggedIn ? "/dashboard/qr-generator" : "/login";

  const handleFeaturesClick = (e: React.MouseEvent) => {
    e.preventDefault();
    setMobileOpen(false);
    if (window.location.pathname !== "/") {
      navigate("/");
      setTimeout(() => {
        document.getElementById("features")?.scrollIntoView({ behavior: "smooth" });
      }, 100);
    } else {
      document.getElementById("features")?.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 glass-panel border-b">
      <div className="container flex items-center justify-between h-16">
        <Link to="/" className="flex items-center gap-2 font-semibold text-lg tracking-tight">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
            <QrCode className="w-5 h-5 text-primary-foreground" />
          </div>
          ScanovaX
        </Link>

        <nav className="hidden md:flex items-center gap-8">
          <Link to="/" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Home</Link>
          <a href="/#features" onClick={handleFeaturesClick} className="text-sm text-muted-foreground hover:text-foreground transition-colors">Features</a>
          <Link to="/pricing" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Pricing</Link>
        </nav>

        <div className="hidden md:flex items-center gap-3">
          {isLoggedIn ? (
            <Link
              to="/dashboard/qr-generator"
              className="inline-flex items-center gap-2 bg-foreground text-background px-5 py-2.5 rounded-lg text-sm font-medium hover:opacity-90 btn-press"
            >
              Dashboard
            </Link>
          ) : (
            <>
              <Link to="/login" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">Login</Link>
              <Link to={createQrDest} className="inline-flex items-center gap-2 bg-foreground text-background px-5 py-2.5 rounded-lg text-sm font-medium hover:opacity-90 btn-press">Create QR</Link>
            </>
          )}
        </div>

        <button className="md:hidden p-2" onClick={() => setMobileOpen(!mobileOpen)}>
          {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="md:hidden overflow-hidden border-t border-border bg-card"
          >
            <div className="container py-4 flex flex-col gap-3">
              <Link to="/" className="text-sm py-2" onClick={() => setMobileOpen(false)}>Home</Link>
              <a href="/#features" className="text-sm py-2" onClick={handleFeaturesClick}>Features</a>
              <Link to="/pricing" className="text-sm py-2" onClick={() => setMobileOpen(false)}>Pricing</Link>
              {isLoggedIn ? (
                <Link to="/dashboard/qr-generator" className="inline-flex items-center justify-center bg-foreground text-background px-5 py-2.5 rounded-lg text-sm font-medium btn-press" onClick={() => setMobileOpen(false)}>Dashboard</Link>
              ) : (
                <>
                  <Link to="/login" className="text-sm py-2" onClick={() => setMobileOpen(false)}>Login</Link>
                  <Link to="/login" className="inline-flex items-center justify-center bg-foreground text-background px-5 py-2.5 rounded-lg text-sm font-medium btn-press" onClick={() => setMobileOpen(false)}>Create QR</Link>
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
