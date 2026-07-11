"use client";

import React, { useState } from "react";
import {
  Thermometer, Droplets, Wind, Bug, AlertTriangle, Phone,
  ChevronRight, Activity, Pill, Heart, Shield
} from "lucide-react";

const DISEASE_ALERTS = [
  { disease: "Dengue", risk: "high", cases: 142, area: "Wards 3, 5, 8", trend: "rising", icon: "🦟" },
  { disease: "Malaria", risk: "medium", cases: 67, area: "Wards 12, 15", trend: "stable", icon: "🩸" },
  { disease: "Cholera", risk: "low", cases: 8, area: "Ward 21", trend: "declining", icon: "💧" },
  { disease: "Leptospirosis", risk: "medium", cases: 23, area: "River-adjacent areas", trend: "rising", icon: "🐀" },
];

const PREVENTION_CHECKLIST = [
  { id: 1, label: "Empty flower pots, coolers, tires weekly", category: "mosquito", done: false },
  { id: 2, label: "Use mosquito nets while sleeping", category: "mosquito", done: false },
  { id: 3, label: "Apply DEET-based repellent at dusk", category: "mosquito", done: false },
  { id: 4, label: "Boil drinking water or use RO + chlorine", category: "water", done: false },
  { id: 5, label: "Wash hands with soap for 20 seconds", category: "hygiene", done: false },
  { id: 6, label: "Avoid street food during heavy rains", category: "food", done: false },
  { id: 7, label: "Cook fresh — don&apos;t eat overnight leftovers", category: "food", done: false },
  { id: 8, label: "Wear full sleeves at dawn/dusk", category: "mosquito", done: false },
  { id: 9, label: "Clean roof gutters and drains", category: "environment", done: false },
  { id: 10, label: "Store ORS packets and zinc tablets", category: "medicine", done: false },
];

const WARNING_SIGNS = [
  { symptom: "High fever (>101°F) with shivering", urgency: "high", action: "Visit hospital immediately" },
  { symptom: "Severe headache with stiff neck", urgency: "high", action: "Call 108, possible meningitis" },
  { symptom: "Blood in vomit or stool", urgency: "high", action: "Emergency — call 112" },
  { symptom: "Difficulty breathing", urgency: "high", action: "Call 108 immediately" },
  { symptom: "Persistent diarrhea >24 hours", urgency: "medium", action: "ORS + doctor within 12 hours" },
  { symptom: "Skin rash with joint pain", urgency: "medium", action: "Possible dengue — get tested" },
];

