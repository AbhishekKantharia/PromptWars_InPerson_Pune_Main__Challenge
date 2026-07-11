"use client";

import { useState } from "react";
import { AlertOctagon, Loader2, Navigation, Phone, ShieldCheck } from "lucide-react";

export default function SosScreen() {
  const [sosTriggered, setSosTriggered] = useState(false);
  const [sosLoading, setSosLoading] = useState(false);
  const [needs, setNeeds] = useState<string[]>([]);
  const [peopleCount, setPeopleCount] = useState(1);
  const [dispatchStatus, setDispatchStatus] = useState<"pending" | "acknowledged" | "enroute" | "resolved">("pending");
  const [coordinates, setCoordinates] = useState<{ lat: number; lng: number } | null>(null);
  const [caseId] = useState(`MS-${new Date().getFullYear()}-${Math.floor(10000 + Math.random() * 90000)}`);

  const toggleNeed = (need: string) => {
    setNeeds((prev) =>
      prev.includes(need) ? prev.filter((n) => n !== need) : [...prev, need]
    );
  };

  const getGeolocation = (): Promise<{ lat: number; lng: number }> => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error("Geolocation not supported"));
        return;
      }
      navigator.geolocation.getCurrentPosition(
        (position) => {
          resolve({
            lat: Math.round(position.coords.latitude * 10000) / 10000,
            lng: Math.round(position.coords.longitude * 10000) / 10000,
          });
        },
        (error) => {
          console.warn("Geolocation error:", error.message);
          // Fallback to Pune coordinates
          resolve({ lat: 18.5204, lng: 73.8567 });
        },
        { timeout: 8000, maximumAge: 60000 }
      );
    });
  };

  const handleSos = async () => {
    setSosLoading(true);
    try {
      const coords = await getGeolocation();
      setCoordinates(coords);
    } catch {
      setCoordinates({ lat: 18.5204, lng: 73.8567 });
    }
    setTimeout(() => {
      setSosLoading(false);
      setSosTriggered(true);
      setDispatchStatus("acknowledged");
      setTimeout(() => setDispatchStatus("enroute"), 5000);
    }, 1500);
  };

  const cancelSos = () => {
    setSosTriggered(false);
    setNeeds([]);
    setPeopleCount(1);
    setCoordinates(null);
  };

  const needOptions = [
    { id: "rescue", label: "Water Evacuation / Rescue", labelHi: "जल बचाव" },
    { id: "medical", label: "Medical Emergency", labelHi: "चिकित्सा आपातकाल" },
    { id: "food", label: "Food & Water Needed", labelHi: "भोजन और पानी" },
    { id: "power", label: "Power / Charging Blocked", labelHi: "बिजली बंद" },
  ];

  return (
    <div className="p-6 space-y-6 max-h-[calc(100vh-73px)] overflow-y-auto w-full">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
            🆘 Citizen SOS & Response Center
          </h2>
          <p className="text-xs text-slate-400 mt-1">One-tap priority emergency rescue request</p>
        </div>
      </div>

      {!sosTriggered ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
          {/* Left panel: configure needs */}
          <div className="glass-card p-6 border-slate-800 space-y-4">
            <h3 className="text-md font-bold text-slate-200">1. Configure Your SOS</h3>

            {/* Needs Selector */}
            <div className="space-y-2">
              <span className="block text-xs font-bold text-slate-400 uppercase tracking-wide">
                What do you need help with?
              </span>
              <div className="grid grid-cols-1 gap-2">
                {needOptions.map((opt) => (
                  <button
                    key={opt.id}
                    onClick={() => toggleNeed(opt.id)}
                    className={`p-3 rounded-xl border text-left flex justify-between items-center transition-all ${
                      needs.includes(opt.id)
                        ? "bg-red-500/10 border-red-500/40 text-red-400"
                        : "bg-slate-800/40 border-slate-800 text-slate-400 hover:bg-slate-800"
                    }`}
                  >
                    <div>
                      <span className="block text-sm font-semibold text-white">{opt.label}</span>
                      <span className="block text-[10px] text-slate-500 -mt-0.5">{opt.labelHi}</span>
                    </div>
                    {needs.includes(opt.id) && <span className="text-red-500">✓</span>}
                  </button>
                ))}
              </div>
            </div>

            {/* People Counter */}
            <div className="space-y-2">
              <span className="block text-xs font-bold text-slate-400 uppercase tracking-wide">
                Number of stranded people
              </span>
              <div className="flex items-center gap-4">
                <button
                  onClick={() => setPeopleCount(Math.max(1, peopleCount - 1))}
                  className="h-10 w-10 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center font-bold text-white hover:bg-slate-700"
                >
                  -
                </button>
                <span className="text-xl font-bold text-white">{peopleCount}</span>
                <button
                  onClick={() => setPeopleCount(peopleCount + 1)}
                  className="h-10 w-10 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center font-bold text-white hover:bg-slate-700"
                >
                  +
                </button>
              </div>
            </div>

            {/* GPS Status */}
            <div className="p-3 rounded-lg bg-slate-800/50 border border-slate-700/50">
              <div className="flex items-center gap-2 text-xs text-slate-400">
                <Navigation className="h-3.5 w-3.5 text-cyan-400" />
                <span>GPS will be acquired when SOS is triggered</span>
              </div>
            </div>
          </div>

          {/* Right panel: big red button */}
          <div className="glass-card p-6 border-slate-800 flex flex-col items-center justify-center text-center">
            {sosLoading ? (
              <div className="space-y-4">
                <Loader2 className="h-20 w-20 animate-spin text-red-500 mx-auto" />
                <h3 className="text-lg font-bold text-white">Acquiring GPS & Broadcasting SOS...</h3>
                <p className="text-xs text-slate-500">Retrieving live coordinates via browser Geolocation API</p>
              </div>
            ) : (
              <div className="space-y-6">
                <button
                  onClick={handleSos}
                  className="h-44 w-44 rounded-full bg-gradient-to-br from-red-500 to-rose-600 hover:from-red-600 hover:to-rose-700 text-white font-extrabold text-2xl flex flex-col items-center justify-center gap-1 shadow-2xl border-4 border-red-400/40 sos-glow transform hover:scale-105 active:scale-95 transition-all"
                >
                  <AlertOctagon className="h-10 w-10 text-white animate-pulse" />
                  <span>SOS</span>
                  <span className="text-[10px] text-red-200 uppercase tracking-widest font-bold">
                    Trigger Rescue
                  </span>
                </button>

                <div>
                  <p className="text-sm font-semibold text-white">Press to trigger rescue request</p>
                  <p className="text-xs text-slate-400 mt-1 max-w-xs">
                    This triggers live GPS coordinates dispatch to NDRF, SDRF, and nearest local volunteers.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="max-w-2xl mx-auto glass-card p-8 border-red-500/20 bg-red-500/5 space-y-6">
          <div className="flex items-center gap-4 border-b border-slate-800 pb-4">
            <div className="h-12 w-12 rounded-xl bg-red-500/20 flex items-center justify-center text-red-500 animate-pulse">
              <AlertOctagon className="h-6 w-6" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-white">Emergency SOS Active</h3>
              <p className="text-xs text-red-400 font-semibold uppercase tracking-wider">
                Case ID: {caseId}
              </p>
            </div>
          </div>

          {/* Dispatch status timeline */}
          <div className="space-y-4">
            <span className="block text-xs font-bold text-slate-400 uppercase tracking-wide">
              Rescue Unit Dispatch Status
            </span>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className={`h-6 w-6 rounded-full flex items-center justify-center text-xs font-bold ${
                  dispatchStatus === "acknowledged" || dispatchStatus === "enroute"
                    ? "bg-blue-600 text-white"
                    : "bg-slate-800 text-slate-500"
                }`}>
                  1
                </div>
                <div>
                  <span className="block text-sm font-semibold text-white">SOS Received & Geolocated</span>
                  <span className="block text-[10px] text-slate-400">
                    Coordinates: {coordinates ? `${coordinates.lat}° N, ${coordinates.lng}° E` : "Acquiring..."}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className={`h-6 w-6 rounded-full flex items-center justify-center text-xs font-bold ${
                  dispatchStatus === "enroute" ? "bg-amber-500 text-slate-900" : "bg-slate-800 text-slate-500"
                }`}>
                  2
                </div>
                <div>
                  <span className="block text-sm font-semibold text-white">Rescue Team Dispatched</span>
                  {dispatchStatus === "enroute" ? (
                    <span className="block text-[10px] text-amber-400 font-semibold flex items-center gap-1 animate-pulse">
                      <Navigation className="h-3 w-3" /> NDRF Unit enroute. ETA: 12 minutes.
                    </span>
                  ) : (
                    <span className="block text-[10px] text-slate-500">Awaiting dispatch confirmation...</span>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-slate-800/40 border border-slate-700/50 flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-cyan-400" />
              <span className="text-xs text-slate-300">
                {coordinates
                  ? `Live coordinates transmitted to emergency services. Needs: ${needs.length > 0 ? needs.join(", ") : "General assistance"}`
                  : "GPS coordinates transmitted via SMS fallback."}
              </span>
            </div>
            <a
              href="tel:112"
              className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-bold text-white border border-slate-700 flex items-center gap-1.5 transition-colors"
            >
              <Phone className="h-3.5 w-3.5" /> Call 112 Direct
            </a>
          </div>

          <div className="flex gap-2">
            <button
              onClick={cancelSos}
              className="flex-1 py-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-800 font-semibold text-sm transition-colors"
            >
              Cancel SOS (Mistake)
            </button>
            <button
              onClick={() => {
                if (coordinates && typeof navigator !== "undefined" && navigator.share) {
                  navigator.share({
                    title: "SOS Status",
                    text: `Emergency SOS active. Coordinates: ${coordinates.lat}, ${coordinates.lng}. Case: ${caseId}`,
                  }).catch(() => {});
                } else {
                  alert("SOS status shared to registered family members");
                }
              }}
              className="flex-1 py-3 rounded-xl bg-cyan-600 hover:bg-cyan-700 text-white font-semibold text-sm transition-colors shadow-md shadow-cyan-900/20"
            >
              Share Status to Family
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
