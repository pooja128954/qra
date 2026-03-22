import { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import QRCodeStyling, { DotType, CornerSquareType, ErrorCorrectionLevel } from "qr-code-styling";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import {
  Globe, Type, User, Image as ImageIcon, Share2, Smartphone, Video,
  Palette, Square, Pipette, Upload, ShieldCheck, Download, Save, Lock, ArrowRight,
} from "lucide-react";
import DashboardLayout from "@/components/DashboardLayout";
import { useQrCodes } from "@/hooks/useQrCodes";
import { usePlan } from "@/hooks/usePlan";
import { toast } from "sonner";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuPortal,
} from "@/components/ui/dropdown-menu";
import { supabase } from "@/lib/supabase";
import jsPDF from "jspdf";

const ease = [0.16, 1, 0.3, 1] as const;

const qrTypes = [
  { id: "url", label: "Website URL", icon: Globe },
  { id: "text", label: "Text", icon: Type },
  { id: "vcard", label: "vCard Plus", icon: User },
  { id: "image", label: "Image", icon: ImageIcon },
  { id: "social", label: "Social Media", icon: Share2 },
  { id: "app", label: "App Download", icon: Smartphone },
];

const frames = ["None", "Scan Me", "Point Here", "Follow Us"];
const shapes = ["Square", "Rounded", "Dots", "Classy"];
const corrections = ["L (7%)", "M (15%)", "Q (25%)", "H (30%)"];

function LockedOverlay({ title, onUpgrade }: { title: string; onUpgrade: () => void }) {
  return (
    <div className="absolute inset-0 z-10 bg-background/80 backdrop-blur-[2px] rounded-xl flex flex-col items-center justify-center p-4 text-center border border-border">
      <Lock className="w-6 h-6 text-muted-foreground mb-2" />
      <p className="font-semibold text-sm mb-1">{title}</p>
      <p className="text-xs text-muted-foreground mb-3">Upgrade to Premium to unlock</p>
      <button onClick={onUpgrade} className="bg-primary text-primary-foreground px-3 py-1.5 rounded-lg text-xs font-medium hover:opacity-90 transition-opacity">
        Upgrade Plan
      </button>
    </div>
  );
}

