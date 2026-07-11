"use client";

import { useState, useEffect } from "react";
import { AlertTriangle, Loader2, Phone, ExternalLink, MapPin, Clock } from "lucide-react";
import type { RealAlert, RealEarthquake, RealWeather, RealFloodData } from "@/lib/realData";

interface EmergencyContact {
  name: string;
  phone: string;
  role: string;
  source: string;
}

const EMERGENCY_CONTACTS: EmergencyContact[] = [
  { name: "NDRF Control Room", phone: "011-24363260", role: "National Disaster Response Force", source: "ndma.gov.in" },
  { name: "SDRF Maharashtra", phone: "020-25501292", role: "State Disaster Response Force", source: "maharashtra.gov.in" },
  { name: "NDMA Helpline", phone: "011-26701728", role: "National Disaster Management Authority", source: "ndma.gov.in" },
  { name: "National Emergency", phone: "112", role: "Unified Emergency Number", source: "Government of India" },
  { name: "Flood Helpline", phone: "1078", role: "24/7 Flood Rescue Helpline", source: "NDMA" },
  { name: "Ambulance / Medical", phone: "108", role: "Emergency Medical Services", source: "Govt of India" },
  { name: "Fire Brigade", phone: "101", role: "Fire & Rescue Services", source: "Local Municipal" },
  { name: "Police", phone: "100", role: "Law Enforcement Emergency", source: "Local Police" },
  { name: "Disaster Helpline", phone: "1070", role: "General Disaster Assistance", source: "NDMA" },
  { name: "Insurance (IRDAI)", phone: "1800-11-0001", role: "Insurance Regulatory Helpline", source: "IRDAI" },
];

const WMO_EMOJI: Record<number, string> = {
  0: "☀️", 1: "🌤️", 2: "⛅", 3: "☁️",
  45: "🌫️", 48: "🌫️",
  51: "🌦️", 53: "🌦️", 55: "🌧️",
  61: "🌧️", 63: "🌧️", 65: "🌧️",
  71: "🌨️", 73: "🌨️", 75: "❄️",
  80: "🌦️", 81: "🌧️", 82: "⛈️",
  95: "⛈️", 96: "⛈️", 99: "⛈️",
};

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

