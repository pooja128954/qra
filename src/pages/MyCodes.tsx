import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "react-router-dom";
import { Plus, Download, Trash2, BarChart, Pencil, QrCode, Loader2, Eye, FileJson, FileType, Image as ImageIcon, Lock } from "lucide-react";
import DashboardLayout from "@/components/DashboardLayout";
import { useQrCodes } from "@/hooks/useQrCodes";
import QRCodeStyling, { DotType, ErrorCorrectionLevel } from "qr-code-styling";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import jsPDF from "jspdf";
import { toast } from "sonner";
import { usePlan } from "@/hooks/usePlan";

const ease = [0.16, 1, 0.3, 1] as const;

function SkeletonCard() {
  return (
    <div className="bg-card border border-border rounded-xl p-5 animate-pulse">
      <div className="flex items-start justify-between mb-4">
        <div className="w-10 h-10 rounded-lg bg-accent" />
        <div className="h-5 w-16 rounded-full bg-accent" />
      </div>
      <div className="h-4 w-3/4 rounded bg-accent mb-2" />
      <div className="h-3 w-1/2 rounded bg-accent mb-1" />
      <div className="h-3 w-1/3 rounded bg-accent mb-4" />
      <div className="h-4 w-1/4 rounded bg-accent" />
    </div>
  );
}

