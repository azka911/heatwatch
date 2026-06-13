"use client";

import { useEffect, useState } from "react";
import type { Mode } from "./types";

const API = process.env.NEXT_PUBLIC_API_URL;

type InsightPanelProps = {
  mode: Mode;
  summary: {
    avg_lst: number;
    avg_ndvi: number;
    hotspot_count: number;
    high_risk_count: number;
  };
  suhi: {
    suhi: number;
    urban_lst: number;
    rural_lst: number;
  };
};

export default function InsightPanel({ mode, summary, suhi }: InsightPanelProps) {
  const isPredicted = mode === "predicted";
  const [interventions, setInterventions] = useState<{ type: string; count: number }[]>([]);
  const [loading, setLoading] = useState(true);

  // Only fetch interventions once — they don't change with mode
  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`${API}/hotspots/all`);
        if (!res.ok) throw new Error("Failed");
        const data = await res.json();

        const counts: Record<string, number> = {};
        (data.hotspots ?? []).forEach((h: any) => {
          const t = h.intervention_type ?? "Unknown";
          counts[t] = (counts[t] ?? 0) + 1;
        });

        setInterventions(
          Object.entries(counts)
            .map(([type, count]) => ({ type, count }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 4)
        );
      } catch (err) {
        console.warn("InsightPanel interventions failed:", err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []); // Only once

  // Guard against undefined props during initial load
  if (!summary || !suhi) {
    return (
      <div className="h-full min-h-0 rounded-xl border border-slate-200 bg-white p-4 shadow-sm flex items-center justify-center">
        <div className="text-xs text-zinc-400">Loading insights...</div>
      </div>
    );
  }

  const interventionColor = (type: string) =>
    type.includes("Tree") || type.includes("Forest") || type.includes("Green") || type.includes("Buffer")
      ? "bg-emerald-100 text-emerald-700"
      : type.includes("Roof") || type.includes("Cool") || type.includes("Pavement")
      ? "bg-blue-100 text-blue-700"
      : type.includes("Shaded") || type.includes("Walkway") || type.includes("Corridor")
      ? "bg-amber-100 text-amber-700"
      : type.includes("Water")
      ? "bg-cyan-100 text-cyan-700"
      : "bg-zinc-100 text-zinc-600";

  return (
    <div className="h-full min-h-0 rounded-xl border border-slate-200 bg-white p-4 shadow-sm flex flex-col overflow-auto">

      {/* Header */}
      <div className="flex items-center justify-between shrink-0">
        <h3 className="text-sm font-semibold text-zinc-900">
          {isPredicted ? "Model Insights" : "Analytical Insights"}
        </h3>
        <span className="rounded-full border border-zinc-200 bg-zinc-50 px-2 py-1 text-[11px] text-zinc-700">
          {isPredicted ? "Predicted" : "Observed"}
        </span>
      </div>

      {/* Key metrics — from props, instant no loading */}
      <div className="mt-3 grid grid-cols-2 gap-2 shrink-0">
        <div className="rounded-lg border border-zinc-100 bg-zinc-50 p-2">
          <div className="text-[10px] text-zinc-500">Avg LST</div>
          <div className="text-base font-semibold text-zinc-900">
            {summary.avg_lst}°C
          </div>
        </div>
        <div className="rounded-lg border border-zinc-100 bg-zinc-50 p-2">
          <div className="text-[10px] text-zinc-500">Avg NDVI</div>
          <div className="text-base font-semibold text-zinc-900">
            {summary.avg_ndvi}
          </div>
        </div>
        <div className="rounded-lg border border-red-100 bg-red-50 p-2">
          <div className="text-[10px] text-zinc-500">High Risk</div>
          <div className="text-base font-semibold text-red-600">
            {summary.high_risk_count} zones
          </div>
        </div>
        <div className="rounded-lg border border-amber-100 bg-amber-50 p-2">
          <div className="text-[10px] text-zinc-500">SUHI</div>
          <div className="text-base font-semibold text-amber-600">
            +{suhi.suhi}°C
          </div>
        </div>
      </div>

      {/* Insights text */}
      <div className="mt-3 space-y-1.5 text-xs text-zinc-600 shrink-0">
        {isPredicted ? (
          <>
            <p>• Model predicts {summary.high_risk_count} high risk zones with LST ≥36°C across Greater KL.</p>
            <p>• Urban zones average {suhi.urban_lst}°C vs rural {suhi.rural_lst}°C — SUHI of +{suhi.suhi}°C.</p>
            <p>• NDVI is the strongest predictor (68.5% importance) — greening reduces LST effectively.</p>
          </>
        ) : (
          <>
            <p>• Observed avg LST of {summary.avg_lst}°C across {summary.hotspot_count} medium-high risk zones.</p>
            <p>• Urban core runs {suhi.suhi}°C hotter than surrounding rural/green areas.</p>
            <p>• Low NDVI zones ({"<"}0.2) consistently show LST 3–5°C above vegetated areas.</p>
          </>
        )}
      </div>

      <div className="my-3 border-t border-zinc-100 shrink-0" />

      {/* Top interventions */}
      <div className="shrink-0">
        <div className="text-xs font-semibold text-zinc-700 mb-2">
          {isPredicted ? "Recommended Interventions" : "Suggested Interventions"}
        </div>
        {loading ? (
          <div className="text-xs text-zinc-400">Loading interventions...</div>
        ) : (
          <div className="space-y-1.5">
            {interventions.map((item) => (
              <div
                key={item.type}
                className="flex items-center justify-between rounded-lg border border-zinc-100 bg-zinc-50 px-2.5 py-1.5"
              >
                <span className={`text-[11px] font-medium rounded-full px-2 py-0.5 ${interventionColor(item.type)}`}>
                  {item.type}
                </span>
                <span className="text-[10px] text-zinc-400">
                  {item.count} zones
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* UHI context */}
      <div className="mt-3 rounded-lg border border-zinc-200 bg-zinc-50 p-3 shrink-0">
        <div className="text-[10px] font-semibold text-zinc-600 uppercase tracking-wide mb-1">
          Urban vs Rural
        </div>
        <div className="flex items-center gap-2 text-xs">
          <div className="flex-1">
            <div className="text-zinc-500">Urban</div>
            <div className="font-semibold text-red-600">{suhi.urban_lst}°C</div>
          </div>
          <div className="text-zinc-300">vs</div>
          <div className="flex-1">
            <div className="text-zinc-500">Rural</div>
            <div className="font-semibold text-emerald-600">{suhi.rural_lst}°C</div>
          </div>
          <div className="flex-1 text-right">
            <div className="text-zinc-500">Difference</div>
            <div className="font-semibold text-amber-600">+{suhi.suhi}°C</div>
          </div>
        </div>
      </div>
    </div>
  );
}