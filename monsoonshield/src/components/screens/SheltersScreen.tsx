"use client";

import { useState, useEffect } from "react";
import { Tent, Navigation, Phone, MapPin, Search, Loader2 } from "lucide-react";
import { getShelterCapacityColor } from "@/lib/utils";
import { useAuth } from "@/lib/AuthContext";

interface Shelter {
  id?: string;
  name: string;
  address: string;
  lat?: number;
  lng?: number;
  capacity: number;
  currentOccupancy: number;
  contact: string;
  managedBy: string;
  amenities: { water: boolean; food: boolean; medical: boolean };
  petFriendly: boolean;
  wheelchairAccessible: boolean;
  womensSection: boolean;
}

const FALLBACK_SHELTERS: Shelter[] = [
  {
    name: "Call 1078 for Nearby Shelters",
    address: "National Flood Helpline — operated by NDMA",
    capacity: 0,
    currentOccupancy: 0,
    contact: "1078",
    managedBy: "NDMA",
    amenities: { water: true, food: true, medical: true },
    petFriendly: false,
    wheelchairAccessible: false,
    womensSection: false,
  },
];

export default function SheltersScreen() {
  const { user } = useAuth();
  const [shelters, setShelters] = useState<Shelter[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filters, setFilters] = useState({
    petFriendly: false,
    wheelchairAccessible: false,
    medical: false,
    food: false,
    womensSection: false,
  });

  const toggleFilter = (key: keyof typeof filters) => {
    setFilters((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  useEffect(() => {
    setLoading(true);
    fetch("/api/shelters", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        location: user?.location || "Pune, Maharashtra",
        lat: "18.52",
        lng: "73.86",
      }),
    })
      .then(r => r.json())
      .then(data => {
        if (data.shelters) {
          try {
            const parsed = JSON.parse(data.shelters);
            if (Array.isArray(parsed)) {
              setShelters(parsed.map((s, i) => ({ ...s, id: `shelter-${i}`, currentOccupancy: s.currentOccupancy || 0 })));
            } else {
              setShelters(FALLBACK_SHELTERS);
            }
          } catch {
            setShelters(FALLBACK_SHELTERS);
          }
        } else {
          setShelters(FALLBACK_SHELTERS);
        }
      })
      .catch(() => setShelters(FALLBACK_SHELTERS))
      .finally(() => setLoading(false));
  }, [user?.location]);

  const filteredShelters = shelters.filter((shelter) => {
    if (searchQuery && !shelter.name.toLowerCase().includes(searchQuery.toLowerCase()) && !shelter.address.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false;
    }
    if (filters.petFriendly && !shelter.petFriendly) return false;
    if (filters.wheelchairAccessible && !shelter.wheelchairAccessible) return false;
    if (filters.medical && !shelter.amenities.medical) return false;
    if (filters.food && !shelter.amenities.food) return false;
    if (filters.womensSection && !shelter.womensSection) return false;
    return true;
  });

  const filterOptions = [
    { key: "petFriendly" as const, label: "🐾 Pet-Friendly" },
    { key: "wheelchairAccessible" as const, label: "♿ Wheelchair" },
    { key: "medical" as const, label: "🩺 Medical Aid" },
    { key: "food" as const, label: "🍲 Food Provided" },
    { key: "womensSection" as const, label: "👩 Women's Area" },
  ];

  return (
    <div className="p-6 space-y-6 max-h-[calc(100vh-73px)] overflow-y-auto w-full">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
            🏠 Emergency Shelter Finder
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            {loading ? "Searching for shelters via AI..." : "AI-powered shelter recommendations for your area"}
          </p>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="glass-card p-5 border-slate-800 space-y-4">
        <div className="relative">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by shelter name or locality..."
            className="w-full pl-10 pr-4 py-2.5 rounded-lg bg-slate-900 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500/50"
          />
          <Search className="absolute left-3.5 top-3 h-4 w-4 text-slate-500" />
        </div>
        <div className="flex flex-wrap gap-2 items-center">
          <span className="text-[10px] font-bold text-slate-500 uppercase mr-2">Filter facilities:</span>
          {filterOptions.map((opt) => (
            <button
              key={opt.key}
              onClick={() => toggleFilter(opt.key)}
              className={`text-xs px-3 py-1.5 rounded-full border transition-colors flex items-center gap-1 ${
                filters[opt.key]
                  ? "bg-cyan-500/15 border-cyan-500/40 text-cyan-400 font-semibold"
                  : "bg-slate-800/40 border-slate-800 text-slate-400 hover:text-white"
              }`}
            >
              {filters[opt.key] && <span className="text-cyan-400 text-[10px]">✓</span>}
              <span>{opt.label}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-3">
          {loading ? (
            <div className="glass-card p-8 border-slate-800 flex flex-col items-center justify-center gap-4">
              <Loader2 className="h-8 w-8 animate-spin text-cyan-400" />
              <span className="text-sm text-slate-400">Asking Gemini AI for shelter data near your location...</span>
              <span className="text-[10px] text-slate-500">Powered by Google Gemini 3.5</span>
            </div>
          ) : filteredShelters.length === 0 ? (
            <div className="glass-card p-8 border-slate-800 text-center space-y-3">
              <p className="text-sm text-slate-400">No shelters match your current filters.</p>
              <a href="tel:1078" className="text-xs text-cyan-400 font-semibold hover:text-cyan-300">
                Call 1078 (Flood Helpline) for nearest shelter info →
              </a>
            </div>
          ) : (
            filteredShelters.map((shelter, idx) => {
              const occupancyRate = shelter.capacity > 0 ? Math.round((shelter.currentOccupancy / shelter.capacity) * 100) : 0;
              return (
                <div key={shelter.id || idx} className="glass-card p-5 border-slate-800 flex flex-col md:flex-row justify-between gap-4">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">🏠</span>
                      <h4 className="font-bold text-white text-md leading-tight">{shelter.name}</h4>
                    </div>
                    <p className="text-xs text-slate-400 flex items-center gap-1">
                      <MapPin className="h-3.5 w-3.5 text-slate-500" />
                      <span>{shelter.address}</span>
                    </p>
                    <div className="text-[10px] text-slate-500 font-semibold uppercase">
                      Managed by: <span className="text-slate-300">{shelter.managedBy}</span>
                    </div>
                    <div className="flex gap-2 pt-1.5 flex-wrap">
                      {shelter.amenities?.water && <span className="text-[10px] bg-slate-800 text-slate-300 px-2 py-0.5 rounded">💧 Water</span>}
                      {shelter.amenities?.food && <span className="text-[10px] bg-slate-800 text-slate-300 px-2 py-0.5 rounded">🍲 Food</span>}
                      {shelter.amenities?.medical && <span className="text-[10px] bg-slate-800 text-slate-300 px-2 py-0.5 rounded">🩺 Medical</span>}
                      {shelter.petFriendly && <span className="text-[10px] bg-slate-800 text-slate-300 px-2 py-0.5 rounded">🐾 Pet Ok</span>}
                      {shelter.wheelchairAccessible && <span className="text-[10px] bg-slate-800 text-slate-300 px-2 py-0.5 rounded">♿ Accessible</span>}
                      {shelter.womensSection && <span className="text-[10px] bg-slate-800 text-slate-300 px-2 py-0.5 rounded">👩 Women</span>}
                    </div>
                  </div>

                  <div className="flex flex-col justify-between items-end min-w-[150px] text-right">
                    {shelter.capacity > 0 && (
                      <div>
                        <div className="flex items-baseline justify-end gap-1">
                          <span className={`text-xl font-extrabold ${getShelterCapacityColor(shelter.currentOccupancy, shelter.capacity)}`}>
                            {occupancyRate}%
                          </span>
                          <span className="text-[9px] text-slate-500 font-bold uppercase tracking-wider">Occupied</span>
                        </div>
                        <span className="block text-[10px] text-slate-400 font-medium">
                          ({shelter.currentOccupancy} / {shelter.capacity} spaces)
                        </span>
                      </div>
                    )}
                    <div className="flex gap-2 mt-4 w-full md:w-auto">
                      <a
                        href={`tel:${shelter.contact}`}
                        className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white border border-slate-700/50 transition-colors"
                        title="Call Shelter Manager"
                      >
                        <Phone className="h-4 w-4" />
                      </a>
                      <button
                        onClick={() => {
                          if (shelter.lat && shelter.lng) {
                            window.open(`https://www.google.com/maps/dir/?api=1&destination=${shelter.lat},${shelter.lng}`, "_blank");
                          } else {
                            window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(shelter.name + " " + shelter.address)}`, "_blank");
                          }
                        }}
                        className="px-3 py-2 rounded-lg bg-gradient-to-r from-blue-600 to-cyan-500 hover:opacity-90 text-xs font-semibold text-white flex items-center gap-1 shadow-md"
                      >
                        <Navigation className="h-3.5 w-3.5" />
                        <span>Navigate</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Map panel */}
        <div className="glass-card p-5 border-slate-800 h-[450px] flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-1">
              Shelter Map
            </h3>
            <span className="block text-[10px] text-slate-500">AI-recommended locations</span>
          </div>

          <div className="flex-1 my-4 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center text-center relative overflow-hidden">
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b_1px,transparent_1px),linear-gradient(to_bottom,#1e293b_1px,transparent_1px)] bg-[size:24px_24px] opacity-15" />
            <div className="relative z-10 space-y-2">
              <Tent className="h-10 w-10 text-cyan-400 mx-auto" />
              <span className="block text-xs font-semibold text-slate-400">
                {loading ? "Searching..." : `${filteredShelters.length} shelter(s) found`}
              </span>
              <span className="block text-[10px] text-slate-500">{user?.location || "Pune, Maharashtra"}</span>
            </div>
          </div>

          <div className="text-[10px] text-slate-500 leading-relaxed border-t border-slate-850 pt-3">
            Shelter data generated by Gemini AI based on known public facilities. Always verify by calling 1078 before evacuating.
          </div>
        </div>
      </div>
    </div>
  );
}