export default function MyCodes() {
  const { codes, isLoading, deleteQrCode, isDeleting } = useQrCodes();
  const { limits } = usePlan();
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleDelete = (id: string) => {
    setDeletingId(id);
    deleteQrCode(id);
  };

  const getQrInstance = (code: any) => {
    return new QRCodeStyling({
      width: 1000,
      height: 1000,
      type: "svg",
      data: `${window.location.origin}/r/${code.id}`,
      image: code.logo_url || undefined,
      dotsOptions: {
        color: code.fg_color || "#0f172a",
        type: (code.shape?.toLowerCase() as any) || "square"
      },
      imageOptions: {
        crossOrigin: "anonymous",
        margin: 0,
        imageSize: 0.45
      },
      backgroundOptions: {
        color: code.bg_color || "#ffffff"
      },
      qrOptions: {
        errorCorrectionLevel: (code.ec_level?.charAt(0) as any) || "M"
      }
    });
  };

  const handleDownload = async (code: any, format: "png" | "svg" | "pdf") => {
    let processedLogo = code.logo_url;

    // Convert logo to Base64 to ensure it's embedded in the download
    if (processedLogo && !processedLogo.startsWith("data:") && !processedLogo.startsWith("blob:")) {
      try {
        const response = await fetch(processedLogo);
        const blob = await response.blob();
        processedLogo = await new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result as string);
          reader.readAsDataURL(blob);
        });
      } catch (e) {
        console.error("Logo Base64 conversion failed for download", e);
      }
    }

    const qr = getQrInstance({ ...code, logo_url: processedLogo });

    if (format === "pdf") {
      if (!limits.exports.includes("svg")) {
        toast.error("PDF export requires a Premium or Elegant plan.");
        return;
      }
      const blob = await qr.getRawData("png");
      if (!blob) return;
      const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
      const reader = new FileReader();
      reader.readAsDataURL(blob);
      reader.onloadend = () => {
        pdf.addImage(reader.result as string, 'PNG', 55, 98, 100, 100);
        pdf.save(`${code.name}.pdf`);
      }
    } else {
      if (format === "svg" && !limits.exports.includes("svg")) {
        toast.error("SVG export requires a Premium or Elegant plan.");
        return;
      }
      qr.download({ name: code.name, extension: format });
    }
  };

  return (
    <DashboardLayout>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease }}>
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-semibold mb-1">My QR Codes</h1>
            <p className="text-sm text-muted-foreground">
              {isLoading ? "Loading…" : `${codes.length} code${codes.length !== 1 ? "s" : ""} total`}
            </p>
          </div>
          <Link to="/dashboard/qr-generator" className="inline-flex items-center gap-2 bg-foreground text-background px-5 py-2.5 rounded-lg text-sm font-medium hover:opacity-90 btn-press">
            <Plus className="w-4 h-4" /> Create QR
          </Link>
        </div>

        {isLoading ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)}
          </div>
        ) : codes.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="w-16 h-16 rounded-2xl bg-accent flex items-center justify-center mb-4">
              <QrCode className="w-8 h-8 text-muted-foreground" />
            </div>
            <h3 className="font-semibold mb-1">No QR codes yet</h3>
            <p className="text-sm text-muted-foreground mb-6">Create your first QR code to get started.</p>
            <Link to="/dashboard/qr-generator" className="inline-flex items-center gap-2 bg-foreground text-background px-5 py-2.5 rounded-lg text-sm font-medium hover:opacity-90 btn-press">
              <Plus className="w-4 h-4" /> Create your first QR
            </Link>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <AnimatePresence>
              {codes.map((c, i) => (
                <Dialog key={c.id}>
                  <motion.div
                    layout
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.4, ease, delay: i * 0.04 }}
                    className="bg-card border border-border rounded-xl p-5 hover-lift group relative"
                  >
                    <DialogTrigger asChild>
                      <div className="absolute inset-0 z-0 cursor-pointer" />
                    </DialogTrigger>

                    <div className="relative z-10">
                      <div className="flex items-start justify-between mb-4">
                        <div className="w-10 h-10 rounded-lg bg-accent flex items-center justify-center">
                          <QrCode className="w-5 h-5 text-muted-foreground" />
                        </div>
                        <span className={`inline-flex items-center gap-1.5 text-xs font-medium px-2 py-0.5 rounded-full ${c.status === "active" ? "bg-success/10 text-success" : "bg-muted text-muted-foreground"
                          }`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${c.status === "active" ? "bg-success" : "bg-muted-foreground"}`} />
                          {c.status}
                        </span>
                      </div>

                      <h3 className="font-semibold text-sm mb-1 truncate">{c.name}</h3>
                      <p className="text-xs text-muted-foreground font-mono mb-1 truncate group-hover:text-foreground transition-colors">
                        {c.type.toUpperCase()} · {c.content}
                      </p>
                      <p className="text-xs text-muted-foreground mb-4">
                        {new Date(c.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                      </p>

                      <div className="flex items-center justify-between">
                        <span className="text-sm font-semibold tabular-nums">{c.scan_count.toLocaleString()} scans</span>
                        <div className="flex gap-1">
                          <Link to={`/dashboard/qr-generator?edit=${c.id}`} className="p-1.5 rounded-md hover:bg-accent transition-colors" title="Edit">
                            <Pencil className="w-3.5 h-3.5" />
                          </Link>

                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <button className="p-1.5 rounded-md hover:bg-accent transition-colors" title="Download">
                                <Download className="w-3.5 h-3.5" />
                              </button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => handleDownload(c, "png")}>Download PNG</DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleDownload(c, "svg")} disabled={!limits.exports.includes("svg")}>
                                Download SVG {!limits.exports.includes("svg") && <Lock className="w-3 h-3 ml-auto opacity-50" />}
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleDownload(c, "pdf")} disabled={!limits.exports.includes("svg")}>
                                Download PDF {!limits.exports.includes("svg") && <Lock className="w-3 h-3 ml-auto opacity-50" />}
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>

                          <Link to={`/dashboard/analytics?qrId=${c.id}`} className="p-1.5 rounded-md hover:bg-accent transition-colors block" title="Analytics">
                            <BarChart className="w-3.5 h-3.5" />
                          </Link>
                          <button
                            onClick={(e) => { e.stopPropagation(); handleDelete(c.id); }}
                            disabled={isDeleting && deletingId === c.id}
                            className="p-1.5 rounded-md hover:bg-destructive/10 text-destructive transition-colors disabled:opacity-50"
                            title="Delete"
                          >
                            {isDeleting && deletingId === c.id
                              ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                              : <Trash2 className="w-3.5 h-3.5" />}
                          </button>
                        </div>
                      </div>
                    </div>
                  </motion.div>

                  <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                      <DialogTitle>{c.name}</DialogTitle>
                    </DialogHeader>
                    <div className="flex flex-col items-center justify-center py-6">
                      <div className="p-4 bg-white rounded-2xl shadow-sm border border-border mb-6">
                        <div ref={(el) => {
                          if (el && el.childNodes.length === 0) {
                            const qr = getQrInstance(c);
                            qr.append(el);
                          }
                        }} />
                      </div>
                      <div className="w-full space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div className="bg-accent/50 p-3 rounded-xl border border-border">
                            <p className="text-[10px] label-caps text-muted-foreground mb-1">QR Type</p>
                            <p className="text-sm font-semibold">{c.type.toUpperCase()}</p>
                          </div>
                          <div className="bg-accent/50 p-3 rounded-xl border border-border">
                            <p className="text-[10px] label-caps text-muted-foreground mb-1">Total Scans</p>
                            <p className="text-sm font-semibold">{c.scan_count.toLocaleString()}</p>
                          </div>
                        </div>
                        <div className="bg-accent/50 p-3 rounded-xl border border-border">
                          <p className="text-[10px] label-caps text-muted-foreground mb-1">Created Date</p>
                          <p className="text-sm font-semibold">
                            {new Date(c.created_at).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <Link to={`/dashboard/qr-generator?edit=${c.id}`} className="flex-1 inline-flex items-center justify-center gap-2 bg-foreground text-background px-4 py-2 rounded-lg text-sm font-medium hover:opacity-90">
                            <Pencil className="w-4 h-4" /> Edit Code
                          </Link>
                          <button onClick={() => handleDownload(c, "png")} className="flex-1 inline-flex items-center justify-center gap-2 border border-border px-4 py-2 rounded-lg text-sm font-medium hover:bg-accent transition-colors">
                            <Download className="w-4 h-4" /> Download
                          </button>
                        </div>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              ))}
            </AnimatePresence>
          </div>
        )}
      </motion.div>
    </DashboardLayout>
  );
}
