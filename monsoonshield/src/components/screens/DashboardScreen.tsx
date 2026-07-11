"use client";

import { useState, useEffect, useCallback, useTransition } from "react";
import {
  AlertTriangle,
  MapPin,
  ChevronRight,
  Zap,
  Loader2,
} from "lucide-react";
import { getRiskColor, getRiskBgColor, getRiskLabel } from "@/lib/utils";
import { generateBriefing } from "@/lib/gemini";
import { useAuth } from "@/lib/AuthContext";
import { SidebarTab } from "@/components/layout/Sidebar";
import type { RealWeather, RealAlert } from "@/lib/realData";

interface DashboardScreenProps {
  setActiveTab: (tab: SidebarTab) => void;
  language: string;
}

const WMO_EMOJI: Record<number, string> = {
  0: "☀️", 1: "🌤️", 2: "⛅", 3: "☁️",
  45: "🌫️", 48: "🌫️",
  51: "🌦️", 53: "🌦️", 55: "🌧️",
  61: "🌧️", 63: "🌧️", 65: "🌧️",
  71: "🌨️", 73: "🌨️", 75: "❄️",
  80: "🌦️", 81: "🌧️", 82: "⛈️",
  95: "⛈️", 96: "⛈️", 99: "⛈️",
};

function getSeverityBg(color: string): string {
  switch (color) {
    case "red": return "bg-red-50 border-red-200 text-red-900";
    case "orange": return "bg-orange-50 border-orange-200 text-orange-900";
    case "yellow": return "bg-yellow-50 border-yellow-200 text-yellow-900";
    default: return "bg-blue-50 border-blue-200 text-blue-900";
  }
}

function getAlertTypeIcon(type: string): string {
  const t = type.toLowerCase();
  if (t.includes("rain") || t.includes("flood")) return "🌊";
  if (t.includes("thunder") || t.includes("lightning")) return "⛈️";
  if (t.includes("heat")) return "🔥";
  if (t.includes("cold")) return "🥶";
  if (t.includes("cyclone")) return "🌀";
  if (t.includes("landslide")) return "🏔️";
  return "⚠️";
}