export default function Generator() {
  const [activeType, setActiveType] = useState("url");
  const [qrName, setQrName] = useState("");
  const [inputValue, setInputValue] = useState("https://scanovax.com");

  // vCard State
  const [vcard, setVcard] = useState({ firstName: "", lastName: "", phone: "", email: "", company: "", website: "" });

  const [fgColor, setFgColor] = useState("#0f172a");
  const [bgColor, setBgColor] = useState("#ffffff");
  const [selectedFrame, setSelectedFrame] = useState("None");
  const [selectedShape, setSelectedShape] = useState("Square");
  const [errorLevel, setErrorLevel] = useState("M (15%)");

  const { codes, createQrCode, isCreating, updateQrCode } = useQrCodes();
  const { limits } = usePlan();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const editId = searchParams.get("edit");

  const trackingIdRef = useRef(crypto.randomUUID());

  const qrRef = useRef<HTMLDivElement>(null);
  const qrCodeInstance = useRef<QRCodeStyling>(new QRCodeStyling({
    width: 200,
    height: 200,
    type: "svg",
    data: "https://scanovax.com",
    margin: 10,
    imageOptions: {
      crossOrigin: "anonymous",
      margin: 5,
    }
  }));

  const [logoFile, setLogoFile] = useState<string | undefined>(undefined);

  const qrValue = `${window.location.origin}/q/${editId || trackingIdRef.current}${inputValue ? `?v=${encodeURIComponent(inputValue.slice(0, 10))}` : ''}`;
  
  // Content for the QR code if it were static (optional, but we use redirect now)
  const qrContent = inputValue;
  
  const getPlaceholder = () => {
    switch (activeType) {
      case "url": return "https://example.com";
      case "text": return "Enter your text message...";
      case "vcard": return "Full Name, Email, Phone";
      case "social": return "@username or profile URL";
      case "app": return "App Store or Play Store URL";
      case "video": return "YouTube or video URL";
      case "image": return "Upload an image below";
      default: return "Enter content...";
    }
  };

  const ecLevel = errorLevel.charAt(0) as ErrorCorrectionLevel;
  const isLimitReached = codes.length >= limits.qrLimit;

  // Dynamic Payload Generator
  useEffect(() => {
    if (activeType === "vcard") {
      const vcardPayload = `BEGIN:VCARD\nVERSION:3.0\nN:${vcard.lastName};${vcard.firstName};;;\nFN:${vcard.firstName} ${vcard.lastName}\nORG:${vcard.company}\nTEL;TYPE=WORK,VOICE:${vcard.phone}\nEMAIL:${vcard.email}\nURL:${vcard.website}\nEND:VCARD`;
      setInputValue(vcardPayload);
    }
  }, [vcard, activeType]);

  // Load existing data for editing
  useEffect(() => {
    if (editId && codes.length > 0) {
      const existing = codes.find(c => c.id === editId);
      if (existing) {
        setQrName(existing.name);
        setActiveType(existing.type as any);
        setInputValue(existing.content);
        setFgColor(existing.fg_color || "#0f172a");
        setBgColor(existing.bg_color || "#ffffff");
        setSelectedFrame(existing.frame || "None");
        setSelectedShape(existing.shape || "Square");
        if (existing.logo_url) {
          setLogoFile(existing.logo_url);
        }
        if (existing.ec_level) {
          const matched = corrections.find(c => c.startsWith(existing.ec_level!));
          if (matched) setErrorLevel(matched);
        }
        trackingIdRef.current = existing.id as any;

        // Parse vCard if needed
        if (existing.type === "vcard") {
          const fnMatch = existing.content.match(/FN:(.*)\n/);
          const orgMatch = existing.content.match(/ORG:(.*)\n/);
          const telMatch = existing.content.match(/TEL;TYPE=WORK,VOICE:(.*)\n/);
          const emailMatch = existing.content.match(/EMAIL:(.*)\n/);
          const urlMatch = existing.content.match(/URL:(.*)\n/);

          if (fnMatch) {
            const names = fnMatch[1].split(' ');
            setVcard(v => ({ ...v, firstName: names[0] || "", lastName: names.slice(1).join(' ') || "" }));
          }
          if (orgMatch) setVcard(v => ({ ...v, company: orgMatch[1] }));
          if (telMatch) setVcard(v => ({ ...v, phone: telMatch[1] }));
          if (emailMatch) setVcard(v => ({ ...v, email: emailMatch[1] }));
          if (urlMatch) setVcard(v => ({ ...v, website: urlMatch[1] }));
        }
      }
    }
  }, [editId, codes]);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (activeType === "image") {
      const toastId = toast.loading("Uploading image securely...");
      try {
        const fileExt = file.name.split('.').pop();
        const fileName = `${Math.random()}.${fileExt}`;
        const filePath = `${trackingIdRef.current}/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('user_uploads')
          .upload(filePath, file);

        if (uploadError) throw uploadError;

        const { data } = supabase.storage.from('user_uploads').getPublicUrl(filePath);
        setInputValue(data.publicUrl);
        toast.success("Image uploaded globally! Ready to scan.", { id: toastId });
      } catch (error: any) {
        toast.error("Upload failed: " + error.message, { id: toastId });
      }
    }
  };

  // Real-time synchronization of the QR Code Styling library
  useEffect(() => {
    if (!qrRef.current) return;

    // Stable append: clear and re-append to ensure the node is fresh
    // but we only do this once to avoid flickering
    if (qrRef.current.childNodes.length === 0) {
      qrCodeInstance.current.append(qrRef.current);
    }

    const safeFgColor = limits.canCustomize ? fgColor : "#0f172a";
    const safeBgColor = limits.canCustomize ? bgColor : "#ffffff";
    const shapeMap: Record<string, DotType> = {
      "Square": "square",
      "Rounded": "rounded",
      "Dots": "dots",
      "Classy": "classy"
    };

    qrCodeInstance.current.update({
      data: qrValue || "https://scanovax.com",
      dotsOptions: {
        color: safeFgColor,
        type: shapeMap[selectedShape] || "square"
      },
      cornersSquareOptions: {
        color: safeFgColor,
        type: selectedShape === "Dots" ? "dot" : selectedShape === "Rounded" ? "extra-rounded" : "square"
      },
      backgroundOptions: {
        color: safeBgColor
      },
      qrOptions: {
        errorCorrectionLevel: ecLevel
      },
      image: logoFile
    });
  }, [qrValue, fgColor, bgColor, selectedShape, ecLevel, limits.canCustomize, logoFile, qrRef.current]);

  const handleSave = async () => {
    if (!editId && isLimitReached) {
      toast.error(`You have reached your limit of ${limits.qrLimit} QR codes. Upgrade your plan to create more.`);
      return;
    }

    let finalLogoUrl = logoFile;

    // Handle logo upload if it's a local blob
    if (logoFile?.startsWith("blob:")) {
      const toastId = toast.loading("Saving your customized logo...");
      try {
        const response = await fetch(logoFile);
        const blob = await response.blob();
        const fileExt = blob.type.split('/')[1] || 'png';
        const fileName = `logo-${Date.now()}.${fileExt}`;
        const filePath = `${editId || trackingIdRef.current}/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('user_uploads')
          .upload(filePath, blob);

        if (uploadError) throw uploadError;

        const { data } = supabase.storage.from('user_uploads').getPublicUrl(filePath);
        finalLogoUrl = data.publicUrl;
        toast.success("Logo saved!", { id: toastId });
      } catch (error: any) {
        toast.error("Logo save failed: " + error.message, { id: toastId });
      }
    }

    const payload = {
      name: qrName || inputValue.slice(0, 40) || "Untitled QR",
      type: activeType,
      content: inputValue,
      fg_color: limits.canCustomize ? fgColor : "#0f172a",
      bg_color: limits.canCustomize ? bgColor : "#ffffff",
      ec_level: ecLevel,
      frame: selectedFrame,
      shape: selectedShape,
      logo_url: finalLogoUrl || null,
    };

    if (editId) {
      await updateQrCode(editId, payload);
    } else {
      await createQrCode({
        ...payload,
        id: trackingIdRef.current as any,
      });
      // Only reset/refresh AFTER successful save
      trackingIdRef.current = crypto.randomUUID();
      setQrName("");
      setInputValue("https://scanovax.com");
      setLogoFile(undefined);
    }
  };

  const handleUpgrade = () => navigate("/#pricing");

  const handleDownloadPNG = () => {
    qrCodeInstance.current.download({ name: qrName || "qr-code", extension: "png" });
  };

  const handleDownloadSVG = () => {
    if (!limits.exports.includes("svg")) {
      toast.error("SVG export requires a Premium or Elegant plan.");
      return;
    }
    qrCodeInstance.current.download({ name: qrName || "qr-code", extension: "svg" });
  };

  const handleDownloadPDF = async () => {
    if (!limits.exports.includes("svg")) {
      toast.error("PDF export requires a Premium or Elegant plan.");
      return;
    }
    const blob = await qrCodeInstance.current.getRawData("png");
    if (!blob) return;
    const url = URL.createObjectURL(blob);
    const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });

    const qrSize = 100;
    const x = (210 - qrSize) / 2;
    const y = (297 - qrSize) / 2;

    const reader = new FileReader();
    reader.readAsDataURL(blob);
    reader.onloadend = () => {
      const base64data = reader.result as string;
      pdf.addImage(base64data, 'PNG', x, y, qrSize, qrSize);
      pdf.save(`${qrName || "qr-code"}.pdf`);
      URL.revokeObjectURL(url);
    }
  };

  const handleShare = async (platform: "whatsapp" | "facebook" | "instagram" | "youtube", subType?: string) => {
    const url = encodeURIComponent(qrValue);
    const text = encodeURIComponent("Check out my new QR Code!");

    // 1. Convert QR to image (PNG)
    const blob = await qrCodeInstance.current.getRawData("png");
    if (!blob) return;

    // 2. Web Share API (Natively share the image file to apps if supported)
    const file = new File([blob], 'qr-code.png', { type: 'image/png' });
    if (navigator.canShare && navigator.canShare({ files: [file] })) {
      try {
        await navigator.share({
          title: 'Scanovax QR Code',
          text: 'Here is my QR Code!',
          files: [file]
        });
        toast.success(`Shared successfully via your device!`);
        return; // Stop if native share succeeds
      } catch (err: any) {
        console.log("Web Share API dialog closed or failed", err);
      }
    }

    // 3. Fallbacks if Web Share API isn't supported (Desktop browsers etc)
    if (['instagram', 'youtube', 'facebook'].includes(platform) && subType) {
      toast.success(`Saving QR image for ${platform} ${subType}... Please attach it in the app.`);
      handleDownloadPNG();
      navigator.clipboard.writeText(qrValue).catch(() => { });
      setTimeout(() => toast.success("Content copied! You can paste it into your post."), 2000);
      return;
    }

    switch (platform) {
      case "whatsapp":
        toast.success("Downloading QR Image... Attach it directly in WhatsApp!");
        handleDownloadPNG();
        window.open(`https://api.whatsapp.com/send?text=${text}%20${url}`, "_blank");
        break;
      case "facebook":
        window.open(`https://www.facebook.com/sharer/sharer.php?u=${url}`, "_blank");
        break;
      case "instagram":
      case "youtube":
        navigator.clipboard.writeText(qrValue).catch(() => { });
        toast.success(`Content link copied to clipboard for ${platform}!`);
        break;
    }
  };

  return (
    <DashboardLayout>
      <div>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease }}
          className="mb-8"
        >
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-semibold mb-2">{editId ? "Edit QR Code" : "QR Generator"}</h1>
              <p className="text-muted-foreground">{editId ? "Modify your existing QR code settings." : "Create, customize, and download your QR code."}</p>
            </div>
            <div className="text-right">
              <p className="text-sm font-medium mb-1">
                {codes.length} / {limits.qrLimit === Infinity ? "Unlimited" : limits.qrLimit} QR Codes
              </p>
              {limits.qrLimit !== Infinity && (
                <div className="w-32 h-1.5 bg-accent rounded-full overflow-hidden ml-auto">
                  <div
                    className={`h-full rounded-full ${isLimitReached ? 'bg-destructive' : 'bg-primary'}`}
                    style={{ width: `${Math.min(100, (codes.length / limits.qrLimit) * 100)}%` }}
                  />
                </div>
              )}
            </div>
          </div>
        </motion.div>

        {window.location.hostname === "localhost" && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4 mb-8 flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-amber-500/20 flex items-center justify-center shrink-0">
              <Globe className="w-5 h-5 text-amber-500" />
            </div>
            <div>
              <p className="font-semibold text-amber-600 mb-0.5 text-sm">Working in Localhost</p>
              <p className="text-xs text-amber-600/80 line-clamp-1">Shared QR codes generated here will point to `localhost` and might not work for others. Use the live deployment for sharing.</p>
            </div>
          </motion.div>
        )}

        {isLimitReached && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="bg-destructive/10 border border-destructive/20 rounded-xl p-4 mb-8 flex items-center justify-between">
            <div>
              <p className="font-semibold text-destructive mb-1">QR Code Limit Reached</p>
              <p className="text-sm text-destructive/80">You've reached your plan's limit of {limits.qrLimit} QR codes. You cannot save any more until you upgrade.</p>
            </div>
            <Link to="/#pricing" className="bg-destructive text-destructive-foreground px-5 py-2.5 flex items-center gap-2 rounded-lg text-sm font-medium hover:opacity-90 shrink-0">
              Upgrade Plan <ArrowRight className="w-4 h-4" />
            </Link>
          </motion.div>
        )}

        <div className="grid lg:grid-cols-[1fr_380px] gap-12 border-t border-border pt-8">
          {/* Config Panel */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease, delay: 0.1 }}
            className="space-y-8"
          >
            {/* QR Name */}
            <div>
              <h3 className="label-caps text-muted-foreground mb-3">QR Code Name</h3>
              <input
                type="text"
                value={qrName}
                onChange={(e) => setQrName(e.target.value)}
                placeholder="e.g. Product Launch Campaign"
                className="w-full bg-background border border-border rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 transition-shadow"
              />
            </div>

            {/* QR Type Grid */}
            <div>
              <h3 className="label-caps text-muted-foreground mb-3">QR Type</h3>
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-7 gap-2">
                {qrTypes.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => setActiveType(t.id)}
                    className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border text-xs font-medium transition-all btn-press ${activeType === t.id
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

            {/* Dynamic Input Form */}
            <div>
              <h3 className="label-caps text-muted-foreground mb-3">Content</h3>

              {activeType === "vcard" && (
                <div className="grid grid-cols-2 gap-4">
                  <input type="text" placeholder="First Name" value={vcard.firstName} onChange={(e) => setVcard({ ...vcard, firstName: e.target.value })} className="w-full bg-background border border-border rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 transition-shadow" />
                  <input type="text" placeholder="Last Name" value={vcard.lastName} onChange={(e) => setVcard({ ...vcard, lastName: e.target.value })} className="w-full bg-background border border-border rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 transition-shadow" />
                  <input type="tel" placeholder="Phone Number" value={vcard.phone} onChange={(e) => setVcard({ ...vcard, phone: e.target.value })} className="col-span-2 sm:col-span-1 w-full bg-background border border-border rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 transition-shadow" />
                  <input type="email" placeholder="Email Address" value={vcard.email} onChange={(e) => setVcard({ ...vcard, email: e.target.value })} className="col-span-2 sm:col-span-1 w-full bg-background border border-border rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 transition-shadow" />
                  <input type="text" placeholder="Company Name" value={vcard.company} onChange={(e) => setVcard({ ...vcard, company: e.target.value })} className="col-span-2 sm:col-span-1 w-full bg-background border border-border rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 transition-shadow" />
                  <input type="url" placeholder="Website" value={vcard.website} onChange={(e) => setVcard({ ...vcard, website: e.target.value })} className="col-span-2 sm:col-span-1 w-full bg-background border border-border rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 transition-shadow" />
                </div>
              )}

              {activeType === "image" && (
                <div className="border border-border rounded-lg p-4 bg-background">
                  <input type="file" accept="image/*" onChange={handleImageUpload} className="w-full text-sm" />
                  {inputValue.startsWith("http") && <p className="text-xs text-primary mt-2">Image URL dynamically generated!</p>}
                </div>
              )}

              {activeType === "text" && (
                <textarea
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  placeholder={getPlaceholder()}
                  rows={4}
                  className="w-full bg-background border border-border rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 transition-shadow resize-none"
                />
              )}

              {["url", "social", "app"].includes(activeType) && (
                <input
                  type={activeType === "url" ? "url" : "text"}
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  placeholder={getPlaceholder()}
                  className="w-full bg-background border border-border rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 transition-shadow"
                />
              )}
            </div>

            {/* Customization */}
            <div className="grid sm:grid-cols-2 gap-6 relative">
              {!limits.canCustomize && <LockedOverlay title="Custom Colors Locked" onUpgrade={handleUpgrade} />}

              {/* Colors */}
              <div className={!limits.canCustomize ? "opacity-50 pointer-events-none filter blur-[1px]" : ""}>
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

              {/* Shape */}
              <div>
                <h3 className="label-caps text-muted-foreground mb-3 flex items-center gap-2">
                  <Palette className="w-3.5 h-3.5" /> Shape
                </h3>
                <div className="grid grid-cols-2 gap-2">
                  {shapes.map((s) => (
                    <button key={s} onClick={() => setSelectedShape(s)}
                      className={`px-3 py-2 rounded-lg border text-xs font-medium transition-all btn-press ${selectedShape === s ? "border-primary bg-primary/5 text-primary" : "border-border text-muted-foreground hover:text-foreground"
                        }`}>{s}</button>
                  ))}
                </div>
              </div>

              {/* Frame */}
              <div>
                <h3 className="label-caps text-muted-foreground mb-3 flex items-center gap-2">
                  <Square className="w-3.5 h-3.5" /> Frame
                </h3>
                <div className="grid grid-cols-2 gap-2">
                  {frames.map((f) => (
                    <button key={f} onClick={() => setSelectedFrame(f)}
                      className={`px-3 py-2 rounded-lg border text-xs font-medium transition-all btn-press ${selectedFrame === f ? "border-primary bg-primary/5 text-primary" : "border-border text-muted-foreground hover:text-foreground"
                        }`}>{f}</button>
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
                    <button key={c} onClick={() => setErrorLevel(c)}
                      className={`px-3 py-2 rounded-lg border text-xs font-medium transition-all btn-press ${errorLevel === c ? "border-primary bg-primary/5 text-primary" : "border-border text-muted-foreground hover:text-foreground"
                        }`}>{c}</button>
                  ))}
                </div>
              </div>
            </div>

            {/* Logo Upload */}
            <div className="relative">
              {!limits.canCustomize && <LockedOverlay title="Custom Logo Locked" onUpgrade={handleUpgrade} />}
              <div className={!limits.canCustomize ? "opacity-50 pointer-events-none filter blur-[1px]" : ""}>
                <h3 className="label-caps text-muted-foreground mb-3 flex items-center gap-2">
                  <Upload className="w-3.5 h-3.5" /> Logo Upload
                </h3>
                <label className="border-2 border-dashed border-border rounded-xl p-8 text-center hover:border-primary/40 transition-colors cursor-pointer block">
                  <input
                    type="file"
                    accept="image/png, image/jpeg, image/svg+xml"
                    className="hidden"
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        const url = URL.createObjectURL(e.target.files[0]);
                        setLogoFile(url);
                      }
                    }}
                  />
                  <Upload className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">Drop your logo here or click to upload</p>
                  <p className="text-xs text-muted-foreground/60 mt-1">PNG, JPG, SVG up to 2MB</p>
                </label>
                {logoFile && (
                  <button onClick={() => setLogoFile(undefined)} className="text-xs text-destructive hover:underline mt-2 inline-block">
                    Remove Logo
                  </button>
                )}
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
                className="qr-preview flex flex-col items-center justify-center p-8 rounded-xl border border-border mb-5"
                style={{ backgroundColor: limits.canCustomize ? bgColor : "#ffffff" }}
              >
                {selectedFrame !== "None" && (
                  <p className="text-xs font-medium mb-3" style={{ color: limits.canCustomize ? fgColor : "#0f172a" }}>
                    {selectedFrame === "Scan Me" ? "📱 Scan Me" : selectedFrame === "Point Here" ? "👆 Point Here" : "🔗 Follow Us"}
                  </p>
                )}
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.4, ease }}
                >
                  <div ref={qrRef} className="flex justify-center min-h-[200px] min-w-[200px]" />
                </motion.div>
              </div>

              <div className="space-y-2.5">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button className="w-full flex items-center justify-center gap-2 bg-foreground text-background px-5 py-3 rounded-lg text-sm font-medium hover:opacity-90 btn-press">
                      <Download className="w-4 h-4" /> Download
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-56" align="center">
                    <DropdownMenuItem onClick={handleDownloadPNG}>
                      Download PNG
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={handleDownloadSVG}
                      disabled={!limits.exports.includes("svg")}
                    >
                      Download SVG {!limits.exports.includes("svg") && <Lock className="w-3 h-3 ml-auto" />}
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={handleDownloadPDF}
                      disabled={!limits.exports.includes("svg")}
                    >
                      Download PDF {!limits.exports.includes("svg") && <Lock className="w-3 h-3 ml-auto" />}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button className="w-full flex items-center justify-center gap-2 border border-border px-5 py-3 rounded-lg text-sm font-medium hover:bg-accent transition-colors btn-press">
                      <Share2 className="w-4 h-4" /> Share
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-56" align="center">

                    <DropdownMenuSub>
                      <DropdownMenuSubTrigger>WhatsApp</DropdownMenuSubTrigger>
                      <DropdownMenuPortal>
                        <DropdownMenuSubContent>
                          <DropdownMenuItem onClick={() => handleShare("whatsapp", "Chat")}>Chat</DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleShare("whatsapp", "Status")}>Status</DropdownMenuItem>
                        </DropdownMenuSubContent>
                      </DropdownMenuPortal>
                    </DropdownMenuSub>

                    <DropdownMenuSub>
                      <DropdownMenuSubTrigger>Instagram</DropdownMenuSubTrigger>
                      <DropdownMenuPortal>
                        <DropdownMenuSubContent>
                          <DropdownMenuItem onClick={() => handleShare("instagram", "Post")}>Post</DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleShare("instagram", "Story")}>Story</DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleShare("instagram", "Reel")}>Reel</DropdownMenuItem>
                        </DropdownMenuSubContent>
                      </DropdownMenuPortal>
                    </DropdownMenuSub>

                    <DropdownMenuSub>
                      <DropdownMenuSubTrigger>Facebook</DropdownMenuSubTrigger>
                      <DropdownMenuPortal>
                        <DropdownMenuSubContent>
                          <DropdownMenuItem onClick={() => handleShare("facebook", "Post")}>Post</DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleShare("facebook", "Story")}>Story</DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleShare("facebook", "Reel")}>Reel</DropdownMenuItem>
                        </DropdownMenuSubContent>
                      </DropdownMenuPortal>
                    </DropdownMenuSub>

                    <DropdownMenuSub>
                      <DropdownMenuSubTrigger>YouTube</DropdownMenuSubTrigger>
                      <DropdownMenuPortal>
                        <DropdownMenuSubContent>
                          <DropdownMenuItem onClick={() => handleShare("youtube", "Post")}>Post</DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleShare("youtube", "Shorts")}>Shorts</DropdownMenuItem>
                        </DropdownMenuSubContent>
                      </DropdownMenuPortal>
                    </DropdownMenuSub>

                  </DropdownMenuContent>
                </DropdownMenu>

                <button
                  onClick={handleSave}
                  disabled={isCreating || !inputValue || isLimitReached}
                  className="w-full flex items-center justify-center gap-2 bg-primary text-primary-foreground px-5 py-3 rounded-lg text-sm font-medium hover:opacity-90 btn-press disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isCreating ? (
                    <span className="w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
                  ) : <Save className="w-4 h-4" />}
                  {editId ? (isCreating ? "Updating…" : "Update QR Code") : (isLimitReached ? "Limit Reached" : isCreating ? "Saving…" : "Save QR Code")}
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </DashboardLayout>
  );
}
