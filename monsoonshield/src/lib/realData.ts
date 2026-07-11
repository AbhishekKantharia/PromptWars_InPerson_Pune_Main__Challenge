// Real-time data fetching from public APIs (no auth required)
// Sources: Open-Meteo, NDMA SACHET, USGS

// ============================================================
// TYPES
// ============================================================

export interface RealWeather {
  temp: number;
  feelsLike: number;
  humidity: number;
  rainfallMm: number;
  windSpeed: number;
  windDirection: number;
  condition: string;
  conditionCode: number;
  description: string;
  visibility: number;
  hourly: { time: string; temp: number; rain: number }[];
  daily: { day: string; high: number; low: number; rain: number; condition: string }[];
  source: string;
  fetchedAt: string;
}

export interface RealAlert {
  id: string;
  severity: string;
  severityColor: string;
  disasterType: string;
  area: string;
  source: string;
  message: string;
  effectiveStart: string;
  effectiveEnd: string;
}

export interface RealFloodData {
  location: string;
  currentLevel: number | null;
  dangerThreshold: number;
  unit: string;
  daily: { date: string; discharge: number; max: number }[];
  trend: string;
  source: string;
  fetchedAt: string;
}

export interface RealEarthquake {
  magnitude: number;
  place: string;
  time: string;
  depth: number;
  url: string;
}

// ============================================================
// WMO WEATHER CODE DESCRIPTIONS
// ============================================================

const WMO_CODES: Record<number, string> = {
  0: "Clear sky",
  1: "Mainly clear",
  2: "Partly cloudy",
  3: "Overcast",
  45: "Fog",
  48: "Depositing rime fog",
  51: "Light drizzle",
  53: "Moderate drizzle",
  55: "Dense drizzle",
  56: "Light freezing drizzle",
  57: "Dense freezing drizzle",
  61: "Slight rain",
  63: "Moderate rain",
  65: "Heavy rain",
  66: "Light freezing rain",
  67: "Heavy freezing rain",
  71: "Slight snow",
  73: "Moderate snow",
  75: "Heavy snow",
  77: "Snow grains",
  80: "Slight rain showers",
  81: "Moderate rain showers",
  82: "Violent rain showers",
  85: "Slight snow showers",
  86: "Heavy snow showers",
  95: "Thunderstorm",
  96: "Thunderstorm with slight hail",
  99: "Thunderstorm with heavy hail",
};

// ============================================================
// OPEN-METEO WEATHER
// ============================================================

const PUNE_LAT = 18.52;
const PUNE_LNG = 73.86;