export default function HealthScreen() {
  const [checklist, setChecklist] = useState(PREVENTION_CHECKLIST);
  const [activeFilter, setActiveFilter] = useState("all");

  const toggleCheck = (id: number) => {
    setChecklist((prev) => prev.map((item) => (item.id === id ? { ...item, done: !item.done } : item)));
  };

  const completedCount = checklist.filter((i) => i.done).length;
  const progress = Math.round((completedCount / checklist.length) * 100);

  const filteredChecklist = activeFilter === "all" ? checklist : checklist.filter((i) => i.category === activeFilter);

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-white flex items-center gap-2">
          🏥 Monsoon Health Center
        </h2>
        <p className="text-xs text-slate-400 mt-1">Disease surveillance, prevention checklists, and health advisories</p>
      </div>

      {/* Disease Alerts */}
      <div className="glass-card p-6 space-y-4">
        <h3 className="text-sm font-bold text-white uppercase tracking-wide flex items-center gap-2">
          <Bug className="h-4 w-4 text-amber-400" />
          Active Disease Surveillance — IDSP
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {DISEASE_ALERTS.map((d) => (
            <div
              key={d.disease}
              className={`p-4 rounded-xl border ${
                d.risk === "high"
                  ? "bg-red-500/5 border-red-500/20"
                  : d.risk === "medium"
                  ? "bg-amber-500/5 border-amber-500/20"
                  : "bg-green-500/5 border-green-500/20"
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">{d.icon}</span>
                  <div>
                    <p className="text-sm font-bold text-white">{d.disease}</p>
                    <p className="text-[11px] text-slate-400">{d.area}</p>
                  </div>
                </div>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                  d.risk === "high" ? "bg-red-500/20 text-red-400" : d.risk === "medium" ? "bg-amber-500/20 text-amber-400" : "bg-green-500/20 text-green-400"
                }`}>
                  {d.risk} risk
                </span>
              </div>
              <div className="flex items-center justify-between mt-3 text-xs text-slate-400">
                <span>Cases: <span className="text-white font-bold">{d.cases}</span></span>
                <span>Trend: <span className={d.trend === "rising" ? "text-red-400" : d.trend === "stable" ? "text-amber-400" : "text-green-400"}>{d.trend}</span></span>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Prevention Checklist */}
        <div className="glass-card p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white uppercase tracking-wide">Prevention Checklist</h3>
            <span className="text-xs text-cyan-400 font-semibold">{completedCount}/{checklist.length}</span>
          </div>
          <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full transition-all" style={{ width: `${progress}%` }} />
          </div>
          <div className="flex flex-wrap gap-1.5">
            {["all", "mosquito", "water", "food", "hygiene", "medicine"].map((f) => (
              <button
                key={f}
                onClick={() => setActiveFilter(f)}
                className={`px-2.5 py-1 rounded-lg text-[10px] font-semibold transition-colors ${
                  activeFilter === f ? "bg-cyan-500/10 text-cyan-400 border border-cyan-500/30" : "bg-slate-800 text-slate-500 border border-slate-700"
                }`}
              >
                {f.charAt(0).toUpperCase() + f.slice(1)}
              </button>
            ))}
          </div>
          <div className="space-y-1.5 max-h-64 overflow-y-auto">
            {filteredChecklist.map((item) => (
              <button
                key={item.id}
                onClick={() => toggleCheck(item.id)}
                className={`w-full flex items-center gap-3 p-3 rounded-lg text-left text-sm transition-all ${
                  item.done ? "bg-green-500/5 border border-green-500/20" : "bg-slate-800/50 border border-slate-700/50 hover:border-slate-600"
                }`}
              >
                <div className={`h-5 w-5 rounded-md flex items-center justify-center shrink-0 ${
                  item.done ? "bg-green-500 text-white" : "bg-slate-700 border border-slate-600"
                }`}>
                  {item.done && <span className="text-xs">✓</span>}
                </div>
                <span className={item.done ? "text-slate-400 line-through" : "text-white"}>{item.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Warning Signs */}
        <div className="glass-card p-6 space-y-4">
          <h3 className="text-sm font-bold text-white uppercase tracking-wide flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-red-400" />
            Warning Signs — See a Doctor If:
          </h3>
          <div className="space-y-2">
            {WARNING_SIGNS.map((sign, i) => (
              <div key={i} className={`p-3 rounded-lg border ${
                sign.urgency === "high" ? "bg-red-500/5 border-red-500/20" : "bg-amber-500/5 border-amber-500/20"
              }`}>
                <div className="flex items-start justify-between gap-2">
                  <p className="text-sm font-medium text-white">{sign.symptom}</p>
                  <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded shrink-0 ${
                    sign.urgency === "high" ? "bg-red-500/20 text-red-400" : "bg-amber-500/20 text-amber-400"
                  }`}>
                    {sign.urgency}
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-1">→ {sign.action}</p>
              </div>
            ))}
          </div>
          <div className="flex gap-2 pt-2">
            <a href="tel:108" className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl bg-red-600 text-white text-xs font-bold">
              <Phone className="h-3.5 w-3.5" /> Ambulance 108
            </a>
            <a href="tel:104" className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl bg-slate-800 text-white text-xs font-bold border border-slate-700">
              <Phone className="h-3.5 w-3.5" /> Health Helpline 104
            </a>
          </div>
        </div>
      </div>

      {/* Health Tips */}
      <div className="glass-card p-6">
        <h3 className="text-sm font-bold text-white uppercase tracking-wide mb-3">Monsoon Health Tips</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs text-slate-400 space-y-2">
          <div className="p-3 rounded-lg bg-slate-800/50 border border-slate-700/50">
            <Droplets className="h-5 w-5 text-blue-400 mb-2" />
            <p className="text-white font-semibold mb-1">Water Safety</p>
            <p>Always boil water for 10+ minutes during floods. Use chlorine tablets as backup. Contaminated water is the #1 health risk.</p>
          </div>
          <div className="p-3 rounded-lg bg-slate-800/50 border border-slate-700/50">
            <Wind className="h-5 w-5 text-cyan-400 mb-2" />
            <p className="text-white font-semibold mb-1">Air Quality</p>
            <p>Mold and dampness increase respiratory issues. Use masks in waterlogged areas. Keep indoor ventilation active.</p>
          </div>
          <div className="p-3 rounded-lg bg-slate-800/50 border border-slate-700/50">
            <Heart className="h-5 w-5 text-red-400 mb-2" />
            <p className="text-white font-semibold mb-1">Mental Health</p>
            <p>Disaster anxiety is normal. Talk to family. Call iCall: 9152987821 or Vandrevala Foundation: 1860-2662-345.</p>
          </div>
        </div>
      </div>

      <div className="p-3 rounded-lg bg-blue-500/10 border border-blue-500/30 text-xs text-blue-300 flex items-center gap-2">
        <Shield className="h-4 w-4 shrink-0" />
        Sources: MOHFW Monsoon Health Guidelines | NVBDCP | IDSP Real-Time Surveillance | WHO India
      </div>
    </div>
  );
}
