import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Check } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

const ease = [0.16, 1, 0.3, 1] as const;

const plans = [
  {
    name: "Free",
    price: "$0",
    period: "/mo",
    desc: "For personal projects and testing.",
    features: ["5 QR Codes", "100 Scans/month", "Basic Analytics", "PNG Export", "Standard Support"],
    cta: "Get Started Free",
    highlight: false,
  },
  {
    name: "Pro",
    price: "$7",
    period: "/mo",
    desc: "For marketers and growing teams.",
    features: ["Unlimited QR Codes", "Unlimited Scans", "Advanced Analytics", "All Export Formats", "Custom Branding", "Dynamic QR Codes", "Priority Support"],
    cta: "Start Pro Trial",
    highlight: true,
  },
  {
    name: "Enterprise",
    price: "Custom",
    period: "",
    desc: "For organizations at scale.",
    features: ["Everything in Pro", "SSO & Team Management", "Full API Access", "SLA Guarantee", "Dedicated Account Manager", "Custom Integrations", "On-Premise Option"],
    cta: "Contact Sales",
    highlight: false,
  },
];

export default function Pricing() {
  return (
    <div className="min-h-screen">
      <Header />
      <section className="section-padding pt-[20vh]">
        <div className="container">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease }}
            className="text-center mb-16"
          >
            <p className="label-caps text-primary mb-3">Pricing</p>
            <h1 className="text-4xl md:text-5xl font-semibold mb-4">Simple, Transparent Pricing</h1>
            <p className="text-lg text-muted-foreground max-w-xl mx-auto">
              Start free. Upgrade when you need more power. No hidden fees.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {plans.map((p, i) => (
              <motion.div
                key={p.name}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, ease, delay: i * 0.08 }}
                className={`rounded-2xl p-8 border flex flex-col ${
                  p.highlight
                    ? "border-primary bg-card shadow-xl shadow-primary/5 relative"
                    : "border-border bg-card"
                }`}
              >
                {p.highlight && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground text-xs font-medium px-4 py-1 rounded-full">
                    Recommended
                  </span>
                )}
                <h3 className="font-semibold text-xl mb-1">{p.name}</h3>
                <p className="text-sm text-muted-foreground mb-5">{p.desc}</p>
                <div className="flex items-baseline gap-1 mb-6">
                  <span className="text-4xl font-semibold tabular-nums">{p.price}</span>
                  <span className="text-muted-foreground">{p.period}</span>
                </div>
                <ul className="space-y-3 mb-8 flex-1">
                  {p.features.map((f) => (
                    <li key={f} className="flex items-center gap-2.5 text-sm">
                      <Check className="w-4 h-4 text-primary shrink-0" />
                      <span className="text-muted-foreground">{f}</span>
                    </li>
                  ))}
                </ul>
                <Link
                  to={p.name === "Enterprise" ? "#" : "/register"}
                  className={`w-full inline-flex items-center justify-center px-5 py-3 rounded-lg font-medium btn-press transition-colors ${
                    p.highlight
                      ? "bg-foreground text-background hover:opacity-90"
                      : "border border-border hover:bg-accent"
                  }`}
                >
                  {p.cta}
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
      <Footer />
    </div>
  );
}
