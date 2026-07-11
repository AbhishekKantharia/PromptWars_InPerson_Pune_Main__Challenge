"use client";

import { Sparkles, AlertTriangle, ArrowRight } from "lucide-react";
import { MOCK_ALERTS } from "@/lib/mockData";
import { SidebarTab } from "@/components/layout/Sidebar";

interface HomeScreenProps {
  setActiveTab: (tab: SidebarTab) => void;
  setShowEmergencyModal: (show: boolean) => void;
}

const drops = Array.from({ length: 40 }).map((_, i) => ({
  id: i,
  left: `${Math.random() * 100}%`,
  delay: `${Math.random() * 5}s`,
  duration: `${1.5 + Math.random() * 1.5}s`,
}));

export default function HomeScreen({ setActiveTab }: HomeScreenProps) {

  return (
    <div className="relative min-h-[calc(100vh-73px)] w-full hero-gradient flex flex-col items-center justify-center p-8 overflow-hidden">
      {/* Rain Effect */}
      <div className="rain-container">
        {drops.map((drop) => (
          <div
            key={drop.id}
            className="raindrop"
            style={{
              left: drop.left,
              animationDelay: drop.delay,
              animationDuration: drop.duration,
              height: "20px",
            }}
          />
        ))}
      </div>

      <div className="relative z-10 w-full max-w-5xl flex flex-col items-center text-center">
        {/* Animated Badge */}
        <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/30 text-cyan-400 text-xs font-semibold uppercase tracking-wider mb-6 float-animation">
          <Sparkles className="h-3.5 w-3.5" />
          <span>India&apos;s AI-Native Disaster Shield</span>
        </div>

        {/* Hero Headline */}
        <h1 className="text-4xl md:text-6xl font-bold tracking-tight text-white mb-6 max-w-3xl leading-tight">
          Prepare, Protect & Survive the{" "}
          <span className="gradient-text">Indian Monsoon</span>
        </h1>

        {/* Subtitle */}
        <p className="text-slate-400 text-lg md:text-xl max-w-2xl mb-8 leading-relaxed">
          Get personalized preparation plans, weather-aware evacuation routing, and real-time community coordination — powered by Google Gemini AI.
        </p>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center justify-center gap-4 mb-16">
          <button
            onClick={() => setActiveTab("dashboard")}
            className="btn-primary flex items-center gap-2"
          >
            <span>Enter Dashboard</span>
            <ArrowRight className="h-4 w-4" />
          </button>
          <button
            onClick={() => setActiveTab("chat")}
            className="px-6 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700/50 hover:text-white transition-all font-semibold flex items-center gap-2"
          >
            <span>Ask Varsha AI</span>
            <Sparkles className="h-4 w-4 text-cyan-400" />
          </button>
          <button
            onClick={() => setActiveTab("sos")}
            className="btn-danger flex items-center gap-2"
          >
            <span>Emergency SOS</span>
            <AlertTriangle className="h-4 w-4 animate-bounce" />
          </button>
        </div>

        {/* Live System Stats */}
        <div className="w-full grid grid-cols-2 md:grid-cols-4 gap-4 mb-16">
          <div className="stat-card">
            <span className="text-3xl font-extrabold text-white">100M+</span>
            <span className="text-xs font-medium text-slate-400 mt-1 uppercase tracking-wider">
              Protected Households
            </span>
          </div>
          <div className="stat-card">
            <span className="text-3xl font-extrabold text-green-400">15 min</span>
            <span className="text-xs font-medium text-slate-400 mt-1 uppercase tracking-wider">
              Avg Response Time
            </span>
          </div>
          <div className="stat-card">
            <span className="text-3xl font-extrabold text-cyan-400">85%</span>
            <span className="text-xs font-medium text-slate-400 mt-1 uppercase tracking-wider">
              Prediction Accuracy
            </span>
          </div>
          <div className="stat-card">
            <span className="text-3xl font-extrabold text-blue-400">22</span>
            <span className="text-xs font-medium text-slate-400 mt-1 uppercase tracking-wider">
              Indian Languages
            </span>
          </div>
        </div>

        {/* Quick Alert Bar */}
        {MOCK_ALERTS.length > 0 && (
          <div className="w-full glass-card p-4 flex flex-col md:flex-row items-center justify-between gap-4 text-left border-amber-500/20 bg-amber-500/5">
            <div className="flex items-center gap-3">
              <span className="text-2xl animate-pulse">⚠️</span>
              <div>
                <span className="block text-xs font-semibold text-amber-400 uppercase tracking-wide">
                  Active Regional Alert
                </span>
                <span className="block text-sm font-semibold text-white">
                  {MOCK_ALERTS[0]?.title} — {MOCK_ALERTS[0]?.area}
                </span>
              </div>
            </div>
            <button
              onClick={() => setActiveTab("dashboard")}
              className="text-sm font-bold text-cyan-400 hover:text-cyan-300 flex items-center gap-1 transition-colors group"
            >
              <span>View Details</span>
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
