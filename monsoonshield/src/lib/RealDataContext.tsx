"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import type { RealWeather, RealAlert, RealFloodData } from "@/lib/realData";

interface RealDataState {
  weather: RealWeather | null;
  weatherLoading: boolean;
  alerts: RealAlert[];
  alertsLoading: boolean;
  flood: RealFloodData | null;
  floodLoading: boolean;
  riskScore: number;
  refresh: () => void;
}

const RealDataContext = createContext<RealDataState>({
  weather: null,
  weatherLoading: true,
  alerts: [],
  alertsLoading: true,
  flood: null,
  floodLoading: true,
  riskScore: 50,
  refresh: () => {},
});

export function useRealData() {
  return useContext(RealDataContext);
}

function computeRiskScore(weather: RealWeather | null, alerts: RealAlert[]): number {
  if (!weather) return 50;
  const rainfallScore = Math.min(40, (weather.rainfallMm / 100) * 40);
  const windScore = Math.min(20, (weather.windSpeed / 100) * 20);
  const humidityScore = weather.humidity > 90 ? 15 : weather.humidity > 75 ? 8 : 0;
  const alertScore = Math.min(25, alerts.length * 5);
  const score = Math.round(rainfallScore + windScore + humidityScore + alertScore);
  return Math.max(10, Math.min(95, score));
}

export function RealDataProvider({ children }: { children: ReactNode }) {
  const [weather, setWeather] = useState<RealWeather | null>(null);
  const [weatherLoading, setWeatherLoading] = useState(true);
  const [alerts, setAlerts] = useState<RealAlert[]>([]);
  const [alertsLoading, setAlertsLoading] = useState(true);
  const [flood, setFlood] = useState<RealFloodData | null>(null);
  const [floodLoading, setFloodLoading] = useState(true);
  const [riskScore, setRiskScore] = useState(50);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    setWeatherLoading(true);
    fetch("/api/weather")
      .then(r => r.json())
      .then(data => { if (!data.error) setWeather(data); })
      .catch(() => {})
      .finally(() => setWeatherLoading(false));

    setAlertsLoading(true);
    fetch("/api/alerts")
      .then(r => r.json())
      .then(data => { if (Array.isArray(data)) setAlerts(data); })
      .catch(() => {})
      .finally(() => setAlertsLoading(false));

    setFloodLoading(true);
    fetch("/api/flood")
      .then(r => r.json())
      .then(data => { if (!data.error) setFlood(data); })
      .catch(() => {})
      .finally(() => setFloodLoading(false));
  }, [refreshKey]);

  useEffect(() => {
    setRiskScore(computeRiskScore(weather, alerts));
  }, [weather, alerts]);

  const refresh = () => setRefreshKey(k => k + 1);

  return (
    <RealDataContext.Provider value={{ weather, weatherLoading, alerts, alertsLoading, flood, floodLoading, riskScore, refresh }}>
      {children}
    </RealDataContext.Provider>
  );
}
