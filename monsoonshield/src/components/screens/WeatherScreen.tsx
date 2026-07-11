"use client";

import { useState, useEffect } from "react";
import { Info, TrendingUp, Loader2 } from "lucide-react";
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ReferenceLine } from "recharts";
import type { RealWeather, RealFloodData } from "@/lib/realData";

export default function WeatherScreen() {
  const [weather, setWeather] = useState<RealWeather | null>(null);
  const [flood, setFlood] = useState<RealFloodData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    setLoading(true);
    Promise.all([
      fetch("/api/weather").then(r => r.json()),
      fetch("/api/flood").then(r => r.json()),
    ])
      .then(([weatherData, floodData]) => {
        if (!weatherData.error) setWeather(weatherData);
        if (!floodData.error) setFlood(floodData);
      })
      .catch(() => setError("Failed to fetch weather data"))
      .finally(() => setLoading(false));
  }, []);

  const WMO_EMOJI: Record<number, string> = {
    0: "☀️", 1: "🌤️", 2: "⛅", 3: "☁️",
    45: "🌫️", 48: "🌫️",
    51: "🌦️", 53: "🌦️", 55: "🌧️",
    61: "🌧️", 63: "🌧️", 65: "🌧️",
    71: "🌨️", 73: "🌨️", 75: "❄️",
    80: "🌦️", 81: "🌧️", 82: "⛈️",
    95: "⛈️", 96: "⛈️", 99: "⛈️",
  };

  // Build flood chart data from real API
  const floodChartData = flood?.daily?.map((d) => ({
    time: d.date.slice(5),
    level: d.discharge,
    max: d.max,
  })) || [];

  // Determine flood risk level
  const floodRiskLevel = flood?.currentLevel != null && flood.dangerThreshold > 0
    ? (flood.currentLevel / flood.dangerThreshold) * 100
    : null;

  return (
    <div className="p-6 space-y-6 max-h-[calc(100vh-73px)] overflow-y-auto w-full">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
            ⛈️ Weather Intelligence & Flood Prediction
          </h2>
          <p className="text-xs text-slate-400 mt-1">Real-time nowcasting and hydrological models</p>
        </div>
      </div>

      {loading ? (
        <div className="glass-card p-12 border-slate-800 flex flex-col items-center justify-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-cyan-400" />
          <span className="text-sm text-slate-400">Fetching real-time weather and flood data...</span>
        </div>
      ) : error ? (
        <div className="glass-card p-8 border-slate-800 text-center text-red-400 text-sm">{error}</div>
      ) : (
        <>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* River/Flood sensor data */}
            <div className="glass-card p-6 border-slate-800 flex flex-col justify-between">
              <div>
                <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4">
                  River Discharge Data
                </h3>
                {flood && flood.currentLevel != null ? (
                  <div className="space-y-4">
                    <div className="space-y-1.5">
                      <div className="flex justify-between items-baseline text-xs">
                        <span className="font-semibold text-white">Current Discharge</span>
                        <span className={`font-bold ${
                          floodRiskLevel && floodRiskLevel >= 80
                            ? "text-red-500"
                            : floodRiskLevel && floodRiskLevel >= 60
                            ? "text-amber-500"
                            : "text-green-500"
                        }`}>
                          {flood.currentLevel} {flood.unit}
                        </span>
                      </div>
                      <div className="h-2 rounded-full bg-slate-800 overflow-hidden relative">
                        <div
                          className={`h-full transition-all ${
                            floodRiskLevel && floodRiskLevel >= 80
                              ? "bg-red-500"
                              : floodRiskLevel && floodRiskLevel >= 60
                              ? "bg-amber-500"
                              : "bg-green-500"
                          }`}
                          style={{ width: `${Math.min(100, floodRiskLevel || 0)}%` }}
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className="p-2 rounded-lg bg-slate-800/50">
                        <span className="block text-[10px] text-slate-500 font-bold uppercase">Trend</span>
                        <span className={`font-bold ${
                          flood.trend === "rising" ? "text-red-400" : flood.trend === "falling" ? "text-green-400" : "text-slate-300"
                        }`}>
                          {flood.trend === "rising" ? "↗ Rising" : flood.trend === "falling" ? "↘ Falling" : "→ Stable"}
                        </span>
                      </div>
                      <div className="p-2 rounded-lg bg-slate-800/50">
                        <span className="block text-[10px] text-slate-500 font-bold uppercase">Source</span>
                        <span className="text-white font-semibold text-[10px]">GloFAS/ECMWF</span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <p className="text-xs text-slate-500">Flood data unavailable for your location</p>
                )}
              </div>
              <div className="text-[10px] text-slate-500 flex items-start gap-1 border-t border-slate-850 pt-4 mt-6">
                <Info className="h-3.5 w-3.5 mt-0.5 text-cyan-400" />
                <span>Data from Open-Meteo Flood API (GloFAS v4 / ECMWF). River discharge in m³/s.</span>
              </div>
            </div>

            {/* Flood Forecast Chart */}
            <div className="lg:col-span-2 glass-card p-6 border-slate-800 flex flex-col justify-between">
              <div>
                <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-2">
                  River Discharge Forecast (7 Days)
                </h3>
                <span className="block text-[10px] text-slate-500 mb-4">
                  GloFAS hydrological model — daily river discharge predictions
                </span>
              </div>

              {floodChartData.length > 0 ? (
                <div className="h-56 w-full text-xs">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={floodChartData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                      <defs>
                        <linearGradient id="colorDischarge" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.4} />
                          <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                      <XAxis dataKey="time" stroke="#64748b" />
                      <YAxis stroke="#64748b" />
                      <Tooltip
                        contentStyle={{ backgroundColor: "#0f172a", borderColor: "#1e293b" }}
                        labelStyle={{ color: "#94a3b8" }}
                      />
                      <Area type="monotone" dataKey="level" stroke="#3b82f6" fillOpacity={1} fill="url(#colorDischarge)" name="Discharge (m³/s)" />
                      {flood && <ReferenceLine y={flood.dangerThreshold} stroke="#f59e0b" strokeDasharray="3 3" label={{ value: 'High Risk Threshold', fill: '#f59e0b', fontSize: 10, position: 'top' }} />}
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="h-56 flex items-center justify-center text-slate-500 text-xs">
                  No flood forecast data available for this location
                </div>
              )}

              <div className="flex items-center gap-1.5 text-[10px] text-slate-500 mt-4 border-t border-slate-850 pt-4">
                <TrendingUp className="h-4 w-4 text-cyan-400" />
                <span>Source: Open-Meteo Flood API (GloFAS v4 / ECMWF)</span>
              </div>
            </div>
          </div>

          {/* Weather forecast & details */}
          {weather && (
            <div className="glass-card p-6 border-slate-800 space-y-4">
              <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider">
                7-Day Weather Projection
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-7 gap-3">
                {weather.daily.map((f) => (
                  <div key={f.day} className="p-4 rounded-xl bg-slate-900/60 border border-slate-850 text-center space-y-2">
                    <span className="block text-xs font-semibold text-slate-400">{f.day}</span>
                    <span className="block text-3xl">{WMO_EMOJI[weather.conditionCode] || "🌧️"}</span>
                    <span className="block text-xs font-bold text-white">
                      {f.high}° / {f.low}°
                    </span>
                    <div className="space-y-0.5">
                      <span className="block text-[10px] text-slate-500">{f.condition}</span>
                      <span className="block text-[9px] font-bold text-cyan-400">{f.rain}mm</span>
                    </div>
                  </div>
                ))}
              </div>
              <p className="text-[9px] text-slate-600 text-right">Source: {weather.source} | Fetched: {weather.fetchedAt}</p>
            </div>
          )}
        </>
      )}
    </div>
  );
}
