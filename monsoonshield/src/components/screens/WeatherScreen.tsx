"use client";

import { useState } from "react";
import { Info, TrendingUp } from "lucide-react";
import { MOCK_WEATHER, MOCK_FLOOD_PREDICTION } from "@/lib/mockData";
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ReferenceLine } from "recharts";

export default function WeatherScreen() {
  const [weather] = useState(MOCK_WEATHER);
  const [floodData] = useState(MOCK_FLOOD_PREDICTION);

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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* River Level warning gauges */}
        <div className="glass-card p-6 border-slate-800 flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4">
              River Level Sensor Status (Pune)
            </h3>
            <div className="space-y-4">
              {[
                { name: "Mula River (Wakad Gauge)", level: 82, danger: 65, status: "DANGER" },
                { name: "Mutha River (Deccan Gauge)", level: 48, danger: 60, status: "NORMAL" },
                { name: "Pavana River (Pimpri Gauge)", level: 69, danger: 70, status: "WARNING" },
              ].map((river) => (
                <div key={river.name} className="space-y-1.5">
                  <div className="flex justify-between items-baseline text-xs">
                    <span className="font-semibold text-white">{river.name}</span>
                    <span className={`font-bold ${
                      river.level >= river.danger
                        ? "text-red-500"
                        : river.level >= river.danger - 10
                        ? "text-amber-500"
                        : "text-green-500"
                    }`}>
                      {river.level}% ({river.status})
                    </span>
                  </div>
                  <div className="h-2 rounded-full bg-slate-800 overflow-hidden relative">
                    <div
                      className={`h-full transition-all ${
                        river.level >= river.danger
                          ? "bg-red-500"
                          : river.level >= river.danger - 10
                          ? "bg-amber-500"
                          : "bg-green-500"
                      }`}
                      style={{ width: `${river.level}%` }}
                    />
                    <div
                      className="absolute top-0 bottom-0 w-0.5 bg-red-600/80"
                      style={{ left: `${river.danger}%` }}
                      title="Danger Level Mark"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="text-[10px] text-slate-500 flex items-start gap-1 border-t border-slate-850 pt-4 mt-6">
            <Info className="h-3.5 w-3.5 mt-0.5 text-cyan-400" />
            <span>Data synced hourly from Central Water Commission (CWC) telemetry grids.</span>
          </div>
        </div>

        {/* Flood Runoff Forecast Chart */}
        <div className="lg:col-span-2 glass-card p-6 border-slate-800 flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-2">
              Predictive Hydrograph (Next 24 Hours)
            </h3>
            <span className="block text-[10px] text-slate-500 mb-4">
              LSTM model forecast for Wakad catchment basin runoffs
            </span>
          </div>

          <div className="h-56 w-full text-xs">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={floodData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorLevel" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ef4444" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#ef4444" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="time" stroke="#64748b" />
                <YAxis stroke="#64748b" domain={[0, 100]} />
                <Tooltip
                  contentStyle={{ backgroundColor: "#0f172a", borderColor: "#1e293b" }}
                  labelStyle={{ color: "#94a3b8" }}
                />
                <Area type="monotone" dataKey="level" stroke="#ef4444" fillOpacity={1} fill="url(#colorLevel)" name="Catchment Level %" />
                <ReferenceLine y={60} stroke="#f59e0b" strokeDasharray="3 3" label={{ value: 'Danger Threshold', fill: '#f59e0b', fontSize: 10, position: 'top' }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          <div className="flex items-center gap-1.5 text-[10px] text-slate-500 mt-4 border-t border-slate-850 pt-4">
            <TrendingUp className="h-4 w-4 text-cyan-400 animate-pulse" />
            <span>Peak runoffs simulated around 6:00 PM tonight due to persistent local nowcast peaks.</span>
          </div>
        </div>
      </div>

      {/* Hourly forecast & details */}
      <div className="glass-card p-6 border-slate-800 space-y-4">
        <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider">
          7-Day Weather Projection — IMD NWP Model
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-7 gap-3">
          {weather.forecast.map((f) => (
            <div key={f.day} className="p-4 rounded-xl bg-slate-900/60 border border-slate-850 text-center space-y-2">
              <span className="block text-xs font-semibold text-slate-400">{f.day}</span>
              <span className="block text-3xl">{f.icon}</span>
              <span className="block text-xs font-bold text-white">
                {f.high}° / {f.low}°
              </span>
              <div className="space-y-0.5">
                <span className="block text-[10px] text-slate-500">{f.condition}</span>
                <span className="block text-[9px] font-bold text-cyan-400">{f.rain}% Rain</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
