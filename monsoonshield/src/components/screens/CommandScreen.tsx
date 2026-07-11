"use client";

import { useState } from "react";
import { Play } from "lucide-react";

const REFERENCE_VOLUNTEERS = [
  { id: "v1", name: "SDRF Unit Alpha", skills: ["Water Rescue", "Boat Operations"], available: true, distance: "2.1 km" },
  { id: "v2", name: "NDRF Team 4", skills: ["Flood Rescue", "Medical First Aid"], available: false, distance: "5.4 km" },
  { id: "v3", name: "Red Cross Pune", skills: ["Medical", "Shelter Management"], available: true, distance: "3.8 km" },
  { id: "v4", name: "Local Volunteer Cell", skills: ["Coordination", "Supply Distribution"], available: true, distance: "1.2 km" },
];

export default function CommandScreen() {
  const [sosAlerts, setSosAlerts] = useState([
    { id: "sos-101", user: "Ramesh P.", members: 4, needs: ["rescue", "medical"], location: "Bibwewadi, Lane 4", time: "12m ago", status: "unassigned" },
    { id: "sos-102", user: "Savita K.", members: 2, needs: ["medical"], location: "Katraj Bridge area", time: "18m ago", status: "assigned", assignee: "NDRF Unit 4" },
    { id: "sos-103", user: "Deepak S.", members: 5, needs: ["food"], location: "Yerwada low lying", time: "25m ago", status: "unassigned" },
  ]);

  const [activeTab, setActiveTab] = useState<"sos" | "volunteers">("sos");

  const assignRescue = (id: string, unit: string) => {
    setSosAlerts((prev) =>
      prev.map((alert) =>
        alert.id === id ? { ...alert, status: "assigned", assignee: unit } : alert
      )
    );
    alert(`Dispatched ${unit} to rescue location.`);
  };

  const resolveSos = (id: string) => {
    setSosAlerts((prev) => prev.filter((alert) => alert.id !== id));
    alert("SOS emergency resolved. Mark as safe.");
  };

  return (
    <div className="p-6 space-y-6 max-h-[calc(100vh-73px)] overflow-y-auto w-full">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
            🛡️ SDRF & Municipal Command Center
          </h2>
          <p className="text-xs text-slate-400 mt-1">Official disaster agency dispatch command room</p>
        </div>
        <span className="px-3 py-1 rounded bg-red-600 text-[10px] font-bold text-white uppercase tracking-wider animate-pulse">
          🔴 Emergency Active Operations
        </span>
      </div>

      {/* Operational stats bar */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="stat-card border-red-500/20 bg-red-500/5">
          <span className="text-2xl font-extrabold text-red-500">{sosAlerts.length}</span>
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide mt-1">
            Active SOS Signals
          </span>
        </div>
        <div className="stat-card">
          <span className="text-2xl font-extrabold text-green-400">12</span>
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide mt-1">
            Active Shelters
          </span>
        </div>
        <div className="stat-card">
          <span className="text-2xl font-extrabold text-blue-400">8</span>
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide mt-1">
            NDRF Boats deployed
          </span>
        </div>
        <div className="stat-card">
          <span className="text-2xl font-extrabold text-cyan-400">142</span>
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide mt-1">
            Volunteers deployed
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Alerts & Signals Panel */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex border-b border-slate-850">
            <button
              onClick={() => setActiveTab("sos")}
              className={`px-4 py-2 text-xs font-bold uppercase tracking-wider border-b-2 transition-all ${
                activeTab === "sos"
                  ? "border-red-500 text-red-400"
                  : "border-transparent text-slate-500 hover:text-slate-300"
              }`}
            >
              Citizen SOS Dispatch Queue
            </button>
            <button
              onClick={() => setActiveTab("volunteers")}
              className={`px-4 py-2 text-xs font-bold uppercase tracking-wider border-b-2 transition-all ${
                activeTab === "volunteers"
                  ? "border-cyan-500 text-cyan-400"
                  : "border-transparent text-slate-500 hover:text-slate-300"
              }`}
            >
              Volunteer Deployments
            </button>
          </div>

          {activeTab === "sos" ? (
            <div className="space-y-3">
              {sosAlerts.length === 0 ? (
                <div className="glass-card p-8 border-slate-850 text-center text-slate-500 text-sm">
                  All Citizen SOS rescue signals resolved! No pending cases.
                </div>
              ) : (
                sosAlerts.map((alert) => (
                  <div key={alert.id} className="glass-card p-5 border-slate-800 space-y-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2">
                        <span className="h-2 w-2 rounded-full bg-red-500 animate-ping" />
                        <h4 className="font-bold text-white text-sm">{alert.user} ({alert.members} People)</h4>
                      </div>
                      <span className="text-[10px] text-slate-500 font-medium">{alert.time}</span>
                    </div>

                    <div className="text-xs space-y-1">
                      <div className="flex justify-between">
                        <span className="text-slate-500 font-medium">Location:</span>
                        <span className="font-bold text-slate-300">{alert.location}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500 font-medium">Reported Needs:</span>
                        <span className="font-semibold text-red-400">{alert.needs.join(", ")}</span>
                      </div>
                    </div>

                    <div className="border-t border-slate-850 pt-3 flex gap-2 justify-end">
                      {alert.status === "unassigned" ? (
                        <>
                          <button
                            onClick={() => assignRescue(alert.id, "Local Volunteer Team")}
                            className="px-3 py-1.5 rounded bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-300 transition-colors"
                          >
                            Assign Volunteer
                          </button>
                          <button
                            onClick={() => assignRescue(alert.id, "NDRF Unit 4")}
                            className="px-3 py-1.5 rounded bg-gradient-to-r from-red-600 to-rose-500 hover:opacity-90 text-xs font-bold text-white transition-all flex items-center gap-1"
                          >
                            <Play className="h-3 w-3" /> Dispatch NDRF
                          </button>
                        </>
                      ) : (
                        <div className="flex justify-between items-center w-full">
                          <span className="text-xs text-green-400 font-semibold flex items-center gap-1">
                            ✅ Dispatched: {alert.assignee}
                          </span>
                          <button
                            onClick={() => resolveSos(alert.id)}
                            className="px-3 py-1.5 rounded bg-green-600 hover:bg-green-700 text-xs font-bold text-white transition-colors"
                          >
                            Resolve Case
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          ) : (
            <div className="space-y-2">
              {REFERENCE_VOLUNTEERS.map((v) => (
                <div key={v.id} className="p-4 rounded-xl bg-slate-900/60 border border-slate-850 flex items-center justify-between">
                  <div>
                    <span className="block font-bold text-white text-sm">{v.name}</span>
                    <span className="block text-xs text-slate-400 mt-0.5">Skills: {v.skills.join(", ")}</span>
                  </div>
                  <div className="text-right">
                    <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                      v.available ? "bg-green-500/10 text-green-400 border border-green-500/20" : "bg-slate-800 text-slate-500"
                    }`}>
                      {v.available ? "Available" : "Deployed"}
                    </span>
                    <span className="block text-[9px] text-slate-500 mt-1">Distance: {v.distance}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Resource inventory allocation */}
        <div className="glass-card p-5 border-slate-800 space-y-4">
          <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider">
            Catchment Resource Ledger
          </h3>
          <p className="text-xs text-slate-500">Live inventories at central SDRF Pune warehouse</p>

          <div className="space-y-3">
            {[
              { item: "Inflatable Power Boats", stock: 12, unit: "units", fill: 75 },
              { item: "Purified Water Boxes", stock: 1200, unit: "boxes", fill: 40 },
              { item: "Emergency Food Packets", stock: 2400, unit: "meals", fill: 60 },
              { item: "Dengue Medicine Vials", stock: 450, unit: "vials", fill: 90 },
            ].map((inv) => (
              <div key={inv.item} className="space-y-1">
                <div className="flex justify-between text-xs font-semibold">
                  <span className="text-slate-300">{inv.item}</span>
                  <span className="text-white">{inv.stock} {inv.unit}</span>
                </div>
                <div className="h-1.5 rounded-full bg-slate-850 overflow-hidden">
                  <div className="h-full bg-cyan-400" style={{ width: `${inv.fill}%` }} />
                </div>
              </div>
            ))}
          </div>

          <button
            onClick={() => alert("Requisitions sent to Central disaster relief storage.")}
            className="w-full mt-4 py-2.5 rounded-lg bg-slate-850 hover:bg-slate-800 text-xs font-semibold text-slate-200 border border-slate-750 transition-colors"
          >
            Requisition More Assets
          </button>
        </div>
      </div>
    </div>
  );
}
