"use client";

import { useState, useEffect, useCallback, useTransition } from "react";
import {
  AlertTriangle,
  MapPin,
  ChevronRight,
  Zap,
} from "lucide-react";
import { MOCK_ALERTS, MOCK_WEATHER, RISK_SCORE_FACTORS } from "@/lib/mockData";
import { getRiskColor, getRiskBgColor, getRiskLabel, getSeverityColor, getAlertIcon } from "@/lib/utils";
import { generateBriefing } from "@/lib/gemini";
import { useAuth } from "@/lib/AuthContext";
import { SidebarTab } from "@/components/layout/Sidebar";

interface DashboardScreenProps {
  setActiveTab: (tab: SidebarTab) => void;
  language: string;
}

export default function DashboardScreen({ setActiveTab, language }: DashboardScreenProps) {
  const { user } = useAuth();
  const [riskScore] = useState(58);
  const [briefing, setBriefing] = useState("");
  const [isGeneratingBriefing, setIsGeneratingBriefing] = useState(false);
  const [, startTransition] = useTransition();

  const generateAIBriefing = useCallback(() => {
    startTransition(async () => {
      setIsGeneratingBriefing(true);
      try {
        const result = await generateBriefing({
          location: user?.location || "Pune, Maharashtra",
          riskScore: riskScore,
          weather: `${MOCK_WEATHER.current.condition}, ${MOCK_WEATHER.current.temp}°C`,
          alerts: MOCK_ALERTS.map((a) => a.title),
          language: language,
        });
        setBriefing(result);
      } catch {
        if (language === "hi") {
          setBriefing("नमस्ते! आज पुणे में भारी बारिश की चेतावनी (ऑरेंज अलर्ट) जारी की गई है। अगले २४ घंटों में ६८ मिमी वर्षा होने की संभावना है। मूला नदी का जल स्तर सामान्य से १.२ मीटर ऊपर है। आपातकालीन किट तैयार रखें और यात्रा करने से बचें।");
        } else {
          setBriefing("Welcome! Today in Pune, an Orange Alert is active with heavy rainfall forecast. 68mm rain expected in the next 24 hours. The Mula river is at 1.2m above normal. Dengue cases have surged in Wards 3 & 5 — eliminate standing water. Prepare your emergency kit and delay unnecessary travel.");
        }
      } finally {
        setIsGeneratingBriefing(false);
      }
    });
  }, [user, riskScore, language]);

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
        {/* Risk Score & Profile Widget */}
        <div className="glass-card p-6 flex flex-col justify-between border-slate-800">
          <div>
            <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4">
              Your Household Risk Score
            </h3>
            <div className="flex items-center gap-6 mb-6">
              {/* Dial/Ring */}
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
                  <span className="block text-[9px] text-slate-500 font-bold tracking-widest uppercase">
                    Risk Index
                  </span>
                </div>
              </div>

              <div>
                <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-bold ${getRiskBgColor(riskScore)} ${getRiskColor(riskScore)}`}>
                  {getRiskLabel(riskScore)} RISK
                </span>
                <p className="text-xs text-slate-400 mt-2">
                  Based on: Ground floor flat, Wakad area, near drainage channel, 68mm rain.
                </p>
              </div>
            </div>
          </div>

          <div className="border-t border-slate-800/80 pt-4 space-y-3">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wide">Primary Factors:</h4>
            <div className="space-y-1.5">
              {RISK_SCORE_FACTORS.slice(0, 3).map((factor) => (
                <div key={factor.label} className="flex justify-between items-center text-xs">
                  <span className="text-slate-500">{factor.label}</span>
                  <span className="font-semibold text-slate-300">{factor.score}/100</span>
                </div>
              ))}
            </div>
            <button
              onClick={() => setActiveTab("prepare")}
              className="w-full mt-2 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 border border-slate-750 transition-colors flex items-center justify-center gap-1"
            >
              <span>Improve Score</span>
              <ChevronRight className="h-3 w-3" />
            </button>
          </div>
        </div>

        {/* Current Weather Widget */}
        <div className="glass-card p-6 flex flex-col justify-between border-slate-800 weather-gradient">
          <div>
            <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4">
              Current Weather — IMD
            </h3>
            <div className="flex items-center gap-4">
              <span className="text-5xl">🌧️</span>
              <div>
                <span className="text-3xl font-extrabold text-white">{MOCK_WEATHER.current.temp}°C</span>
                <span className="block text-sm text-cyan-400 font-semibold">{MOCK_WEATHER.current.condition}</span>
              </div>
            </div>
            <p className="text-xs text-slate-400 mt-4 leading-relaxed">
              {MOCK_WEATHER.current.description}
            </p>
          </div>

          <div className="grid grid-cols-3 gap-2 border-t border-slate-800/85 pt-4 mt-6">
            <div className="text-center p-2 rounded-lg bg-slate-800/20">
              <span className="block text-[10px] text-slate-500 font-bold uppercase">Rain 24h</span>
              <span className="text-sm font-bold text-white">{MOCK_WEATHER.current.rainfall24h} mm</span>
            </div>
            <div className="text-center p-2 rounded-lg bg-slate-800/20">
              <span className="block text-[10px] text-slate-500 font-bold uppercase">Humidity</span>
              <span className="text-sm font-bold text-white">{MOCK_WEATHER.current.humidity}%</span>
            </div>
            <div className="text-center p-2 rounded-lg bg-slate-800/20">
              <span className="block text-[10px] text-slate-500 font-bold uppercase">Wind</span>
              <span className="text-sm font-bold text-white">{MOCK_WEATHER.current.windSpeed} kmh</span>
            </div>
          </div>
        </div>

        {/* Gemini Daily Briefing Card */}
        <div className="glass-card p-6 flex flex-col justify-between border-slate-800">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <Zap className="h-4 w-4 text-cyan-400" />
                <span>AI Daily Briefing</span>
              </h3>
              <span className="text-[10px] bg-cyan-500/10 text-cyan-400 px-2 py-0.5 rounded font-bold uppercase tracking-wider">
                Gemini 2.5
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

      {/* Active Alerts Section */}
      <div className="glass-card p-6 border-slate-800">
        <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-amber-500" />
          <span>Active Regional Alerts & Advisories</span>
        </h3>
        <div className="space-y-3">
          {MOCK_ALERTS.map((alert) => (
            <div
              key={alert.id}
              className={`p-4 rounded-xl border flex flex-col md:flex-row md:items-center justify-between gap-4 transition-all duration-200 ${getSeverityColor(
                alert.severity
              )}`}
            >
              <div className="flex items-start gap-3">
                <span className="text-2xl mt-0.5">{getAlertIcon(alert.type)}</span>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-900">
                      {language === "hi" && alert.titleHi ? alert.titleHi : alert.title}
                    </span>
                    <span className="text-[10px] bg-slate-900/10 px-2 py-0.5 rounded font-bold uppercase">
                      {alert.source}
                    </span>
                  </div>
                  <p className="text-xs text-slate-700 mt-1">{alert.description}</p>
                  <p className="text-[11px] text-slate-800 font-semibold mt-1">
                    ⚠️ Required Action: {alert.actionRequired}
                  </p>
                </div>
              </div>
              <div className="text-right flex flex-col items-end gap-1.5 min-w-[120px]">
                <span className="text-[10px] font-bold text-slate-600 uppercase">
                  Area: {alert.area}
                </span>
                <span className="text-[10px] font-medium text-slate-600">
                  Until: {new Date(alert.validUntil).toLocaleTimeString()}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
