"use client";

import { useEffect, useState } from "react";
import FilterPanel from "./FilterPanel";
import MapPlaceholder from "./MapPlaceholder";
import InsightPanel from "./InsightPanel";
import KpiCard from "./KpiCard";
import { fetchHotspotRows } from "./hotspotData";
import type { HotspotRow } from "./types";
import { useDashboard } from "@/context/DashboardContext";
import {
  Thermometer,
  Flame,
  Leaf,
  AlertTriangle,
  Wind,
} from "lucide-react";

const API = process.env.NEXT_PUBLIC_API_URL;

type Summary = {
  avg_lst: number;
  avg_ndvi: number;
  hotspot_count: number;
  high_risk_count: number;
  study_area: string;
  resolution: string;
};

type Suhi = {
  suhi: number;
  urban_lst: number;
  rural_lst: number;
};

export default function DashboardClient() {
  const { mode } = useDashboard();
  const isPredicted = mode === "predicted";

  const [summary, setSummary] = useState<Summary>({
    avg_lst: 33.4,
    avg_ndvi: 0.52,
    hotspot_count: 0,
    high_risk_count: 0,
    study_area: "KL",
    resolution: "1km",
  });

  const [suhi, setSuhi] = useState<Suhi>({
    suhi: 0,
    urban_lst: 0,
    rural_lst: 0,
  });

  const [rows, setRows] = useState<HotspotRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const summaryEndpoint = mode === "predicted"
          ? `${API}/summary/predicted`
          : `${API}/summary/observed`;

        const [summaryRes, suhiRes, hotspotRows] = await Promise.all([
          fetch(summaryEndpoint).then((r) => r.json()),
          fetch(`${API}/suhi`).then((r) => r.json()),
          fetchHotspotRows(),
        ]);

        setSummary((prev) => ({
          ...prev,
          avg_lst: summaryRes?.avg_lst ?? prev.avg_lst,
          avg_ndvi: summaryRes?.avg_ndvi ?? prev.avg_ndvi,
          hotspot_count: summaryRes?.hotspot_count ?? prev.hotspot_count,
          high_risk_count: summaryRes?.high_risk_count ?? prev.high_risk_count,
          study_area: summaryRes?.study_area ?? prev.study_area,
          resolution: summaryRes?.resolution ?? prev.resolution,
        }));

        setSuhi((prev) => ({
          ...prev,
          suhi: suhiRes?.suhi ?? prev.suhi,
          urban_lst: suhiRes?.urban_lst ?? prev.urban_lst,
          rural_lst: suhiRes?.rural_lst ?? prev.rural_lst,
        }));

        setRows(hotspotRows);

      } catch (err) {
        console.warn("Failed to load dashboard data:", err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [mode]);

  const top = [...rows].sort((a, b) => b.severity - a.severity).slice(0, 6);
  const topRowHeight = "h-[calc(100vh-260px)] min-h-[520px]";

  return (
    <div className="min-h-screen w-full bg-slate-50">
      <div className="mx-auto w-full max-w-screen space-y-3 px-4 py-1 md:px-5">

        {/* KPI ROW */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          <KpiCard
            label="Avg LST (°C)"
            value={loading ? "..." : (summary.avg_lst?.toString() ?? "—")}
            sub={isPredicted ? "Predicted" : "Observed"}
            icon={<Thermometer className="h-5 w-5" />}
          />
          <KpiCard
            label="Hotspots"
            value={loading ? "..." : (summary.hotspot_count?.toString() ?? "—")}
            sub={isPredicted ? "Predicted" : "Detected"}
            icon={<Flame className="h-5 w-5" />}
          />
          <KpiCard
            label="Avg NDVI"
            value={loading ? "..." : (summary.avg_ndvi?.toString() ?? "—")}
            sub="Vegetation"
            icon={<Leaf className="h-5 w-5" />}
          />
          <KpiCard
            label="High Risk"
            value={loading ? "..." : (summary.high_risk_count?.toString() ?? "—")}
            sub="Zones"
            icon={<AlertTriangle className="h-5 w-5" />}
          />
          <KpiCard
            label="SUHI (°C)"
            value={loading ? "..." : (suhi.suhi != null ? `+${suhi.suhi}` : "—")}
            sub="Urban vs Rural"
            icon={<Wind className="h-5 w-5" />}
          />
          <KpiCard
            label="Resolution"
            value={loading ? "..." : (summary.resolution ?? "1km")}
            sub="Satellite"
            icon={<Thermometer className="h-5 w-5" />}
          />
        </div>

        {/* TOP GRID: MAP + RIGHT PANEL */}
        <div className="grid gap-3 lg:grid-cols-12 items-stretch">
          <div className="lg:col-span-9 h-full">
            <div className={[
              topRowHeight,
              "rounded-2xl border border-zinc-200 bg-white shadow-sm flex flex-col",
            ].join(" ")}>
              <div className="flex items-center justify-between border-b border-zinc-200 px-4 py-2.5">
                <div>
                  <div className="text-sm font-semibold text-zinc-900">
                    Urban Heat & Hotspot Map
                  </div>
                  <div className="text-xs text-zinc-500">
                    Study area: Kuala Lumpur (locked)
                  </div>
                </div>
                <span className="rounded-full border border-zinc-200 bg-zinc-50 px-2 py-1 text-[11px] text-zinc-700">
                  {isPredicted ? "Predicted" : "Observed"}
                </span>
              </div>
              <div className="p-3 flex-1 min-h-0">
                <div className="h-full w-full overflow-hidden rounded-xl border border-zinc-200 bg-zinc-50">
                  <MapPlaceholder />
                </div>
              </div>
            </div>
          </div>

          <div className={[
            "lg:col-span-3",
            topRowHeight,
            "min-h-0 flex flex-col gap-3",
          ].join(" ")}>
            <div className="shrink-0 rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm">
              <div className="mb-2 text-sm font-semibold text-zinc-900">
                mode
              </div>
              <FilterPanel />
            </div>
            <div className="flex-1 min-h-0">
              <InsightPanel 
                mode={mode}
                summary={summary}
                suhi={suhi}
              />
            </div>
          </div>
        </div>

        {/* HOTSPOT TABLE */}
        <div className="w-full">
          <div className="w-full min-w-0 rounded-2xl border border-zinc-200 bg-white shadow-sm">
            <div className="flex items-center justify-between border-b border-zinc-200 px-4 py-3">
              <div>
                <div className="text-sm font-semibold text-zinc-900">
                  {isPredicted ? "Predicted Hotspot Formation" : "Detected Hotspots"}
                </div>
                <div className="text-xs text-zinc-500">
                  {isPredicted
                    ? "Ranked by forecast likelihood"
                    : `Top 6 highest LST zones — ${summary.high_risk_count} high risk zones total`}
                </div>
              </div>
              <span className="rounded-full border border-zinc-200 bg-zinc-50 px-2 py-1 text-[11px] text-zinc-700">
                {loading ? "..." : `${top.length} shown`}
              </span>
            </div>

            <div className="w-full overflow-x-auto">
              {loading ? (
                <div className="px-4 py-8 text-center text-sm text-zinc-400">
                  Loading hotspot data...
                </div>
              ) : top.length === 0 ? (
                <div className="px-4 py-8 text-center text-sm text-zinc-400">
                  No hotspot data available.
                </div>
              ) : (
                <table className="w-full min-w-[720px] text-left text-sm">
                  <thead className="bg-zinc-50 text-xs text-zinc-600">
                    <tr>
                      <th className="px-4 py-3">Location</th>
                      <th className="px-4 py-3 whitespace-nowrap">Risk</th>
                      <th className="px-4 py-3 whitespace-nowrap">LST (°C)</th>
                      <th className="px-4 py-3 whitespace-nowrap">NDVI</th>
                      <th className="px-4 py-3 whitespace-nowrap">Intervention</th>
                    </tr>
                  </thead>
                  <tbody>
                    {top.map((r, i) => (
                      <tr
                        key={`${r.id}-${i}`}
                        className="border-t border-zinc-200 hover:bg-zinc-50"
                      >
                        <td className="px-4 py-3 text-zinc-900">{r.name}</td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <span className={[
                            "inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-medium",
                            r.risk === "high"
                              ? "border-red-200 bg-red-100 text-red-800"
                              : r.risk === "medium"
                              ? "border-amber-200 bg-amber-100 text-amber-800"
                              : "border-emerald-200 bg-emerald-100 text-emerald-800",
                          ].join(" ")}>
                            {r.risk.toUpperCase()}
                          </span>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-zinc-700 font-mono text-xs">
                          {r.lst_c != null ? r.lst_c.toFixed(1) : "—"}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-zinc-700 font-mono text-xs">
                          {r.ndvi != null ? r.ndvi.toFixed(3) : "—"}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-zinc-700 text-xs">
                          {(r as any).intervention_type ?? "—"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            {/* SUHI Summary Row */}
            {!loading && (
              <div className="border-t border-zinc-200 px-4 py-3 bg-zinc-50">
                <div className="flex flex-wrap gap-4 text-xs text-zinc-600">
                  <span>
                    <strong>Urban LST:</strong> {suhi.urban_lst}°C
                  </span>
                  <span>
                    <strong>Rural LST:</strong> {suhi.rural_lst}°C
                  </span>
                  <span>
                    <strong>SUHI Intensity:</strong> +{suhi.suhi}°C
                  </span>
                  <span className="text-zinc-400">
                    Greater KL urban heat island analysis — MODIS LST 2022–2024
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}