import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ArrowRight, BarChart3, Palette, Globe, Zap,
  Link as LinkIcon, ScanLine, Download, Check, X, Loader2
} from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { useAuth } from "@/context/AuthContext";
import { usePlan } from "@/hooks/usePlan";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { PlanType } from "@/lib/database.types";
import { useState } from "react";

const ease = [0.16, 1, 0.3, 1] as const;

function HeroSection() {
  const { isLoggedIn } = useAuth();
  const ctaDest = isLoggedIn ? "/dashboard/qr-generator" : "/login";

  return (
    <section className="section-padding pt-[25vh] pb-20">
      <div className="container flex flex-col items-center text-center">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease }}
          className="max-w-2xl"
        >
          <h1 className="text-5xl md:text-6xl lg:text-7xl font-semibold leading-[1.1] mb-6">
            ScanovaX
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground leading-relaxed mb-10 max-w-xl mx-auto">
            Create Smart QR Codes with Powerful Insights. Track every scan, customize every pixel, deploy in seconds.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              to={ctaDest}
              className="inline-flex items-center justify-center gap-2 bg-foreground text-background px-6 py-3 rounded-lg font-medium hover:opacity-90 btn-press"
            >
              Get Started <ArrowRight className="w-4 h-4" />
            </Link>
            <a
              href="#pricing"
              onClick={(e) => {
                e.preventDefault();
                document.getElementById("pricing")?.scrollIntoView({ behavior: "smooth" });
              }}
              className="inline-flex items-center justify-center gap-2 border border-border px-6 py-3 rounded-lg font-medium hover:bg-accent transition-colors btn-press cursor-pointer"
            >
              View Pricing
            </a>
          </div>

          <div className="flex items-center gap-6 mt-10 font-mono text-sm text-muted-foreground justify-center">
            <span className="tabular-nums">14,892 Scans</span>
            <span className="w-1 h-1 rounded-full bg-border" />
            <span className="tabular-nums">99.9% Uptime</span>
            <span className="w-1 h-1 rounded-full bg-border" />
            <span className="tabular-nums">12ms Redirect</span>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

const features = [
  { icon: Globe, title: "Multiple QR Types", desc: "URL, vCard, WiFi, Text, Social — all from one editor." },
  { icon: BarChart3, title: "Real-Time Analytics", desc: "Track scans, locations, devices, and trends instantly." },
  { icon: Palette, title: "Full Customization", desc: "Colors, logos, frames, and shapes. Make it yours." },
  { icon: Zap, title: "12ms Redirects", desc: "Edge-deployed routing for blazing-fast scan resolution." },
  { icon: ScanLine, title: "Dynamic QR Codes", desc: "Change destinations without reprinting. Ever." },
  { icon: Download, title: "Export Anywhere", desc: "Download PNG, SVG, or PDF. Print-ready at any size." },
];

