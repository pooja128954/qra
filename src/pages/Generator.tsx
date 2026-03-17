import { useState } from "react";
import { motion } from "framer-motion";
import { QRCodeSVG } from "qrcode.react";
import {
  Globe, Type, User, Image, Share2, Smartphone, Video,
  Palette, Square, Pipette, Upload, ShieldCheck, Download,
} from "lucide-react";
import DashboardLayout from "@/components/DashboardLayout";

const ease = [0.16, 1, 0.3, 1] as const;

const qrTypes = [
  { id: "url", label: "Website URL", icon: Globe },
  { id: "text", label: "Text", icon: Type },
  { id: "vcard", label: "vCard Plus", icon: User },
  { id: "image", label: "Image", icon: Image },
  { id: "social", label: "Social Media", icon: Share2 },
  { id: "app", label: "App Download", icon: Smartphone },
  { id: "video", label: "Video", icon: Video },
];

const frames = ["None", "Scan Me", "Point Here", "Follow Us"];
const shapes = ["Square", "Rounded", "Dots", "Classy"];
const corrections = ["L (7%)", "M (15%)", "Q (25%)", "H (30%)"];

export default function Generator() {
  const [activeType, setActiveType] = useState("url");
  const [inputValue, setInputValue] = useState("https://scanovax.com");
  const [fgColor, setFgColor] = useState("#0f172a");
  const [bgColor, setBgColor] = useState("#ffffff");
  const [selectedFrame, setSelectedFrame] = useState("None");
  const [selectedShape, setSelectedShape] = useState("Square");
  const [errorLevel, setErrorLevel] = useState("M (15%)");

  const getPlaceholder = () => {
    switch (activeType) {
      case "url": return "https://example.com";
      case "text": return "Enter your text message...";
      case "vcard": return "Full Name, Email, Phone";
      case "social": return "@username or profile URL";
      case "app": return "App Store or Play Store URL";
      case "video": return "YouTube or video URL";
      default: return "Enter content...";
    }
  };

  const qrValue = inputValue || "https://scanovax.com";
  const ecLevel = errorLevel.charAt(0) as "L" | "M" | "Q" | "H";

  return (
    <DashboardLayout>
      <div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease }}
            className="mb-8"
          >
            <h1 className="text-3xl font-semibold mb-2">QR Generator</h1>
            <p className="text-muted-foreground">Create, customize, and download your QR code.</p>
          </motion.div>

          <div className="grid lg:grid-cols-[1fr_380px] gap-12">
            {/* Config Panel */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, ease, delay: 0.1 }}
              className="space-y-8"
            >
              {/* QR Type Grid */}
              <div>
                <h3 className="label-caps text-muted-foreground mb-3">QR Type</h3>
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-7 gap-2">
                  {qrTypes.map((t) => (
                    <button
                      key={t.id}
                      onClick={() => setActiveType(t.id)}
                      className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border text-xs font-medium transition-all btn-press ${
                        activeType === t.id
                          ? "border-primary bg-primary/5 text-primary"
                          : "border-border hover:border-foreground/20 text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      <t.icon className="w-5 h-5" />
                      <span className="truncate w-full text-center">{t.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Input */}
              <div>
                <h3 className="label-caps text-muted-foreground mb-3">Content</h3>
                {activeType === "text" ? (
                  <textarea
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    placeholder={getPlaceholder()}
                    rows={4}
                    className="w-full bg-background border border-border rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 transition-shadow resize-none"
                  />
                ) : (
                  <input
                    type="text"
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    placeholder={getPlaceholder()}
                    className="w-full bg-background border border-border rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 transition-shadow"
                  />
                )}
              </div>

              {/* Customization */}
              <div className="grid sm:grid-cols-2 gap-6">
                {/* Colors */}
                <div>
                  <h3 className="label-caps text-muted-foreground mb-3 flex items-center gap-2">
                    <Pipette className="w-3.5 h-3.5" /> Colors
                  </h3>
                  <div className="space-y-3">
                    <label className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Foreground</span>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs text-muted-foreground">{fgColor}</span>
                        <input type="color" value={fgColor} onChange={(e) => setFgColor(e.target.value)} className="w-8 h-8 rounded-md border border-border cursor-pointer" />
                      </div>
                    </label>
                    <label className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Background</span>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs text-muted-foreground">{bgColor}</span>
                        <input type="color" value={bgColor} onChange={(e) => setBgColor(e.target.value)} className="w-8 h-8 rounded-md border border-border cursor-pointer" />
                      </div>
                    </label>
                  </div>
                </div>

                {/* Frame */}
                <div>
                  <h3 className="label-caps text-muted-foreground mb-3 flex items-center gap-2">
                    <Square className="w-3.5 h-3.5" /> Frame
                  </h3>
                  <div className="grid grid-cols-2 gap-2">
                    {frames.map((f) => (
                      <button
                        key={f}
                        onClick={() => setSelectedFrame(f)}
                        className={`px-3 py-2 rounded-lg border text-xs font-medium transition-all btn-press ${
                          selectedFrame === f
                            ? "border-primary bg-primary/5 text-primary"
                            : "border-border text-muted-foreground hover:text-foreground"
                        }`}
                      >
                        {f}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Shape */}
                <div>
                  <h3 className="label-caps text-muted-foreground mb-3 flex items-center gap-2">
                    <Palette className="w-3.5 h-3.5" /> Shape
                  </h3>
                  <div className="grid grid-cols-2 gap-2">
                    {shapes.map((s) => (
                      <button
                        key={s}
                        onClick={() => setSelectedShape(s)}
                        className={`px-3 py-2 rounded-lg border text-xs font-medium transition-all btn-press ${
                          selectedShape === s
                            ? "border-primary bg-primary/5 text-primary"
                            : "border-border text-muted-foreground hover:text-foreground"
                        }`}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Error Correction */}
                <div>
                  <h3 className="label-caps text-muted-foreground mb-3 flex items-center gap-2">
                    <ShieldCheck className="w-3.5 h-3.5" /> Error Correction
                  </h3>
                  <div className="grid grid-cols-2 gap-2">
                    {corrections.map((c) => (
                      <button
                        key={c}
                        onClick={() => setErrorLevel(c)}
                        className={`px-3 py-2 rounded-lg border text-xs font-medium transition-all btn-press ${
                          errorLevel === c
                            ? "border-primary bg-primary/5 text-primary"
                            : "border-border text-muted-foreground hover:text-foreground"
                        }`}
                      >
                        {c}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Logo Upload */}
              <div>
                <h3 className="label-caps text-muted-foreground mb-3 flex items-center gap-2">
                  <Upload className="w-3.5 h-3.5" /> Logo Upload
                </h3>
                <div className="border-2 border-dashed border-border rounded-xl p-8 text-center hover:border-primary/40 transition-colors cursor-pointer">
                  <Upload className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">Drop your logo here or click to upload</p>
                  <p className="text-xs text-muted-foreground/60 mt-1">PNG, SVG up to 2MB</p>
                </div>
              </div>
            </motion.div>

            {/* Live Preview */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, ease, delay: 0.2 }}
              className="lg:sticky lg:top-24 h-fit"
            >
              <div className="bg-card border border-border rounded-2xl p-6 shadow-lg">
                <p className="label-caps text-muted-foreground mb-4">Live Preview</p>

                <div
                  className="flex flex-col items-center justify-center p-8 rounded-xl border border-border mb-5"
                  style={{ backgroundColor: bgColor }}
                >
                  {selectedFrame !== "None" && (
                    <p className="text-xs font-medium mb-3" style={{ color: fgColor }}>
                      {selectedFrame === "Scan Me" ? "📱 Scan Me" : selectedFrame === "Point Here" ? "👆 Point Here" : "🔗 Follow Us"}
                    </p>
                  )}
                  <motion.div
                    key={`${qrValue}-${fgColor}-${bgColor}-${ecLevel}`}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.4, ease }}
                  >
                    <QRCodeSVG
                      value={qrValue}
                      size={200}
                      level={ecLevel}
                      fgColor={fgColor}
                      bgColor={bgColor}
                      style={{ outline: "1px solid rgba(0,0,0,0.05)", outlineOffset: "-1px" }}
                    />
                  </motion.div>
                </div>

                <div className="space-y-2.5">
                  <button className="w-full flex items-center justify-center gap-2 bg-foreground text-background px-5 py-3 rounded-lg text-sm font-medium hover:opacity-90 btn-press">
                    <Download className="w-4 h-4" /> Download PNG
                  </button>
                  <button className="w-full flex items-center justify-center gap-2 border border-border px-5 py-3 rounded-lg text-sm font-medium hover:bg-accent transition-colors btn-press">
                    <Download className="w-4 h-4" /> Download SVG
                  </button>
                  <button className="w-full flex items-center justify-center gap-2 bg-primary text-primary-foreground px-5 py-3 rounded-lg text-sm font-medium hover:opacity-90 btn-press">
                    Save QR Code
                  </button>
                </div>
              </div>
            </motion.div>
        </div>
      </div>
    </DashboardLayout>
  );
}
