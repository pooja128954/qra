import { useEffect, useState, useRef } from "react";
import { useParams } from "react-router-dom";
import { motion } from "framer-motion";
import { supabase } from "@/lib/supabase";
import { Loader2, User, Mail, Phone, ArrowRight, ShieldCheck } from "lucide-react";
import { toast } from "sonner";

export default function Redirect() {
  const { qrId } = useParams();
  const [error, setError] = useState<string | null>(null);
  const processed = useRef(false);

  useEffect(() => {
    async function processRedirect() {
      if (!qrId || processed.current) return;
      processed.current = true;

      if (!qrId) {
        setError("Invalid QR Code Link");
        return;
      }

      try {
        // 1. Fetch QR code destination
        console.log("Fetching QR data for ID:", qrId);
        const { data, error: qrError } = await supabase
          .from("qr_codes")
          .select("content, type, user_id, status, lead_capture_enabled")
          .eq("id", qrId)
          .maybeSingle();

        if (qrError) {
          console.error("Supabase Query Error:", qrError);
          setError(`Database Error: ${qrError.message}`);
          return;
        }

        const qrData = data as any;
        console.log("Retrieved QR Data:", qrData);

        if (qrError || !qrData) {
          setError("QR code not found or has been deleted.");
          return;
        }

        // 2. Gather Analytics
        try {
          const userAgent = navigator.userAgent;
          const isBot = /bot|crawler|spider|facebook|whatsapp|preview|link|slurp|bing|google|twitter/i.test(userAgent) || (navigator as any).webdriver;
          
          if (isBot) {
            console.log("Bot/Preview hit detected, skipping analytics:", userAgent);
          } else {
            // Check localStorage to prevent double-fire across refreshes/re-mounts
            const storageKey = `scan_attempted_${qrId}_${Date.now()}`;
            const lastScanTime = localStorage.getItem(`last_scan_${qrId}`);
            const now = Date.now();

            if (lastScanTime && (now - parseInt(lastScanTime)) < 2000) {
              console.log("Recently scanned (within 2s), skip analytics increment.");
            } else {
              localStorage.setItem(`last_scan_${qrId}`, now.toString());
              localStorage.setItem(storageKey, 'true'); // Mark this specific attempt
              
              const deviceType = /Mobi|Android|iPhone/i.test(userAgent) ? "mobile" : "desktop";

              // Try to get authenticated user email
              const { data: { user: scannerUser } } = await supabase.auth.getUser();
              const scannerEmail = scannerUser?.email || null;

              let country = "Unknown";
              let region = "Unknown";
              let city = "Unknown";
              let ipAddress = "Unknown";

              try {
                const geoRes = await fetch("https://ipapi.co/json/");
                if (geoRes.ok) {
                  const geo = await geoRes.json();
                  country = geo.country_name || "Unknown";
                  region = geo.region || "Unknown";
                  city = geo.city || "Unknown";
                  ipAddress = geo.ip || "Unknown";
                }
              } catch (e) {
                console.error("Geo IP failed", e);
              }

              // Unique User Identifier: Logged-in ID or fallback (IP + UA)
              const userIdentifier = scannerUser?.id || `${ipAddress}-${userAgent}`;

              // Use RPC to increment scan atomically and record event
              // @ts-ignore
              const { error: rpcError } = await supabase.rpc('increment_scan', {
                target_qr_id: qrId,
                scanner_email: scannerEmail,
                device_type: deviceType,
                country: country,
                state: region,
                city: city,
                ip_address: ipAddress,
                user_identifier: userIdentifier
              });

              if (rpcError) {
                console.error("RPC Error:", rpcError);
              }

              // Small delay to ensure DB transaction is finalized before navigation
              await new Promise(resolve => setTimeout(resolve, 500));
            }
          }
        } catch (analyticsError) {
          console.error("Analytics Recording Failed:", analyticsError);
        }

        // 3. Handle specific types
        if (qrData.type === "url" || qrData.type === "video" || qrData.type === "app" || qrData.type === "social") {
          let target = qrData.content;
          if (!target.startsWith("http://") && !target.startsWith("https://")) {
            target = "https://" + target;
          }
          window.location.replace(target);
        } else if (qrData.type === "text") {
          // Simple display for text
          const content = qrData.content;
          document.body.innerHTML = `<div style="padding: 2rem; font-family: sans-serif; text-align: center; max-width: 600px; margin: 0 auto; margin-top: 20vh; background: #f8f9fa; border-radius: 12px; border: 1px solid #e5e7eb;">
            <p style="font-size: 1.25rem; line-height: 1.6; color: #111827; margin-bottom: 2rem;">${content}</p>
            <button onclick="window.close()" style="padding: 10px 20px; background: #0f172a; color: white; border: none; border-radius: 6px; cursor: pointer;">Close Window</button>
          </div>`;
        } else {
          // Default fallback
          window.location.replace(qrData.content);
        }

      } catch (err: any) {
        setError("Error processing redirect: " + err.message);
      }
    }

    processRedirect();
  }, [qrId]);

  const [showForm, setShowForm] = useState(false);
  const [qrData, setQrData] = useState<any>(null);
  const [leadData, setLeadData] = useState({ name: "", email: "", phone: "" });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [geoInfo, setGeoInfo] = useState<any>(null);

  useEffect(() => {
    async function init() {
      if (!qrId) return;
      const { data } = await (supabase as any).from("qr_codes").select("*").eq("id", qrId).maybeSingle();
      if (data) {
        setQrData(data);
        if (data.lead_capture_enabled) {
          setShowForm(true);
          // Pre-fetch geo info for the lead capture
          try {
            const geoRes = await fetch("https://ipapi.co/json/");
            if (geoRes.ok) setGeoInfo(await geoRes.json());
          } catch (e) { console.error("Geo fetch failed", e); }
        }
      }
    }
    init();
  }, [qrId]);

  const handleLeadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!leadData.name || !leadData.email) {
      toast.error("Please fill in all required fields.");
      return;
    }

    // Basic Validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(leadData.email)) {
      toast.error("Please enter a valid email address.");
      return;
    }

    setIsSubmitting(true);
    try {
      const userAgent = navigator.userAgent;
      const deviceType = /Mobi|Android|iPhone/i.test(userAgent) ? "mobile" : "desktop";

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

      toast.success("Details saved! Redirecting...");
      
      // Perform the actual redirect
      let target = qrData.content;
      if (["url", "video", "app", "social"].includes(qrData.type) && !target.startsWith("http")) {
        target = "https://" + target;
      }
      
      setTimeout(() => {
        window.location.replace(target);
      }, 1000);

    } catch (err: any) {
      toast.error("Failed to save details: " + err.message);
      setIsSubmitting(false);
    }
  };

  if (showForm && qrData) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-background via-accent/5 to-background">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-md w-full bg-card border border-border rounded-3xl p-8 shadow-2xl relative overflow-hidden"
        >
          {/* Decorative elements */}
          <div className="absolute -top-24 -right-24 w-48 h-48 bg-primary/10 rounded-full blur-3xl" />
          <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-primary/5 rounded-full blur-3xl" />

          <div className="relative z-10">
            <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mb-6 mx-auto">
              <ShieldCheck className="w-8 h-8 text-primary" />
            </div>
            
            <h2 className="text-2xl font-bold text-center mb-2">Connect to Proceed</h2>
            <p className="text-muted-foreground text-center text-sm mb-8">
              Please provide your details to access the destination.
            </p>

            <form onSubmit={handleLeadSubmit} className="space-y-5">
              <div className="space-y-2">
                <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest ml-1">Full Name</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <input
                    required
                    type="text"
                    placeholder="John Doe"
                    value={leadData.name}
                    onChange={(e) => setLeadData({ ...leadData, name: e.target.value })}
                    className="w-full bg-accent/30 border border-border rounded-xl pl-10 pr-4 py-3 text-sm focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest ml-1">Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <input
                    required
                    type="email"
                    placeholder="john@example.com"
                    value={leadData.email}
                    onChange={(e) => setLeadData({ ...leadData, email: e.target.value })}
                    className="w-full bg-accent/30 border border-border rounded-xl pl-10 pr-4 py-3 text-sm focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest ml-1">Phone Number (Optional)</label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <input
                    type="tel"
                    placeholder="+1 (555) 000-0000"
                    value={leadData.phone}
                    onChange={(e) => setLeadData({ ...leadData, phone: e.target.value })}
                    className="w-full bg-accent/30 border border-border rounded-xl pl-10 pr-4 py-3 text-sm focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                  />
                </div>
              </div>

              <button
                disabled={isSubmitting}
                className="w-full bg-primary text-primary-foreground py-4 rounded-xl font-bold flex items-center justify-center gap-2 hover:opacity-90 transition-opacity disabled:opacity-50 mt-4 shadow-lg shadow-primary/20"
              >
                {isSubmitting ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <>Continue <ArrowRight className="w-5 h-5" /></>
                )}
              </button>

              <div className="flex items-center justify-center gap-2 pt-4">
                <ShieldCheck className="w-3 h-3 text-muted-foreground" />
                <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-widest">Your details are safe and secure</p>
              </div>
            </form>
          </div>
        </motion.div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 text-center">
        <div className="max-w-md w-full bg-destructive/10 border border-destructive/20 rounded-xl p-6">
          <h2 className="text-xl font-semibold text-destructive mb-2">Oops!</h2>
          <p className="text-destructive/80">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4">
      <Loader2 className="w-8 h-8 text-primary animate-spin mb-4" />
      <p className="text-muted-foreground font-medium animate-pulse">Routing to destination...</p>
    </div>
  );
}
