import type { HotspotRow, Risk } from "./types";

const API = process.env.NEXT_PUBLIC_API_URL;

function toRisk(v: any): Risk {
  if (v === "low" || v === "medium" || v === "high") return v;
  return "medium";
}

// Fetch top 6 high risk hotspots for dashboard table
export async function fetchHotspotRows(): Promise<HotspotRow[]> {
  try {
    const res = await fetch(`${API}/hotspots/by-risk/high`);
    if (!res.ok) throw new Error("API fetch failed");
    const geojson = await res.json();

    return (geojson.features ?? [])
      .slice(0, 6)
      .map((f: any, idx: number) => ({
        id: String(f.properties?.name ?? idx),
        name: String(f.properties?.name ?? `Zone ${idx + 1}`),
        risk: toRisk(f.properties?.risk),
        severity: Number(f.properties?.severity ?? 1),
        lst_c: f.properties?.lst_c != null ? Number(f.properties.lst_c) : null,
        ndvi: f.properties?.ndvi != null ? Number(f.properties.ndvi) : null,
        lng: f.geometry?.coordinates?.[0] ?? 0,
        lat: f.geometry?.coordinates?.[1] ?? 0,
        intervention_type: f.properties?.intervention_type ?? null,  // ADD
        intervention_rationale: f.properties?.intervention_rationale ?? null,  // ADD
      }));
  } catch (err) {
    console.warn("fetchHotspotRows failed:", err);
    return [];
  }
}
// Keep sync version as empty fallback
export function getHotspotRows(): HotspotRow[] {
  return [];
}

// Fetch summary stats from API
export async function fetchSummaryStats() {
  try {
    const res = await fetch(`${API}/summary`);
    if (!res.ok) throw new Error("API fetch failed");
    const data = await res.json();
    return {
      avg_lst: Number(data.avg_lst),
      avg_ndvi: Number(data.avg_ndvi),
      resolution: data.resolution ?? "1km",
    };
  } catch {
    return { avg_lst: 33.4, avg_ndvi: 0.52, resolution: "1km" };
  }
}