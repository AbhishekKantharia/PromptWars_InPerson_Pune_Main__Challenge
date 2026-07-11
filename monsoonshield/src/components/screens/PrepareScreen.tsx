"use client";

import { useState, useEffect } from "react";
import { Sparkles, CheckCircle2, Circle, ListTodo, Loader2 } from "lucide-react";
import { generatePreparednessplan } from "@/lib/gemini";
import { useAuth } from "@/lib/AuthContext";
import { useRealData } from "@/lib/RealDataContext";

export default function PrepareScreen() {
  const { user } = useAuth();
  const { riskScore } = useRealData();
  const [profile, setProfile] = useState({
    location: "Pune, Maharashtra",
    familySize: 4,
    hasChildren: true,
    hasElderly: true,
    hasMedicalConditions: true,
    homeType: "ground_floor",
    hasVehicle: true,
    floodRiskScore: 50,
  });

  // Update risk score from shared data
  useEffect(() => {
    setProfile(p => ({ ...p, floodRiskScore: riskScore }));
  }, [riskScore]);

  // Update location from user profile
  useEffect(() => {
    if (user?.location) {
      setProfile(p => ({ ...p, location: user.location }));
    }
  }, [user?.location]);

  const [isGenerating, setIsGenerating] = useState(false);
  const [activeTab, setActiveTab] = useState<"checklist" | "plan">("checklist");
  const [customPlan, setCustomPlan] = useState("");

  const [checklist, setChecklist] = useState([
    { id: "1", text: "Store 3-day emergency water supply (3L per person daily)", category: "critical", completed: false },
    { id: "2", text: "Keep regular prescription medicines stocked for 14 days", category: "critical", completed: false },
    { id: "3", text: "Assemble First Aid kit: bandage, antiseptic, thermometer", category: "critical", completed: false },
    { id: "4", text: "Upload critical documents (Aadhaar, insurance) to cloud", category: "critical", completed: false },
    { id: "5", text: "Pack waterproof bag with power banks, torch, whistle", category: "important", completed: false },
    { id: "6", text: "Clear ground-floor drainage & seal low-lying openings", category: "important", completed: false },
    { id: "7", text: "Set designated family reunion meeting point", category: "important", completed: false },
    { id: "8", text: "Check flood insurance details & emergency hotline", category: "ongoing", completed: false },
  ]);

  const toggleCheck = (id: string) => {
    setChecklist((prev) =>
      prev.map((item) => (item.id === id ? { ...item, completed: !item.completed } : item))
    );
  };

  const handleGeneratePlan = async () => {
    setIsGenerating(true);
    setCustomPlan("");
    setActiveTab("plan");
    try {
      const planText = await generatePreparednessplan(profile, (partial) => {
        setCustomPlan(partial);
      });
      setCustomPlan(planText);
    } catch (err) {
      console.error(err);
    } finally {
      setIsGenerating(false);
    }
  };

  const completedCount = checklist.filter((item) => item.completed).length;
  const progressPercent = Math.round((completedCount / checklist.length) * 100);

  return (
    <div className="p-6 space-y-6 max-h-[calc(100vh-73px)] overflow-y-auto w-full">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
            📋 Preparedness & Evacuation Planner
          </h2>
          <p className="text-xs text-slate-400 mt-1">Get custom checklists & safety guides</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profile configuration parameters */}
        <div className="glass-card p-6 border-slate-800 space-y-4">
          <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider">
            1. Configure Household Profile
          </h3>

          <div className="space-y-3">
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1">Location</label>
              <input
                type="text"
                value={profile.location}
                onChange={(e) => setProfile({ ...profile, location: e.target.value })}
                className="w-full px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs text-white"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Family Size</label>
                <input
                  type="number"
                  value={profile.familySize}
                  onChange={(e) => setProfile({ ...profile, familySize: parseInt(e.target.value) || 1 })}
                  className="w-full px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs text-white"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Home Floor</label>
                <select
                  value={profile.homeType}
                  onChange={(e) => setProfile({ ...profile, homeType: e.target.value })}
                  className="w-full px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs text-white"
                >
                  <option value="ground_floor">Ground Floor</option>
                  <option value="upper_floor">Upper Floor</option>
                  <option value="basement">Basement</option>
                </select>
              </div>
            </div>

            <div className="space-y-2 border-t border-slate-800 pt-3">
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide">
                Special Conditions
              </label>
              <div className="space-y-1.5">
                {([
                  { key: "hasChildren" as const, label: "👶 Children under 12" },
                  { key: "hasElderly" as const, label: "👵 Elderly Members (65+)" },
                  { key: "hasMedicalConditions" as const, label: "🏥 Regular Medical Needs (Insulin, Dialysis)" },
                  { key: "hasVehicle" as const, label: "🚗 Family Vehicle (Car/Bike)" },
                ]).map((item) => (
                  <button
                    key={item.key}
                    onClick={() =>
                      setProfile({ ...profile, [item.key]: !profile[item.key] })
                    }
                    className={`w-full p-2 rounded-lg border text-left text-xs transition-colors flex justify-between items-center ${
                      profile[item.key]
                        ? "bg-cyan-500/10 border-cyan-500/30 text-cyan-400 font-semibold"
                        : "bg-slate-900/40 border-slate-850 text-slate-400 hover:bg-slate-850"
                    }`}
                  >
                    <span>{item.label}</span>
                    {profile[item.key] && <span>✓</span>}
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={handleGeneratePlan}
              className="w-full mt-2 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-500 hover:opacity-90 text-xs font-semibold text-white transition-all shadow-md shadow-blue-900/20 flex items-center justify-center gap-1.5"
            >
              <Sparkles className="h-4 w-4" />
              <span>Generate AI Plan (Gemini)</span>
            </button>
          </div>
        </div>

        {/* Tab view checklists / plan */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex border-b border-slate-850">
            <button
              onClick={() => setActiveTab("checklist")}
              className={`px-4 py-2 text-xs font-bold uppercase tracking-wider border-b-2 transition-all ${
                activeTab === "checklist"
                  ? "border-cyan-500 text-cyan-400"
                  : "border-transparent text-slate-500 hover:text-slate-300"
              }`}
            >
              Checklist Generator
            </button>
            <button
              onClick={() => setActiveTab("plan")}
              className={`px-4 py-2 text-xs font-bold uppercase tracking-wider border-b-2 transition-all ${
                activeTab === "plan"
                  ? "border-cyan-500 text-cyan-400"
                  : "border-transparent text-slate-500 hover:text-slate-300"
              }`}
            >
              AI Custom Plan
            </button>
          </div>

          {activeTab === "checklist" ? (
            <div className="space-y-4">
              {/* Progress summary */}
              <div className="glass-card p-5 border-slate-850 flex items-center justify-between gap-4">
                <div className="flex-1">
                  <span className="block text-xs font-bold text-slate-400 uppercase">Preparation Progress</span>
                  <div className="flex items-center gap-3 mt-1.5">
                    <div className="flex-1 h-2.5 rounded-full bg-slate-800 overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-blue-500 to-cyan-400 transition-all duration-500"
                        style={{ width: `${progressPercent}%` }}
                      />
                    </div>
                    <span className="text-xs font-bold text-white">{progressPercent}%</span>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-2xl font-extrabold text-white">
                    {completedCount}/{checklist.length}
                  </span>
                  <span className="block text-[9px] text-slate-500 font-bold uppercase mt-0.5">Tasks Done</span>
                </div>
              </div>

              {/* List */}
              <div className="space-y-2">
                {checklist.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => toggleCheck(item.id)}
                    className={`checklist-item w-full text-left bg-slate-900/60 border-slate-800 ${
                      item.completed ? "completed border-slate-850" : ""
                    }`}
                  >
                    {item.completed ? (
                      <CheckCircle2 className="h-5 w-5 text-cyan-500 mt-0.5" />
                    ) : (
                      <Circle className="h-5 w-5 text-slate-600 mt-0.5" />
                    )}
                    <div>
                      <span className={`block text-xs ${item.completed ? "line-through text-slate-500" : "text-white"}`}>
                        {item.text}
                      </span>
                      <span className={`inline-block text-[9px] uppercase font-bold mt-1 px-2 py-0.5 rounded ${
                        item.category === "critical"
                          ? "bg-red-500/10 text-red-400"
                          : item.category === "important"
                          ? "bg-amber-500/10 text-amber-400"
                          : "bg-blue-500/10 text-blue-400"
                      }`}>
                        {item.category}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="glass-card p-6 border-slate-850 min-h-[300px]">
              {isGenerating && !customPlan ? (
                <div className="flex flex-col items-center justify-center min-h-[250px] space-y-4">
                  <LoaderIcon />
                  <span className="text-xs text-slate-400">Fetching real-time data and generating your plan...</span>
                </div>
              ) : customPlan ? (
                <div className="space-y-3">
                  {isGenerating && (
                    <div className="flex items-center gap-2 text-cyan-400 text-[10px] font-semibold uppercase tracking-wider mb-2">
                      <Loader2 className="h-3 w-3 animate-spin" />
                      <span>Generating...</span>
                    </div>
                  )}
                  <div className="prose prose-invert prose-xs max-w-none space-y-4 text-slate-300">
                    <div className="whitespace-pre-line text-xs leading-relaxed">
                      {customPlan}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center min-h-[250px] text-center p-6 space-y-2">
                  <ListTodo className="h-12 w-12 text-slate-600" />
                  <h4 className="font-bold text-white text-sm">No Custom Plan Generated</h4>
                  <p className="text-xs text-slate-400 max-w-xs">
                    Choose your family composition parameters on the left and tap &apos;Generate AI Plan&apos; to create personalized NDMA-grounded protocols.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function LoaderIcon() {
  return (
    <div className="relative flex items-center justify-center">
      <div className="h-10 w-10 rounded-full border-4 border-slate-800 border-t-cyan-400 animate-spin" />
    </div>
  );
}