export async function fetchRealWeather(
  lat: number = PUNE_LAT,
  lng: number = PUNE_LNG
): Promise<RealWeather> {
  const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&current=temperature_2m,apparent_temperature,relative_humidity_2m,precipitation,rain,wind_speed_10m,wind_direction_10m,weather_code&hourly=temperature_2m,rain&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_sum&timezone=Asia/Kolkata&forecast_days=7`;

  const res = await fetch(url, { next: { revalidate: 900 } }); // cache 15 min
  if (!res.ok) throw new Error(`Open-Meteo weather failed: ${res.status}`);
  const data = await res.json();

  const current = data.current;
  const code = current.weather_code as number;
  const condition = WMO_CODES[code] || "Unknown";

  // Hourly: next 8 time slots
  const now = new Date();
  const hourlyStart = data.hourly.time.findIndex((t: string) => new Date(t) >= now);
  const hourlySlice = Math.max(0, hourlyStart);
  const hourly = (data.hourly.time.slice(hourlySlice, hourlySlice + 8) as string[]).map(
    (t: string, i: number) => ({
      time: new Date(t).toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit", hour12: true }),
      temp: Math.round(data.hourly.temperature_2m[hourlySlice + i] ?? 0),
      rain: Math.round((data.hourly.rain[hourlySlice + i] ?? 0) * 10) / 10,
    })
  );

  // Daily: next 7 days
  const daily = (data.daily.time as string[]).map((d: string, i: number) => ({
    day: i === 0 ? "Today" : new Date(d).toLocaleDateString("en-IN", { weekday: "short" }),
    high: Math.round(data.daily.temperature_2m_max[i]),
    low: Math.round(data.daily.temperature_2m_min[i]),
    rain: Math.round(data.daily.precipitation_sum[i]),
    condition: WMO_CODES[data.daily.weather_code[i]] || "Unknown",
  }));

  return {
    temp: Math.round(current.temperature_2m),
    feelsLike: Math.round(current.apparent_temperature),
    humidity: Math.round(current.relative_humidity_2m),
    rainfallMm: Math.round(current.rain * 10) / 10,
    windSpeed: Math.round(current.wind_speed_10m),
    windDirection: current.wind_direction_10m,
    condition,
    conditionCode: code,
    description: `IMD-equivalent: ${condition}. ${current.rain > 0 ? `${current.rain}mm rain currently.` : "No rain at present."}`,
    visibility: 10, // Open-Meteo doesn't provide visibility in free tier
    hourly,
    daily,
    source: "Open-Meteo (ECMWF GFS)",
    fetchedAt: new Date().toISOString(),
  };
}

// ============================================================
// NDMA SACHET ALERTS
// ============================================================

export async function fetchRealAlerts(): Promise<RealAlert[]> {
  try {
    const res = await fetch("https://sachet.ndma.gov.in/cap_public_website/FetchAllAlertDetails", {
      next: { revalidate: 300 }, // cache 5 min
    });
    if (!res.ok) throw new Error(`NDMA SACHET failed: ${res.status}`);
    const data = await res.json();

    if (!Array.isArray(data)) return [];

    // Filter for relevant disaster types and take latest 10
    const relevant = data
      .filter((a: Record<string, string>) => {
        const type = (a.disaster_type || "").toLowerCase();
        return (
          type.includes("rain") ||
          type.includes("flood") ||
          type.includes("thunderstorm") ||
          type.includes("cyclone") ||
          type.includes("heat") ||
          type.includes("cold") ||
          type.includes("earthquake") ||
          type.includes("landslide") ||
          type.includes("heavy")
        );
      })
      .slice(0, 10)
      .map((a: Record<string, string>) => ({
        id: String(a.identifier || Date.now()),
        severity: a.severity || "Unknown",
        severityColor: a.severity_color || "yellow",
        disasterType: a.disaster_type || "Weather",
        area: a.area_description || "India",
        source: a.alert_source || "NDMA",
        message: a.warning_message || a.severity_level || "No details available",
        effectiveStart: a.effective_start_time || "",
        effectiveEnd: a.effective_end_time || "",
      }));

    return relevant;
  } catch {
    return [];
  }
}

// ============================================================
// OPEN-METEO FLOOD API
// ============================================================

export async function fetchRealFloodData(
  lat: number = PUNE_LAT,
  lng: number = PUNE_LNG
): Promise<RealFloodData> {
  const url = `https://flood-api.open-meteo.com/v1/flood?latitude=${lat}&longitude=${lng}&daily=river_discharge,river_discharge_max,river_discharge_median`;

  try {
    const res = await fetch(url, { next: { revalidate: 3600 } }); // cache 1 hour
    if (!res.ok) throw new Error(`Flood API failed: ${res.status}`);
    const data = await res.json();

    type DailyFlood = { date: string; discharge: number; max: number };
    const daily: DailyFlood[] = (data.daily?.time || []).map((d: string, i: number) => ({
      date: d,
      discharge: data.daily.river_discharge?.[i] ?? 0,
      max: data.daily.river_discharge_max?.[i] ?? 0,
    }));

    const latestDischarge = daily.length > 0 ? daily[daily.length - 1]!.discharge : null;
    const maxDischarge = daily.length > 0 ? Math.max(...daily.map((d: DailyFlood) => d.max)) : 0;

    // Determine trend from recent days
    let trend = "stable";
    if (daily.length >= 3) {
      const recent = daily.slice(-3).map((d: DailyFlood) => d.discharge);
      if ((recent[2] ?? 0) > (recent[0] ?? 0) * 1.2) trend = "rising";
      else if ((recent[2] ?? 0) < (recent[0] ?? 0) * 0.8) trend = "falling";
    }

    return {
      location: `Lat ${lat}, Lng ${lng}`,
      currentLevel: latestDischarge,
      dangerThreshold: maxDischarge > 0 ? maxDischarge * 0.8 : 100,
      unit: "m³/s",
      daily: daily.slice(-7),
      trend,
      source: "Open-Meteo Flood API (GloFAS v4 / ECMWF)",
      fetchedAt: new Date().toISOString(),
    };
  } catch {
    return {
      location: `Lat ${lat}, Lng ${lng}`,
      currentLevel: null,
      dangerThreshold: 100,
      unit: "m³/s",
      daily: [],
      trend: "unknown",
      source: "Unavailable",
      fetchedAt: new Date().toISOString(),
    };
  }
}

// ============================================================
// USGS EARTHQUAKE DATA
// ============================================================