export default function DashboardScreen({ setActiveTab, language }: DashboardScreenProps) {
  const { user } = useAuth();
  const [riskScore] = useState(58);
  const [briefing, setBriefing] = useState("");
  const [isGeneratingBriefing, setIsGeneratingBriefing] = useState(false);
  const [, startTransition] = useTransition();

  const [weather, setWeather] = useState<RealWeather | null>(null);
  const [weatherLoading, setWeatherLoading] = useState(true);
  const [alerts, setAlerts] = useState<RealAlert[]>([]);
  const [alertsLoading, setAlertsLoading] = useState(true);

  // Fetch real weather
  useEffect(() => {
    setWeatherLoading(true);
    fetch("/api/weather")
      .then((r) => r.json())
      .then((data) => { if (!data.error) setWeather(data); })
      .catch(() => {})
      .finally(() => setWeatherLoading(false));
  }, []);

  // Fetch real alerts
  useEffect(() => {
    setAlertsLoading(true);
    fetch("/api/alerts")
      .then((r) => r.json())
      .then((data) => { if (Array.isArray(data)) setAlerts(data); })
      .catch(() => {})
      .finally(() => setAlertsLoading(false));
  }, []);

  const generateAIBriefing = useCallback(() => {
    startTransition(async () => {
      setIsGeneratingBriefing(true);
      try {
        const result = await generateBriefing({
          location: user?.location || "Pune, Maharashtra",
          language: language,
        });
        setBriefing(result);
      } catch {
        setBriefing(
          language === "hi"
            ? "ब्रीफिंग लोड करने में विफल। कृपया पुनः प्रयास करें।"
            : "Failed to load briefing. Please try again."
        );
      } finally {
        setIsGeneratingBriefing(false);
      }
    });
  }, [user, language]);

  useEffect(() => {
    generateAIBriefing();
  }, [generateAIBriefing]);

  return (
    <div className="p-6 space-y-6 max-h-[calc(100vh-73px)] overflow-y-auto w-full">
      {/* Location Bar */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
            🛡️ Monsoon Intelligence Center
          </h2>
          <p className="text-xs text-slate-400 mt-1">Real-time personalized situational awareness</p>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-800 border border-slate-700/50">
          <MapPin className="h-4 w-4 text-cyan-400" />
          <span className="text-xs font-semibold text-slate-200">{user?.location || "Pune, Maharashtra"}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Risk Score */}
        <div className="glass-card p-6 flex flex-col justify-between border-slate-800">
          <div>
            <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4">
              Your Household Risk Score
            </h3>
            <div className="flex items-center gap-6 mb-6">
              <div className="relative h-28 w-28 flex items-center justify-center rounded-full border-4 border-slate-800">
                <div
                  className="absolute inset-0 rounded-full border-4 border-transparent transition-all duration-1000"
                  style={{
                    borderTopColor: riskScore >= 75 ? "#EF4444" : riskScore >= 55 ? "#F59E0B" : "#10B981",
                    transform: `rotate(${riskScore * 3.6}deg)`,
                  }}
                />
                <div className="text-center">
                  <span className="block text-3xl font-extrabold text-white">{riskScore}</span>
                  <span className="block text-[9px] text-slate-500 font-bold tracking-widest uppercase">Risk Index</span>
                </div>
              </div>
              <div>
                <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-bold ${getRiskBgColor(riskScore)} ${getRiskColor(riskScore)}`}>
                  {getRiskLabel(riskScore)} RISK
                </span>
                <p className="text-xs text-slate-400 mt-2">
                  Based on location, home type, and current conditions.
                </p>
              </div>
            </div>
          </div>
          <div className="border-t border-slate-800/80 pt-4">
            <button
              onClick={() => setActiveTab("prepare")}
              className="w-full py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 border border-slate-750 transition-colors flex items-center justify-center gap-1"
            >
              <span>Improve Score</span>
              <ChevronRight className="h-3 w-3" />
            </button>
          </div>
        </div>

        {/* Weather Widget — Real Data */}
        <div className="glass-card p-6 flex flex-col justify-between border-slate-800 weather-gradient">
          <div>
            <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4">
              Current Weather
            </h3>
            {weatherLoading ? (
              <div className="flex items-center gap-2 text-slate-400">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span className="text-xs">Fetching live weather...</span>
              </div>
            ) : weather ? (
              <>
                <div className="flex items-center gap-4">
                  <span className="text-5xl">{WMO_EMOJI[weather.conditionCode] || "🌧️"}</span>
                  <div>
                    <span className="text-3xl font-extrabold text-white">{weather.temp}°C</span>
                    <span className="block text-sm text-cyan-400 font-semibold">{weather.condition}</span>
                  </div>
                </div>
                <p className="text-xs text-slate-400 mt-4 leading-relaxed">
                  {weather.description}
                </p>
              </>
            ) : (
              <p className="text-xs text-slate-500">Weather data unavailable</p>
            )}
          </div>

          {weather && (
            <div className="grid grid-cols-3 gap-2 border-t border-slate-800/85 pt-4 mt-6">
              <div className="text-center p-2 rounded-lg bg-slate-800/20">
                <span className="block text-[10px] text-slate-500 font-bold uppercase">Rain</span>
                <span className="text-sm font-bold text-white">{weather.rainfallMm} mm</span>
              </div>
              <div className="text-center p-2 rounded-lg bg-slate-800/20">
                <span className="block text-[10px] text-slate-500 font-bold uppercase">Humidity</span>
                <span className="text-sm font-bold text-white">{weather.humidity}%</span>
              </div>
              <div className="text-center p-2 rounded-lg bg-slate-800/20">
                <span className="block text-[10px] text-slate-500 font-bold uppercase">Wind</span>
                <span className="text-sm font-bold text-white">{weather.windSpeed} km/h</span>
              </div>
            </div>
          )}
          {weather && (
            <p className="text-[9px] text-slate-600 mt-2 text-right">Source: {weather.source}</p>
          )}
        </div>

        {/* AI Briefing */}
        <div className="glass-card p-6 flex flex-col justify-between border-slate-800">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <Zap className="h-4 w-4 text-cyan-400" />
                <span>AI Daily Briefing</span>
              </h3>
              <span className="text-[10px] bg-cyan-500/10 text-cyan-400 px-2 py-0.5 rounded font-bold uppercase tracking-wider">
                Live Data
              </span>
            </div>

            {isGeneratingBriefing ? (
              <div className="space-y-2 mt-2">
                <div className="h-3 bg-slate-800 rounded shimmer w-full" />
                <div className="h-3 bg-slate-800 rounded shimmer w-5/6" />
                <div className="h-3 bg-slate-800 rounded shimmer w-4/5" />
                <div className="h-3 bg-slate-800 rounded shimmer w-full" />
              </div>
            ) : (
              <p className="text-xs text-slate-300 leading-relaxed italic mt-1">
                &quot;{briefing}&quot;
              </p>
            )}
          </div>

          <div className="flex items-center gap-2 border-t border-slate-800/80 pt-4 mt-6">
            <button
              onClick={generateAIBriefing}
              className="text-xs font-semibold text-cyan-400 hover:text-cyan-300 transition-colors"
            >
              🔄 Refresh Briefing
            </button>
            <span className="text-slate-700">|</span>
            <button
              onClick={() => setActiveTab("chat")}
              className="text-xs font-semibold text-slate-400 hover:text-white transition-colors"
            >
              Ask details on Chat
            </button>
          </div>
        </div>
      </div>

      {/* Active Alerts — Real Data */}
      <div className="glass-card p-6 border-slate-800">
        <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-amber-500" />
          <span>Active Disaster Alerts</span>
          <span className="text-[10px] bg-green-500/10 text-green-400 px-2 py-0.5 rounded font-bold uppercase ml-auto">
            NDMA SACHET — Live
          </span>
        </h3>
        {alertsLoading ? (
          <div className="flex items-center gap-2 text-slate-400 py-4">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span className="text-xs">Fetching live alerts from NDMA...</span>
          </div>
        ) : alerts.length === 0 ? (
          <p className="text-xs text-slate-500 py-4">No active disaster alerts at this time.</p>
        ) : (
          <div className="space-y-3">
            {alerts.map((alert) => (
              <div
                key={alert.id}
                className={`p-4 rounded-xl border flex flex-col md:flex-row md:items-center justify-between gap-4 transition-all duration-200 ${getSeverityBg(alert.severityColor)}`}
              >
                <div className="flex items-start gap-3">
                  <span className="text-2xl mt-0.5">{getAlertTypeIcon(alert.disasterType)}</span>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold">
                        {alert.disasterType}
                      </span>
                      <span className="text-[10px] bg-slate-900/10 px-2 py-0.5 rounded font-bold uppercase">
                        {alert.source}
                      </span>
                    </div>
                    <p className="text-xs mt-1 opacity-80">{alert.area}</p>
                    <p className="text-[11px] font-semibold mt-1 opacity-70 line-clamp-2">
                      {alert.message}
                    </p>
                  </div>
                </div>
                <div className="text-right flex flex-col items-end gap-1.5 min-w-[120px]">
                  <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${
                    alert.severityColor === "red" ? "bg-red-100 text-red-700" :
                    alert.severityColor === "orange" ? "bg-orange-100 text-orange-700" :
                    "bg-yellow-100 text-yellow-700"
                  }`}>
                    {alert.severity}
                  </span>
                  {alert.effectiveEnd && (
                    <span className="text-[10px] font-medium opacity-60">
                      Until: {alert.effectiveEnd}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
