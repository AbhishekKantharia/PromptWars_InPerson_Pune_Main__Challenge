"use client";

import React, { useState } from "react";
import { Heart, MapPin, Phone, Users, ShieldAlert, CheckCircle, Navigation } from "lucide-react";

export default function FamilyScreen() {
  const [members, setMembers] = useState([
    { name: "Priya S. (You)", status: "SAFE", location: "Home (Wakad)", time: "10 min ago", icon: "👩" },
    { name: "Arun S. (Husband)", status: "SAFE", location: "Office (Hinjewadi)", time: "25 min ago", icon: "👨" },
    { name: "Karan S. (Son)", status: "SAFE", location: "Wakad High School", time: "1 hr ago", icon: "👦" },
    { name: "Sushila S. (Mother)", status: "UNCHECKED", location: "Home (Wakad)", time: "--", icon: "👵" },
  ]);

  const [activeDrill, setActiveDrill] = useState(false);
  const [drillStep, setDrillStep] = useState(0);

  const handleCheckIn = () => {
    setMembers((prev) =>
      prev.map((m) =>
        m.name.includes("You")
          ? { ...m, status: "SAFE", location: "Shelter No. 1", time: "Just now" }
          : m
      )
    );
    alert("Checked in as SAFE at Shelter No. 1! Family members notified.");
  };

  const startDrill = () => {
    setActiveDrill(true);
    setDrillStep(1);
  };

  const nextDrillStep = () => {
    if (drillStep < 4) {
      setDrillStep(drillStep + 1);
    } else {
      setActiveDrill(false);
      setDrillStep(0);
      alert("Evacuation drill completed! Your family is ready.");
    }
  };

  return (
    <div className="p-6 space-y-6 max-h-[calc(100vh-73px)] overflow-y-auto w-full">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
            👨‍👩‍👧‍👦 Family Safety & Evacuation Drills
          </h2>
          <p className="text-xs text-slate-400 mt-1">Reunification planning and status check-in</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Family check ins list */}
        <div className="lg:col-span-2 glass-card p-6 border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider">
              Family Check-In Board
            </h3>
            <button
              onClick={handleCheckIn}
              className="text-xs font-bold text-cyan-400 hover:text-cyan-300 transition-colors"
            >
              Check-In Now
            </button>
          </div>

          <div className="space-y-3">
            {members.map((member) => (
              <div key={member.name} className="p-4 rounded-xl bg-slate-900/60 border border-slate-850 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{member.icon}</span>
                  <div>
                    <span className="block font-bold text-white text-sm">{member.name}</span>
                    <span className="block text-xs text-slate-400 flex items-center gap-0.5">
                      <MapPin className="h-3 w-3 text-slate-500" /> {member.location}
                    </span>
                  </div>
                </div>

                <div className="text-right">
                  <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                    member.status === "SAFE"
                      ? "bg-green-500/10 text-green-400 border border-green-500/20"
                      : "bg-amber-500/10 text-amber-400 border border-amber-500/20 animate-pulse"
                  }`}>
                    {member.status}
                  </span>
                  <span className="block text-[9px] text-slate-500 font-medium mt-1">
                    Checked in: {member.time}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Evacuation drill simulator */}
        <div className="glass-card p-6 border-slate-800 flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-2">
              Evacuation Drill Simulator
            </h3>
            <p className="text-xs text-slate-400 mb-4 leading-relaxed">
              Conduct gamified exercises to prepare your family for real emergency responses.
            </p>

            {activeDrill ? (
              <div className="p-4 rounded-xl bg-cyan-500/5 border border-cyan-500/20 space-y-3">
                <div className="flex justify-between items-baseline text-xs">
                  <span className="font-bold text-cyan-400">Drill in Progress</span>
                  <span className="text-[10px] text-slate-500">Step {drillStep}/4</span>
                </div>

                {drillStep === 1 && (
                  <p className="text-xs text-slate-200">
                    🔴 **Step 1:** Grab the emergency kit. Make sure flashlight, water bottle, and medicines are packed.
                  </p>
                )}
                {drillStep === 2 && (
                  <p className="text-xs text-slate-200">
                    🔴 **Step 2:** Switch off main power breaker. Unplug sensitive appliances to avoid damage or fires.
                  </p>
                )}
                {drillStep === 3 && (
                  <p className="text-xs text-slate-200">
                    🔴 **Step 3:** Lock all doors and move to higher levels or identify safe exit route towards Shelter No. 1.
                  </p>
                )}
                {drillStep === 4 && (
                  <p className="text-xs text-slate-200">
                    🔴 **Step 4:** Perform Safe Check-In on the MonsoonShield app to notify family members.
                  </p>
                )}

                <button
                  onClick={nextDrillStep}
                  className="w-full py-2 rounded-lg bg-cyan-600 hover:bg-cyan-700 text-xs font-bold text-white transition-colors"
                >
                  {drillStep === 4 ? "Finish Drill" : "Next Step"}
                </button>
              </div>
            ) : (
              <div className="text-center p-6 bg-slate-900/40 rounded-xl border border-slate-850 space-y-3">
                <Heart className="h-10 w-10 text-cyan-400 mx-auto" />
                <h4 className="font-bold text-white text-xs">Evacuation Readiness</h4>
                <p className="text-[11px] text-slate-500">
                  Last drill: June 15, 2026. Run a mock drill monthly.
                </p>
                <button
                  onClick={startDrill}
                  className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-200 border border-slate-750 transition-colors"
                >
                  Start Drill
                </button>
              </div>
            )}
          </div>

          <div className="border-t border-slate-850 pt-4 mt-6">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-2">Reunification Points:</h4>
            <div className="space-y-1">
              <div className="text-xs flex justify-between">
                <span className="text-slate-500">Primary Meeting Point</span>
                <span className="font-semibold text-slate-300">Wakad High School</span>
              </div>
              <div className="text-xs flex justify-between">
                <span className="text-slate-500">Emergency Out-of-Area Contact</span>
                <span className="font-semibold text-slate-300">Rohan S. (Mumbai)</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