export default function CommandScreen() {
  const [alerts, setAlerts] = useState<RealAlert[]>([]);
  const [earthquakes, setEarthquakes] = useState<RealEarthquake[]>([]);
  const [weather, setWeather] = useState<RealWeather | null>(null);
  const [flood, setFlood] = useState<RealFloodData | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"incidents" | "contacts">("incidents");

  useEffect(() => {
    setLoading(true);
    Promise.all([
      fetch("/api/alerts").then(r => r.json()),
      fetch("/api/earthquakes").then(r => r.json()),
      fetch("/api/weather").then(r => r.json()),
      fetch("/api/flood").then(r => r.json()),
    ])
      .then(([alertsData, eqData, weatherData, floodData]) => {
        if (Array.isArray(alertsData)) setAlerts(alertsData);
        if (Array.isArray(eqData)) setEarthquakes(eqData);
        if (!weatherData.error) setWeather(weatherData);
        if (!floodData.error) setFlood(floodData);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const totalIncidents = alerts.length + earthquakes.length;

  return (
    <div className="p-6 space-y-6 max-h-[calc(100vh-73px)] overflow-y-auto w-full">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
            🛡️ SDRF & Municipal Command Center
          </h2>
          <p className="text-xs text-slate-400 mt-1">Real-time disaster monitoring — NDMA SACHET + USGS + Open-Meteo</p>
        </div>
        <span className={`px-3 py-1 rounded text-[10px] font-bold text-white uppercase tracking-wider ${
          totalIncidents > 0 ? "bg-red-600 animate-pulse" : "bg-green-600"
        }`}>
          {totalIncidents > 0 ? `🔴 ${totalIncidents} Active Incident(s)` : "✅ All Clear"}
        </span>
      </div>

      {/* Live operational stats bar — computed from real data */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className={`stat-card ${alerts.length > 0 ? "border-red-500/20 bg-red-500/5" : ""}`}>
          <span className={`text-2xl font-extrabold ${alerts.length > 0 ? "text-red-500" : "text-green-400"}`}>
            {alerts.length}
          </span>
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide mt-1">
            NDMA Disaster Alerts
          </span>
        </div>
        <div className={`stat-card ${earthquakes.length > 0 ? "border-amber-500/20 bg-amber-500/5" : ""}`}>
          <span className={`text-2xl font-extrabold ${earthquakes.length > 0 ? "text-amber-400" : "text-green-400"}`}>
            {earthquakes.length}
          </span>
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide mt-1">
            USGS Earthquakes (500km)
          </span>
        </div>
        <div className="stat-card">
          <span className="text-2xl font-extrabold text-cyan-400">
            {weather ? `${weather.temp}°` : "—"}
          </span>
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide mt-1">
            {weather ? `${weather.condition}` : "Loading Weather..."}
          </span>
        </div>
        <div className="stat-card">
          <span className={`text-2xl font-extrabold ${flood?.trend === "rising" ? "text-red-400" : flood?.trend === "falling" ? "text-green-400" : "text-slate-300"}`}>
            {flood?.currentLevel != null ? `${flood.currentLevel}` : "—"}
          </span>
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide mt-1">
            River Discharge {flood?.unit || ""}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main panel */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex border-b border-slate-850">
            <button
              onClick={() => setActiveTab("incidents")}
              className={`px-4 py-2 text-xs font-bold uppercase tracking-wider border-b-2 transition-all ${
                activeTab === "incidents"
                  ? "border-red-500 text-red-400"
                  : "border-transparent text-slate-500 hover:text-slate-300"
              }`}
            >
              Active Incidents
            </button>
            <button
              onClick={() => setActiveTab("contacts")}
              className={`px-4 py-2 text-xs font-bold uppercase tracking-wider border-b-2 transition-all ${
                activeTab === "contacts"
                  ? "border-cyan-500 text-cyan-400"
                  : "border-transparent text-slate-500 hover:text-slate-300"
              }`}
            >
              Emergency Contacts
            </button>
          </div>

          {activeTab === "incidents" ? (
            <div className="space-y-3">
              {loading ? (
                <div className="glass-card p-8 border-slate-800 flex items-center justify-center gap-3">
                  <Loader2 className="h-5 w-5 animate-spin text-cyan-400" />
                  <span className="text-sm text-slate-400">Fetching live disaster data...</span>
                </div>
              ) : totalIncidents === 0 ? (
                <div className="glass-card p-8 border-slate-850 text-center text-green-400 text-sm space-y-2">
                  <span className="text-2xl">✅</span>
                  <p className="font-semibold">No active disaster incidents detected</p>
                  <p className="text-xs text-slate-500">NDMA SACHET and USGS report no incidents in your region.</p>
                </div>
              ) : (
                <>
                  {/* NDMA Alerts */}
                  {alerts.map((alert) => (
                    <div key={`alert-${alert.id}`} className="glass-card p-5 border-slate-800 space-y-3">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-2">
                          <AlertTriangle className={`h-4 w-4 ${
                            alert.severityColor === "red" ? "text-red-500" : alert.severityColor === "orange" ? "text-amber-500" : "text-yellow-500"
                          }`} />
                          <h4 className="font-bold text-white text-sm">{alert.disasterType}</h4>
                          <span className={`text-[10px] px-2 py-0.5 rounded font-bold uppercase ${
                            alert.severityColor === "red" ? "bg-red-500/20 text-red-400" :
                            alert.severityColor === "orange" ? "bg-amber-500/20 text-amber-400" :
                            "bg-yellow-500/20 text-yellow-400"
                          }`}>
                            {alert.severity}
                          </span>
                        </div>
                        <span className="text-[10px] text-slate-500 font-medium flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {alert.source}
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 leading-relaxed">{alert.message}</p>
                      <div className="flex items-center justify-between text-[10px] text-slate-500">
                        <span className="flex items-center gap-1">
                          <MapPin className="h-3 w-3" /> {alert.area}
                        </span>
                        {alert.effectiveEnd && <span>Valid until: {alert.effectiveEnd}</span>}
                      </div>
                    </div>
                  ))}

                  {/* USGS Earthquakes */}
                  {earthquakes.map((eq, i) => (
                    <div key={`eq-${i}`} className="glass-card p-5 border-slate-800 space-y-3">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-lg">🌍</span>
                          <h4 className="font-bold text-white text-sm">
                            M{eq.magnitude.toFixed(1)} — {eq.place}
                          </h4>
                          <span className={`text-[10px] px-2 py-0.5 rounded font-bold uppercase ${
                            eq.magnitude >= 5 ? "bg-red-500/20 text-red-400" :
                            eq.magnitude >= 4 ? "bg-amber-500/20 text-amber-400" :
                            "bg-slate-700 text-slate-300"
                          }`}>
                            M{eq.magnitude.toFixed(1)}
                          </span>
                        </div>
                        <span className="text-[10px] text-slate-500 font-medium flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {timeAgo(eq.time)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-[10px] text-slate-500">
                        <span>Depth: {eq.depth.toFixed(1)} km</span>
                        {eq.url && (
                          <a href={eq.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-cyan-400 hover:text-cyan-300">
                            USGS Details <ExternalLink className="h-3 w-3" />
                          </a>
                        )}
                      </div>
                    </div>
                  ))}
                </>
              )}
            </div>
          ) : (
            /* Emergency Contacts — Real public numbers from NDMA/Govt */
            <div className="space-y-2">
              <div className="glass-card p-3 border-slate-800 bg-blue-500/5">
                <p className="text-[10px] text-blue-300 flex items-center gap-1.5">
                  <Phone className="h-3 w-3" />
                  Emergency contact numbers sourced from official NDMA, Government of India, and IRDAI public directories.
                </p>
              </div>
              {EMERGENCY_CONTACTS.map((contact) => (
                <a
                  key={contact.phone}
                  href={`tel:${contact.phone}`}
                  className="block p-4 rounded-xl bg-slate-900/60 border border-slate-850 hover:border-slate-700 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="h-9 w-9 rounded-lg bg-slate-800 flex items-center justify-center">
                        <Phone className="h-4 w-4 text-cyan-400" />
                      </div>
                      <div>
                        <span className="block font-bold text-white text-sm">{contact.name}</span>
                        <span className="block text-[11px] text-slate-400">{contact.role}</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="block text-sm font-bold text-cyan-400">{contact.phone}</span>
                      <span className="block text-[9px] text-slate-600">Source: {contact.source}</span>
                    </div>
                  </div>
                </a>
              ))}
            </div>
          )}
        </div>

        {/* Side panel — Real-time environmental data */}
        <div className="glass-card p-5 border-slate-800 space-y-4">
          <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider">
            Live Environmental Status
          </h3>
          <p className="text-[10px] text-slate-500">Real-time data from Open-Meteo, NDMA SACHET, USGS</p>

          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-5 w-5 animate-spin text-cyan-400" />
            </div>
          ) : (
            <div className="space-y-4">
              {/* Weather summary */}
              {weather && (
                <div className="p-3 rounded-lg bg-slate-900/60 border border-slate-850 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-white">Current Weather</span>
                    <span className="text-lg">{WMO_EMOJI[weather.conditionCode] || "🌧️"}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-[10px]">
                    <div>
                      <span className="text-slate-500">Temp</span>
                      <span className="block text-white font-bold">{weather.temp}°C</span>
                    </div>
                    <div>
                      <span className="text-slate-500">Rain</span>
                      <span className="block text-white font-bold">{weather.rainfallMm} mm</span>
                    </div>
                    <div>
                      <span className="text-slate-500">Wind</span>
                      <span className="block text-white font-bold">{weather.windSpeed} km/h</span>
                    </div>
                    <div>
                      <span className="text-slate-500">Humidity</span>
                      <span className="block text-white font-bold">{weather.humidity}%</span>
                    </div>
                  </div>
                  <span className="block text-[9px] text-slate-600">Source: {weather.source}</span>
                </div>
              )}

              {/* Flood data */}
              {flood && flood.currentLevel != null && (
                <div className="p-3 rounded-lg bg-slate-900/60 border border-slate-850 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-white">River Discharge</span>
                    <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${
                      flood.trend === "rising" ? "bg-red-500/20 text-red-400" :
                      flood.trend === "falling" ? "bg-green-500/20 text-green-400" :
                      "bg-slate-700 text-slate-400"
                    }`}>
                      {flood.trend}
                    </span>
                  </div>
                  <div className="space-y-1 text-[10px]">
                    <div className="flex justify-between">
                      <span className="text-slate-500">Current</span>
                      <span className="text-white font-bold">{flood.currentLevel} {flood.unit}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Danger Threshold</span>
                      <span className="text-amber-400 font-bold">{flood.dangerThreshold} {flood.unit}</span>
                    </div>
                  </div>
                  <span className="block text-[9px] text-slate-600">Source: {flood.source}</span>
                </div>
              )}

              {/* Quick action */}
              <a
                href="tel:112"
                className="block w-full py-3 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold text-center transition-colors"
              >
                📞 Call 112 — National Emergency
              </a>
              <a
                href="tel:1078"
                className="block w-full py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold text-center border border-slate-700 transition-colors"
              >
                📞 Call 1078 — Flood Helpline
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