function FeaturesSection() {
  return (
    <section id="features" className="section-padding bg-card border-y border-border">
      <div className="container">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, ease }}
          className="text-center mb-16"
        >
          <p className="label-caps text-primary mb-3">Features</p>
          <h2 className="text-3xl md:text-4xl font-semibold mb-4">
            Everything You Need to Deploy Smart Routing
          </h2>
          <p className="text-muted-foreground max-w-xl mx-auto">
            Professional-grade QR infrastructure with the analytics to match.
          </p>
        </motion.div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((f, i) => (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, ease, delay: i * 0.08 }}
              className="bg-background border border-border rounded-xl p-6 hover-lift group"
            >
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                <f.icon className="w-5 h-5 text-primary" />
              </div>
              <h3 className="font-semibold mb-2">{f.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

const steps = [
  { num: "01", title: "Paste Your Link", desc: "Enter any URL, text, or contact information." },
  { num: "02", title: "Customize Design", desc: "Pick colors, add your logo, choose a frame." },
  { num: "03", title: "Deploy & Track", desc: "Download or share. Watch scans roll in live." },
];

function HowItWorks() {
  return (
    <section className="section-padding">
      <div className="container">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, ease }}
          className="text-center mb-16"
        >
          <p className="label-caps text-primary mb-3">How It Works</p>
          <h2 className="text-3xl md:text-4xl font-semibold">Three Steps to Smart Routing</h2>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-8">
          {steps.map((s, i) => (
            <motion.div
              key={s.num}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, ease, delay: i * 0.1 }}
              className="text-center"
            >
              <span className="font-mono text-5xl font-semibold text-primary/20 block mb-4">{s.num}</span>
              <h3 className="font-semibold text-lg mb-2">{s.title}</h3>
              <p className="text-sm text-muted-foreground">{s.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

function PricingPreview() {
  const plans: { id: PlanType; name: string; price: string; period: string; features: any[]; cta: string; highlight: boolean }[] = [
    {
      id: "economic",
      name: "Economic",
      price: "₹399",
      period: "/mo",
      features: [
        { text: "Static QR codes only (non-editable)", included: true },
        { text: "Basic customization: Color, Shape", included: true },
        { text: "Frame & Error correction", included: false },
        { text: "QR download & share (no limit)", included: true },
        { text: "Limited scans (100/month)", included: true },
        { text: "No editing after creation", included: false },
        { text: "No analytics", included: false },
        { text: "No logo upload", included: false },
      ],
      cta: "Start Free Trial",
      highlight: false,
    },
    {
      id: "premium",
      name: "Premium",
      price: "₹599",
      period: "/mo",
      features: [
        { text: "Dynamic QR codes (editable)", included: true },
        { text: "Limited customization: Color, Shape", included: true },
        { text: "Frame & Error correction", included: false },
        { text: "QR download & share (no limit)", included: true },
        { text: "Logo upload enabled", included: true },
        { text: "Scan count visible (last 7 days)", included: true },
        { text: "Basic analytics (last 7 days only)", included: true },
        { text: "No full analytics", included: false },
        { text: "No advanced customization", included: false },
      ],
      cta: "Start Free Trial",
      highlight: true,
    },
    {
      id: "elegant",
      name: "Elegant",
      price: "₹899",
      period: "/mo",
      features: [
        { text: "Dynamic QR codes (editable)", included: true },
        { text: "Full customization: Color, Shape, Frame, Error correction", included: true },
        { text: "QR download & share (no limit)", included: true },
        { text: "Logo upload enabled", included: true },
        { text: "Full analytics dashboard", included: true },
        { text: "Total scans, Unique scans, Top QR codes", included: true },
        { text: "Scan location, Device type, Time-based insights", included: true },
        { text: "Unlimited scan history", included: true },
      ],
      cta: "Start Free Trial",
      highlight: false,
    },
  ];

  const { isLoggedIn, user } = useAuth();
  const { isTrial, isTrialExpired } = usePlan();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [isUpgrading, setIsUpgrading] = useState<PlanType | null>(null);

  const handleUpgrade = async (planKey: PlanType) => {
    if (!isLoggedIn) {
      navigate(`/register?trial=true`);
      return;
    }
    if (!user) return;
    
    setIsUpgrading(planKey);
    try {
      // @ts-ignore
      const { error } = await supabase
        .from('profiles')
        .update({ 
          plan: planKey, 
          trial_start_date: null, 
          trial_end_date: null 
        })
        .eq('id', user.id);
        
      if (error) throw error;
      
      await queryClient.invalidateQueries({ queryKey: ["profile"] });
      toast.success(`Successfully upgraded to ${plans.find(p => p.id === planKey)?.name} plan!`);
      navigate('/dashboard/profile');
    } catch (err: any) {
      toast.error("Failed to upgrade plan: " + err.message);
    } finally {
      setIsUpgrading(null);
    }
  };

  return (
    <section id="pricing" className="section-padding bg-card border-y border-border">
      <div className="container">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, ease }}
          className="text-center mb-16"
        >
          <p className="label-caps text-primary mb-3">Pricing</p>
          <h2 className="text-3xl md:text-4xl font-semibold mb-4">Simple, Transparent Pricing</h2>
          <p className="text-muted-foreground">Start a 3-day free trial on any plan. Cancel anytime.</p>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {plans.map((p, i) => (
            <motion.div
              key={p.name}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, ease, delay: i * 0.08 }}
              className={`rounded-xl p-6 border ${p.highlight
                  ? "border-primary bg-background shadow-lg shadow-primary/5 relative"
                  : "border-border bg-background"
                }`}
            >
              {p.highlight && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground text-xs font-medium px-3 py-1 rounded-full">
                  Recommended
                </span>
              )}
              <h3 className="font-semibold text-lg mb-1">{p.name}</h3>
              <div className="flex items-baseline gap-1 mb-5">
                <span className="text-3xl font-semibold tabular-nums">{p.price}</span>
                <span className="text-sm text-muted-foreground">{p.period}</span>
              </div>
              <ul className="space-y-2.5 mb-6">
                {p.features.map((f, idx) => (
                  <li key={idx} className="flex items-center gap-2 text-sm text-muted-foreground">
                    {f.included ? (
                      <Check className="w-4 h-4 text-primary shrink-0" />
                    ) : (
                      <X className="w-4 h-4 text-muted-foreground/50 shrink-0" />
                    )}
                    <span className={f.included ? "" : "text-muted-foreground/50 line-through"}>
                      {f.text}
                    </span>
                  </li>
                ))}
              </ul>
              <button
                onClick={() => handleUpgrade(p.id)}
                disabled={isUpgrading !== null}
                className={`w-full inline-flex items-center justify-center px-5 py-2.5 rounded-lg text-sm font-medium btn-press transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${p.highlight
                    ? "bg-foreground text-background hover:opacity-90"
                    : "border border-border hover:bg-accent"
                  }`}
              >
                {isUpgrading === p.id ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                {!isLoggedIn ? "Start Free Trial" : `Upgrade to ${p.name}`}
              </button>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

function CTASection() {
  const { isLoggedIn } = useAuth();
  const ctaDest = isLoggedIn ? "/dashboard/qr-generator" : "/login";

  return (
    <section className="section-padding">
      <div className="container">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, ease }}
          className="text-center max-w-2xl mx-auto"
        >
          <h2 className="text-3xl md:text-4xl font-semibold mb-4">
            Ready to Deploy Smart Routing?
          </h2>
          <p className="text-muted-foreground mb-8">
            Join thousands of teams using ScanovaX to bridge physical and digital experiences.
          </p>
          <Link
            to={ctaDest}
            className="inline-flex items-center gap-2 bg-foreground text-background px-8 py-3.5 rounded-lg font-medium hover:opacity-90 btn-press text-base"
          >
            Create Your First QR <ArrowRight className="w-4 h-4" />
          </Link>
        </motion.div>
      </div>
    </section>
  );
}

export default function Index() {
  return (
    <div className="min-h-screen">
      <Header />
      <HeroSection />
      <FeaturesSection />
      <HowItWorks />
      <PricingPreview />
      <CTASection />
      <Footer />
    </div>
  );
}