export async function fetchNearbyEarthquakes(
  lat: number = PUNE_LAT,
  lng: number = PUNE_LNG,
  radiusKm: number = 500
): Promise<RealEarthquake[]> {
  const url = `https://earthquake.usgs.gov/fdsnws/event/1/query?format=geojson&latitude=${lat}&longitude=${lng}&maxradiuskm=${radiusKm}&minmagnitude=2.5&orderby=time&limit=10`;

  try {
    const res = await fetch(url, { next: { revalidate: 600 } }); // cache 10 min
    if (!res.ok) throw new Error(`USGS failed: ${res.status}`);
    const data = await res.json();

    return (data.features || []).map((f: Record<string, Record<string, unknown> | undefined>) => {
      const props = (f.properties ?? {}) as Record<string, unknown>;
      const geom = (f.geometry ?? {}) as Record<string, unknown>;
      const coords = (geom.coordinates as number[] | undefined) ?? [];
      return {
        magnitude: (props.mag as number) ?? 0,
        place: (props.place as string) ?? "Unknown",
        time: new Date((props.time as number) ?? 0).toISOString(),
        depth: coords[2] ?? 0,
        url: (props.url as string) ?? "",
      };
    });
  } catch {
    return [];
  }
}

// ============================================================
// HELPER: Format all real data into a context string for AI
// ============================================================

export async function fetchAllRealData(
  lat: number = PUNE_LAT,
  lng: number = PUNE_LNG,
  locationName: string = "Pune, Maharashtra"
): Promise<string> {
  const [weather, alerts, flood, earthquakes] = await Promise.all([
    fetchRealWeather(lat, lng),
    fetchRealAlerts(),
    fetchRealFloodData(lat, lng),
    fetchNearbyEarthquakes(lat, lng),
  ]);

  let ctx = `\n## REAL-TIME DATA (Fetched live. Use ONLY this data. Do NOT fabricate anything.)\n`;
  ctx += `### Location: ${locationName}\n`;
  ctx += `### Data fetched at: ${new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata" })}\n\n`;

  // Weather
  ctx += `### Weather (Source: ${weather.source})\n`;
  ctx += `- Temperature: ${weather.temp}°C (Feels like ${weather.feelsLike}°C)\n`;
  ctx += `- Condition: ${weather.condition}\n`;
  ctx += `- Humidity: ${weather.humidity}%\n`;
  ctx += `- Rainfall (current): ${weather.rainfallMm} mm\n`;
  ctx += `- Wind: ${weather.windSpeed} km/h\n`;
  ctx += `- ${weather.description}\n`;
  ctx += `- Hourly: ${weather.hourly.map((h) => `${h.time}: ${h.temp}°C, ${h.rain}mm`).join(" | ")}\n`;
  ctx += `- 7-Day: ${weather.daily.map((d) => `${d.day}: ${d.condition}, ${d.high}/${d.low}°C, ${d.rain}mm`).join(" | ")}\n\n`;

  // Alerts
  ctx += `### Active Disaster Alerts (Source: NDMA SACHET)\n`;
  if (alerts.length === 0) {
    ctx += `- No active disaster alerts for your area at this time.\n`;
  } else {
    ctx += alerts
      .map(
        (a) =>
          `- [${a.severity}] ${a.disasterType} — ${a.area} (${a.source})\n  ${a.message}\n  Valid: ${a.effectiveStart} to ${a.effectiveEnd}`
      )
      .join("\n");
  }
  ctx += "\n\n";

  // Flood
  ctx += `### River/Flood Data (Source: ${flood.source})\n`;
  if (flood.currentLevel !== null) {
    ctx += `- Current river discharge: ${flood.currentLevel} ${flood.unit}\n`;
    ctx += `- Peak forecast: ${Math.max(...flood.daily.map((d) => d.max))} ${flood.unit}\n`;
    ctx += `- Trend: ${flood.trend}\n`;
    ctx += `- Daily: ${flood.daily.map((d) => `${d.date}: ${d.discharge} (max ${d.max}) ${flood.unit}`).join(" | ")}\n`;
  } else {
    ctx += `- Flood data unavailable for this location.\n`;
  }
  ctx += "\n\n";

  // Earthquakes
  ctx += `### Recent Earthquakes within 500km (Source: USGS)\n`;
  if (earthquakes.length === 0) {
    ctx += `- No recent earthquakes detected near this location.\n`;
  } else {
    ctx += earthquakes
      .map((e) => `- M${e.magnitude} — ${e.place} (${e.depth}km depth, ${new Date(e.time).toLocaleString("en-IN", { timeZone: "Asia/Kolkata" })})`)
      .join("\n");
  }
  ctx += "\n";

  return ctx;
}
