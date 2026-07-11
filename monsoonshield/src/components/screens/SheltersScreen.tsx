"use client";

import React, { useState } from "react";
import { Tent, Check, CheckCircle2, Navigation, Phone, MapPin, Search } from "lucide-react";
import { MOCK_SHELTERS } from "@/lib/mockData";
import { getShelterCapacityColor } from "@/lib/utils";

export default function SheltersScreen() {
  const [shelters] = useState(MOCK_SHELTERS);
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

  const filteredShelters = shelters.filter((shelter) => {
    // Search filter
    if (searchQuery && !shelter.name.toLowerCase().includes(searchQuery.toLowerCase()) && !shelter.address.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false;
    }
    // Toggle filters
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
          <p className="text-xs text-slate-400 mt-1">Real-time shelter occupancy & facilities</p>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="glass-card p-5 border-slate-800 space-y-4">
        {/* Search */}
        <div className="relative">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by shelter name or locality (e.g. Shivajinagar)..."
            className="w-full pl-10 pr-4 py-2.5 rounded-lg bg-slate-900 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500/50"
          />
          <Search className="absolute left-3.5 top-3 h-4 w-4 text-slate-500" />
        </div>

        {/* Filter chips */}
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
        {/* Shelters list */}
        <div className="lg:col-span-2 space-y-3">
          {filteredShelters.length === 0 ? (
            <div className="glass-card p-8 border-slate-850 text-center text-slate-500 text-sm">
              No shelters match your current search/filter parameters.
            </div>
          ) : (
            filteredShelters.map((shelter) => {
              const occupancyRate = Math.round((shelter.currentOccupancy / shelter.capacity) * 100);
              return (
                <div key={shelter.id} className="glass-card p-5 border-slate-800 flex flex-col md:flex-row justify-between gap-4">
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

                    {/* Facility Icon Tags */}
                    <div className="flex gap-2 pt-1.5">
                      {shelter.amenities.water && <span className="text-[10px] bg-slate-800 text-slate-300 px-2 py-0.5 rounded">💧 Water</span>}
                      {shelter.amenities.food && <span className="text-[10px] bg-slate-800 text-slate-300 px-2 py-0.5 rounded">🍲 Food</span>}
                      {shelter.amenities.medical && <span className="text-[10px] bg-slate-800 text-slate-300 px-2 py-0.5 rounded">🩺 Medical</span>}
                      {shelter.petFriendly && <span className="text-[10px] bg-slate-800 text-slate-300 px-2 py-0.5 rounded">🐾 Pet Ok</span>}
                      {shelter.wheelchairAccessible && <span className="text-[10px] bg-slate-800 text-slate-300 px-2 py-0.5 rounded">♿ Accessible</span>}
                      {shelter.womensSection && <span className="text-[10px] bg-slate-800 text-slate-300 px-2 py-0.5 rounded">👩 Women</span>}
                    </div>
                  </div>

                  <div className="flex flex-col justify-between items-end min-w-[150px] text-right">
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

                    <div className="flex gap-2 mt-4 w-full md:w-auto">
                      <a
                        href={`tel:${shelter.contact}`}
                        className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white border border-slate-700/50 transition-colors"
                        title="Call Shelter Manager"
                      >
                        <Phone className="h-4 w-4" />
                      </a>
                      <button
                        onClick={() => alert(`Routing coordinates to ${shelter.name}`)}
                        className="px-3 py-2 rounded-lg bg-gradient-to-r from-blue-600 to-cyan-500 hover:opacity-90 text-xs font-semibold text-white flex items-center gap-1 shadow-md"
                      >
                        <Navigation className="h-3.5 w-3.5" />
                        <span>Route ({shelter.distanceKm} km)</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Map placeholder */}
        <div className="glass-card p-5 border-slate-800 h-[450px] flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-1">
              Active Shelter Map
            </h3>
            <span className="block text-[10px] text-slate-500">Live locations and capacity status</span>
          </div>

          <div className="flex-1 my-4 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center text-center relative overflow-hidden">
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b_1px,transparent_1px),linear-gradient(to_bottom,#1e293b_1px,transparent_1px)] bg-[size:24px_24px] opacity-15" />
            <div className="relative z-10 space-y-2">
              <Tent className="h-10 w-10 text-cyan-400 mx-auto" />
              <span className="block text-xs font-semibold text-slate-400">Map Rendering Simulated</span>
              <span className="block text-[10px] text-slate-500">Pune Center</span>
            </div>
          </div>

          <div className="text-xs text-slate-500 leading-relaxed border-t border-slate-850 pt-3">
            💚 Red markers indicate shelters near full capacity. Green indicates available spaces.
          </div>
        </div>
      </div>
    </div>
  );
}
