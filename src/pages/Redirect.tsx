import { useEffect, useState, useRef } from "react";
import { useParams } from "react-router-dom";
import { motion } from "framer-motion";
import { supabase } from "@/lib/supabase";
import { Loader2, User, Mail, Phone, ArrowRight, ShieldCheck } from "lucide-react";
import { toast } from "sonner";

export default function Redirect() {
  const { qrId } = useParams();
  const [error, setError] = useState<string | null>(null);
  const [qrData, setQrData] = useState<any>(null);
  const [showForm, setShowForm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [leadData, setLeadData] = useState({ name: "", email: "", phone: "" });
  const [geoInfo, setGeoInfo] = useState<any>(null);
  const processed = useRef(false);

  useEffect(() => {
    async function init() {
      if (!qrId || processed.current) return;
      processed.current = true;

      try {
        console.log("Analytics Initialization: Fetching QR Data...");
        // 1. Fetch QR metadata
        const { data: qr, error: qrError } = await (supabase as any)
          .from("qr_codes")
          .select("*")
          .eq("id", qrId)
          .maybeSingle();

        if (qrError || !qr) {
          setError("QR code not found or has been deleted.");
          return;
        }

        setQrData(qr);

        // 2. Gather Environment Data
        const userAgent = navigator.userAgent;
        const isBot = /bot|crawler|spider|facebook|whatsapp|preview|link|slurp|bing|google|twitter/i.test(userAgent) || (navigator as any).webdriver;
        
        if (isBot) {
          console.log("Bot detected, skipping analytics capture.");
        } else {
          // De-duplication check for smoother testing (2s interval)
          const lastScanTime = localStorage.getItem(`last_scan_${qrId}`);
          const now = Date.now();
          
          if (lastScanTime && (now - parseInt(lastScanTime)) < 2000) {
            console.log("Repeated scan detected within 2s, skipping analytics increment.");
          } else {
            localStorage.setItem(`last_scan_${qrId}`, now.toString());

            // 1. Get User/Device Identification for Uniqueness 
            // We use a combination of persistent localStorage ID + IP + Agent
            let deviceId = localStorage.getItem('scanovax_device_id');
            if (!deviceId) {
              deviceId = crypto.randomUUID();
              localStorage.setItem('scanovax_device_id', deviceId);
            }
            const deviceIdentifier = `${deviceId}-${userAgent}`;
            
            // 2. Resolve Geo Data (IP, Country, City)
            // This is done via an external API to ensure accuracy regardless of server-side proxying
            let geo = { ip: "Unknown", country_name: "Unknown", region: "Unknown", city: "Unknown" };
            try {
              const geoRes = await fetch("https://ipapi.co/json/");
              if (geoRes.ok) {
                geo = await geoRes.json();
                setGeoInfo(geo);
              }
            } catch (e) { console.error("Geo-IP capture failed:", e); }

            // 4. Atomic Scan Increment (Total + Unique log)
            const deviceType = /Mobi|Android|iPhone/i.test(userAgent) ? "mobile" : "desktop";
            // Logic: persistent device identifier is the source of truth for "Unique" users

            console.log("Recording atomic scan...");
            const { error: rpcError } = await (supabase as any).rpc('increment_scan', {
              target_qr_id: qrId,
              scanner_email: null,
              device_type: deviceType,
              country: geo.country_name,
              state: geo.region,
              city: geo.city,
              ip_address: geo.ip,
              user_identifier: deviceIdentifier
            });

            if (rpcError) console.error("Analytics RPC Failure:", rpcError);
          }
        }

        // 5. Redirection Logic
        if (qr.lead_capture_enabled) {
          console.log("Lead Capture Enabled: Intercepting Redirection.");
          setShowForm(true);
        } else {
          console.log("Standard Redirect: Proceeding to destination.");
          // Small delay for tracking to settle
          setTimeout(() => {
            performRedirect(qr);
          }, 600);
        }

      } catch (err: any) {
        setError("Error processing scan: " + err.message);
      }
    }

    init();
  }, [qrId]);

  const performRedirect = (data: any) => {
    if (!data) return;
    
    if (["url", "video", "app", "social"].includes(data.type)) {
      let target = data.content;
      if (!target.startsWith("http://") && !target.startsWith("https://")) {
        target = "https://" + target;
      }
      window.location.replace(target);
    } else if (data.type === "text") {
      document.body.innerHTML = `<div style="padding: 2rem; font-family: sans-serif; text-align: center; max-width: 600px; margin: 0 auto; margin-top: 20vh; background: #f8f9fa; border-radius: 12px; border: 1px solid #e5e7eb;">
        <p style="font-size: 1.25rem; line-height: 1.6; color: #111827; margin-bottom: 2rem;">${data.content}</p>
        <button onclick="window.close()" style="padding: 10px 20px; background: #0f172a; color: white; border: none; border-radius: 6px; cursor: pointer;">Close Window</button>
      </div>`;
    } else {
      window.location.replace(data.content);
    }
  };

  const handleLeadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!leadData.name || !leadData.email) {
      toast.error("Please fill in all required fields.");
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(leadData.email)) {
      toast.error("Please enter a valid email address.");
      return;
    }

    setIsSubmitting(true);
    try {
      const userAgent = navigator.userAgent;
      const deviceType = /Mobi|Android|iPhone/i.test(userAgent) ? "mobile" : "desktop";

      console.log("Saving Lead Capture Metadata...");
      const { error: leadError } = await (supabase as any)
        .from("lead_captures")
        .insert({
          qr_code_id: qrId,
          name: leadData.name,
          email: leadData.email,
          phone: leadData.phone,
          city: geoInfo?.city || "Unknown",
          country: geoInfo?.country_name || "Unknown",
          device_type: deviceType,
          ip_address: geoInfo?.ip || "Unknown",
          user_id: qrData.user_id
        });

      if (leadError) throw leadError;

      toast.success("Connection secured! Redirecting...");
      
      setTimeout(() => {
        performRedirect(qrData);
      }, 800);

    } catch (err: any) {
      toast.error("Process failed: " + err.message);
      setIsSubmitting(false);
    }
  };

  if (showForm && qrData) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-background via-accent/5 to-background font-sans">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          className="max-w-md w-full bg-card border border-border rounded-3xl p-8 shadow-2xl relative overflow-hidden"
        >
          <div className="absolute -top-24 -right-24 w-48 h-48 bg-primary/10 rounded-full blur-3xl" />
          <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-primary/5 rounded-full blur-3xl" />

          <div className="relative z-10 text-center">
            <div className="w-20 h-20 bg-primary/10 rounded-3xl flex items-center justify-center mb-6 mx-auto">
              <ShieldCheck className="w-10 h-10 text-primary" />
            </div>
            
            <h2 className="text-2xl font-bold tracking-tight mb-2">Connect to Proceed</h2>
            <p className="text-muted-foreground text-sm mb-8 px-4">
              Please provide your contact details to safely access the QR destination.
            </p>

            <form onSubmit={handleLeadSubmit} className="space-y-5 text-left">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] ml-1">Full Identity</label>
                <div className="relative block">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/60" />
                  <input
                    required
                    type="text"
                    placeholder="Enter full name"
                    value={leadData.name}
                    onChange={(e) => setLeadData({ ...leadData, name: e.target.value })}
                    className="w-full bg-accent/30 border border-border rounded-2xl pl-10 pr-4 py-3.5 text-sm focus:ring-2 focus:ring-primary/20 outline-none transition-all placeholder:text-muted-foreground/40"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] ml-1">Email Gateway</label>
                <div className="relative block">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/60" />
                  <input
                    required
                    type="email"
                    placeholder="example@mail.com"
                    value={leadData.email}
                    onChange={(e) => setLeadData({ ...leadData, email: e.target.value })}
                    className="w-full bg-accent/30 border border-border rounded-2xl pl-10 pr-4 py-3.5 text-sm focus:ring-2 focus:ring-primary/20 outline-none transition-all placeholder:text-muted-foreground/40"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] ml-1">Phone (Optional)</label>
                <div className="relative block">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/60" />
                  <input
                    type="tel"
                    placeholder="+00 000 0000"
                    value={leadData.phone}
                    onChange={(e) => setLeadData({ ...leadData, phone: e.target.value })}
                    className="w-full bg-accent/30 border border-border rounded-2xl pl-10 pr-4 py-3.5 text-sm focus:ring-2 focus:ring-primary/20 outline-none transition-all placeholder:text-muted-foreground/40"
                  />
                </div>
              </div>

              <button
                disabled={isSubmitting}
                className="w-full bg-primary text-primary-foreground py-4 rounded-2xl font-black uppercase tracking-widest text-xs flex items-center justify-center gap-3 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 mt-6 shadow-xl shadow-primary/20"
              >
                {isSubmitting ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <>Continue <ArrowRight className="w-5 h-5" /></>
                )}
              </button>

              <div className="flex items-center justify-center gap-2 pt-6">
                <div className="w-6 h-[1px] bg-border" />
                <p className="text-[9px] text-muted-foreground font-black uppercase tracking-[0.3em]">Identity Secure</p>
                <div className="w-6 h-[1px] bg-border" />
              </div>
            </form>
          </div>
        </motion.div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 text-center font-sans">
        <div className="max-w-md w-full bg-destructive/5 border border-destructive/20 rounded-3xl p-10">
          <div className="w-16 h-16 bg-destructive/10 rounded-2xl flex items-center justify-center mb-6 mx-auto">
            <ShieldCheck className="w-8 h-8 text-destructive rotate-180" />
          </div>
          <h2 className="text-xl font-bold text-foreground mb-4 italic">Security Intercept</h2>
          <p className="text-muted-foreground text-sm leading-relaxed mb-6">{error}</p>
          <button 
            onClick={() => window.location.reload()}
            className="px-6 py-2 bg-foreground text-background rounded-full text-xs font-bold uppercase tracking-widest hover:opacity-90 transition-opacity"
          >
            Retry Protocol
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-background font-sans">
      <div className="relative w-12 h-12 mb-8">
        <div className="absolute inset-0 border-4 border-primary/20 rounded-full" />
        <div className="absolute inset-0 border-4 border-primary rounded-full border-t-transparent animate-spin" />
      </div>
      <p className="text-[10px] font-black uppercase tracking-[0.4em] text-muted-foreground animate-pulse">Syncing Analytics...</p>
    </div>
  );
}
