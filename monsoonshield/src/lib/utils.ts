import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function getRiskColor(score: number): string {
  if (score >= 75) return "text-red-500";
  if (score >= 55) return "text-amber-500";
  if (score >= 35) return "text-yellow-500";
  return "text-green-500";
}

export function getRiskBgColor(score: number): string {
  if (score >= 75) return "bg-red-500/10 border-red-500/30";
  if (score >= 55) return "bg-amber-500/10 border-amber-500/30";
  if (score >= 35) return "bg-yellow-500/10 border-yellow-500/30";
  return "bg-green-500/10 border-green-500/30";
}

export function getRiskLabel(score: number): string {
  if (score >= 75) return "EXTREME";
  if (score >= 55) return "HIGH";
  if (score >= 35) return "MODERATE";
  return "LOW";
}

export function getSeverityColor(severity: string): string {
  switch (severity) {
    case "evacuate": return "text-red-600 bg-red-50 border-red-200";
    case "emergency": return "text-red-500 bg-red-50 border-red-200";
    case "warning": return "text-amber-600 bg-amber-50 border-amber-200";
    case "watch": return "text-yellow-600 bg-yellow-50 border-yellow-200";
    default: return "text-blue-600 bg-blue-50 border-blue-200";
  }
}

export function getAlertIcon(type: string): string {
  switch (type) {
    case "flood": return "🌊";
    case "cyclone": return "🌀";
    case "landslide": return "⛰️";
    case "health": return "🏥";
    case "road": return "🚧";
    case "power": return "⚡";
    default: return "⚠️";
  }
}

export function formatTimeAgo(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  const seconds = Math.floor((Date.now() - d.getTime()) / 1000);
  if (seconds < 60) return `${seconds}s ago`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return `${Math.floor(seconds / 86400)}d ago`;
}

export function getShelterCapacityColor(occupancy: number, capacity: number): string {
  const ratio = occupancy / capacity;
  if (ratio >= 0.9) return "text-red-500";
  if (ratio >= 0.7) return "text-amber-500";
  return "text-green-500";
}

export const LANGUAGES = [
  { code: "en", name: "English", native: "English" },
  { code: "hi", name: "Hindi", native: "हिन्दी" },
  { code: "mr", name: "Marathi", native: "मराठी" },
  { code: "bn", name: "Bengali", native: "বাংলা" },
  { code: "te", name: "Telugu", native: "తెలుగు" },
  { code: "ta", name: "Tamil", native: "தமிழ்" },
  { code: "gu", name: "Gujarati", native: "ગુજરાતી" },
  { code: "kn", name: "Kannada", native: "ಕನ್ನಡ" },
  { code: "ml", name: "Malayalam", native: "മലയാളം" },
  { code: "or", name: "Odia", native: "ଓଡ଼ିଆ" },
  { code: "pa", name: "Punjabi", native: "ਪੰਜਾਬੀ" },
  { code: "ur", name: "Urdu", native: "اردو" },
];

export const EMERGENCY_CONTACTS = [
  { name: "National Emergency", number: "112", icon: "🆘" },
  { name: "NDRF", number: "011-24363260", icon: "⛑️" },
  { name: "Flood Helpline", number: "1078", icon: "🌊" },
  { name: "Police", number: "100", icon: "👮" },
  { name: "Ambulance", number: "108", icon: "🚑" },
  { name: "Fire", number: "101", icon: "🔥" },
  { name: "Women Helpline", number: "1091", icon: "🤝" },
  { name: "Child Helpline", number: "1098", icon: "👶" },
];
