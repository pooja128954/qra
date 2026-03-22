import { PlanType } from "./database.types";

export type ExportFormat = "png" | "svg" | "pdf";
export type AnalyticsLevel = "none" | "basic" | "premium" | "full";
export type CustomizationLevel = "basic" | "limited" | "full";

export interface PlanConfig {
  name: string;
  qrLimit: number;
  scanLimit: number;
  analytics: AnalyticsLevel;
  customization: CustomizationLevel;
  editable: boolean;
  logoUpload: boolean;
  exports: ExportFormat[];
  price: number;
}

export const TRIAL_DURATION_DAYS = 3;

export const PLANS: Record<PlanType, PlanConfig> = {
  trial: {
    name: "Free Trial (Premium)",
    qrLimit: 300,
    scanLimit: 10000,
    analytics: "premium",
    customization: "limited",
    editable: true,
    logoUpload: true,
    exports: ["png", "svg", "pdf"],
    price: 0,
  },
  economic: {
    name: "Economic",
    qrLimit: Infinity, // No limit on QR codes, but static only
    scanLimit: 100,
    analytics: "none",
    customization: "basic",
    editable: false,
    logoUpload: false,
    exports: ["png"],
    price: 399,
  },
  premium: {
    name: "Premium",
    qrLimit: Infinity,
    scanLimit: Infinity,
    analytics: "basic",
    customization: "limited",
    editable: true,
    logoUpload: true,
    exports: ["png", "svg", "pdf"],
    price: 599,
  },
  elegant: {
    name: "Elegant",
    qrLimit: Infinity,
    scanLimit: Infinity,
    analytics: "full",
    customization: "full",
    editable: true,
    logoUpload: true,
    exports: ["png", "svg", "pdf"],
    price: 899,
  },
};
