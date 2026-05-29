"use client";

import { useEffect, useMemo, useState } from "react";
import type { Risk } from "@/components/dashboard/types";

const API = process.env.NEXT_PUBLIC_API_URL;
const PAGE_SIZE = 20;

type SortKey = "lst_desc" | "severity_desc" | "ndvi_asc";
type TabKey = "all" | "high" | "medium" | "low";

type HotspotRow = {
  id: string;
  name: string;
  risk: Risk;
  severity: number;
  lst_c: number | null;
  ndvi: number | null;
  intervention_type: string | null;
  intervention_rationale: string | null;
  lng: number;
  lat: number;
};

function RiskBadge({ risk }: { risk: Risk }) {
  const cls =
    risk === "high"
      ? "bg-red-100 text-red-800 border-red-200"
      : risk === "medium"
      ? "bg-amber-100 text-amber-800 border-amber-200"
      : "bg-emerald-100 text-emerald-800 border-emerald-200";
  return (
    <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-medium ${cls}`}>
      {risk.toUpperCase()}
    </span>
  );
}

const TABS: { key: TabKey; label: string; color: string }[] = [
  { key: "all", label: "All Zones", color: "text-zinc-900" },
  { key: "high", label: "High Risk", color: "text-red-600" },
  { key: "medium", label: "Medium Risk", color: "text-amber-600" },
  { key: "low", label: "Cooling Zones", color: "text-emerald-600" },
];

export default function Page() {
  const [tab, setTab] = useState<TabKey>("high");
  const [sort, setSort] = useState<SortKey>("lst_desc");
  const [allRows, setAllRows] = useState<HotspotRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [stats, setStats] = useState({
    total: 0, high: 0, medium: 0, low: 0
  });

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`${API}/hotspots/all`);
        if (!res.ok) throw new Error("Failed to fetch");
        const data = await res.json();
        setAllRows(data.hotspots);
        setStats({
          total: data.hotspots.length,
          high: data.hotspots.filter((r: HotspotRow) => r.risk === "high").length,
          medium: data.hotspots.filter((r: HotspotRow) => r.risk === "medium").length,
          low: data.hotspots.filter((r: HotspotRow) => r.risk === "low").length,
        });
      } catch (err) {
        console.warn("Failed to load hotspots:", err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  // Reset page when tab or sort changes
  useEffect(() => { setPage(1); }, [tab, sort]);

  const filtered = useMemo(() => {
    let rows = allRows;
    if (tab !== "all") rows = rows.filter((r) => r.risk === tab);
    return [...rows].sort((a, b) => {
      if (sort === "lst_desc") return (b.lst_c ?? -Infinity) - (a.lst_c ?? -Infinity);
      if (sort === "severity_desc") return (b.severity ?? 0) - (a.severity ?? 0);
      if (sort === "ndvi_asc") return (a.ndvi ?? Infinity) - (b.ndvi ?? Infinity);
      return 0;
    });
  }, [allRows, tab, sort]);

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const rows = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const tabCount = (key: TabKey) => {
    if (key === "all") return stats.total;
    if (key === "high") return stats.high;
    if (key === "medium") return stats.medium;
    if (key === "low") return stats.low;
    return 0;
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div>
        <h1 className="text-xl font-semibold text-zinc-900">Hotspots</h1>
        <p className="text-sm text-zinc-600">
          Predicted heat zones for Greater Kuala Lumpur — Random Forest model
          using MODIS LST + Sentinel-2 NDVI (2022–2024).
        </p>
      </div>

      {/* Stats cards */}
      {!loading && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            { label: "Total Zones", value: stats.total, color: "text-zinc-900", bg: "bg-white" },
            { label: "High Risk", value: stats.high, color: "text-red-600", bg: "bg-red-50" },
            { label: "Medium Risk", value: stats.medium, color: "text-amber-600", bg: "bg-amber-50" },
            { label: "Cooling Zones", value: stats.low, color: "text-emerald-600", bg: "bg-emerald-50" },
          ].map((s) => (
            <div key={s.label} className={`rounded-xl border border-zinc-200 ${s.bg} p-3`}>
              <div className="text-xs text-zinc-500">{s.label}</div>
              <div className={`text-2xl font-semibold mt-1 ${s.color}`}>{s.value}</div>
            </div>
          ))}
        </div>
      )}

      {/* Tabs + Sort */}
      <div className="rounded-xl border border-zinc-200 bg-white">
        {/* Tab bar */}
        <div className="flex items-center justify-between border-b border-zinc-200 px-4">
          <div className="flex gap-0">
            {TABS.map((t) => (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                className={[
                  "flex items-center gap-1.5 border-b-2 px-4 py-3 text-sm font-medium transition-colors",
                  tab === t.key
                    ? `border-zinc-900 ${t.color}`
                    : "border-transparent text-zinc-500 hover:text-zinc-700",
                ].join(" ")}
              >
                {t.label}
                {!loading && (
                  <span className={[
                    "rounded-full px-1.5 py-0.5 text-[10px] font-medium",
                    tab === t.key
                      ? "bg-zinc-100 text-zinc-700"
                      : "bg-zinc-100 text-zinc-500",
                  ].join(" ")}>
                    {tabCount(t.key)}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* Sort */}
          <div className="flex items-center gap-2 py-2">
            <span className="text-xs text-zinc-500">Sort:</span>
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value as SortKey)}
              className="rounded-lg border border-zinc-200 bg-white px-2 py-1.5 text-xs text-zinc-900 outline-none"
            >
              <option value="lst_desc">LST (highest)</option>
              <option value="severity_desc">Severity</option>
              <option value="ndvi_asc">NDVI (lowest)</option>
            </select>
          </div>
        </div>

        {/* Tab description */}
        <div className="px-4 py-2 text-[11px] text-zinc-500 border-b border-zinc-100">
          {tab === "all" && "All predicted zones across Greater KL — sorted by selected criteria."}
          {tab === "high" && "🔴 High risk zones — LST ≥36°C. Require urgent cooling interventions."}
          {tab === "medium" && "🟡 Medium risk zones — LST 33–36°C. Require monitoring and moderate interventions."}
          {tab === "low" && "🟢 Cooling zones — LST <33°C. Green reference areas that help mitigate urban heat."}
        </div>

        {/* Table */}
        {loading ? (
          <div className="px-4 py-8 text-center text-sm text-zinc-400">
            Loading hotspot data...
          </div>
        ) : rows.length === 0 ? (
          <div className="px-4 py-8 text-center text-sm text-zinc-400">
            No zones found.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-zinc-50 text-xs text-zinc-600">
                <tr>
                  <th className="px-4 py-3 w-8 text-zinc-400">#</th>
                  <th className="px-4 py-3">Zone</th>
                  <th className="px-4 py-3">Risk</th>
                  <th className="px-4 py-3 whitespace-nowrap">LST (°C)</th>
                  <th className="px-4 py-3">NDVI</th>
                  <th className="px-4 py-3">Intervention</th>
                  <th className="px-4 py-3 text-zinc-400 text-[11px]">Rationale</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r, i) => (
                  <tr
                    key={`${r.id}-${i}`}
                    className="border-t border-zinc-100 hover:bg-zinc-50"
                  >
                    <td className="px-4 py-2.5 text-xs text-zinc-400">
                      {(page - 1) * PAGE_SIZE + i + 1}
                    </td>
                    <td className="px-4 py-2.5 text-zinc-900 font-medium">
                      {r.name}
                    </td>
                    <td className="px-4 py-2.5">
                      <RiskBadge risk={r.risk} />
                    </td>
                    <td className="px-4 py-2.5 text-zinc-700 font-mono text-xs">
                      {r.lst_c != null ? r.lst_c.toFixed(1) : "—"}
                    </td>
                    <td className="px-4 py-2.5 text-zinc-700 font-mono text-xs">
                      {r.ndvi != null ? r.ndvi.toFixed(3) : "—"}
                    </td>
                    <td className="px-4 py-2.5 text-xs text-zinc-700">
                      <span className={[
                        "inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium border",
                        r.intervention_type === "Tree Planting"
                          ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                          : r.intervention_type === "Reflective Roofs"
                          ? "bg-blue-50 text-blue-700 border-blue-200"
                          : r.intervention_type === "Shaded Walkways"
                          ? "bg-amber-50 text-amber-700 border-amber-200"
                          : "bg-zinc-50 text-zinc-600 border-zinc-200",
                      ].join(" ")}>
                        {r.intervention_type ?? "—"}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 text-[11px] text-zinc-400 max-w-xs truncate">
                      {r.intervention_rationale ?? "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {!loading && totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-zinc-200 px-4 py-3">
            <span className="text-xs text-zinc-500">
              Page {page} of {totalPages} — {filtered.length} zones
            </span>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setPage(1)}
                disabled={page === 1}
                className="rounded-lg border border-zinc-200 px-2 py-1 text-xs text-zinc-600 hover:bg-zinc-50 disabled:opacity-40"
              >«</button>
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="rounded-lg border border-zinc-200 px-2 py-1 text-xs text-zinc-600 hover:bg-zinc-50 disabled:opacity-40"
              >‹</button>

              {Array.from({ length: totalPages }, (_, i) => i + 1)
                .filter((p) => p === 1 || p === totalPages || Math.abs(p - page) <= 2)
                .reduce<(number | string)[]>((acc, p, idx, arr) => {
                  if (idx > 0 && (p as number) - (arr[idx - 1] as number) > 1) {
                    acc.push("...");
                  }
                  acc.push(p);
                  return acc;
                }, [])
                .map((p, idx) =>
                  p === "..." ? (
                    <span key={`e-${idx}`} className="px-1 text-xs text-zinc-400">...</span>
                  ) : (
                    <button
                      key={p}
                      onClick={() => setPage(p as number)}
                      className={[
                        "rounded-lg border px-2.5 py-1 text-xs",
                        page === p
                          ? "border-zinc-900 bg-zinc-900 text-white"
                          : "border-zinc-200 text-zinc-600 hover:bg-zinc-50",
                      ].join(" ")}
                    >{p}</button>
                  )
                )}

              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="rounded-lg border border-zinc-200 px-2 py-1 text-xs text-zinc-600 hover:bg-zinc-50 disabled:opacity-40"
              >›</button>
              <button
                onClick={() => setPage(totalPages)}
                disabled={page === totalPages}
                className="rounded-lg border border-zinc-200 px-2 py-1 text-xs text-zinc-600 hover:bg-zinc-50 disabled:opacity-40"
              >»</button>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="border-t border-zinc-200 px-4 py-3 text-[11px] text-zinc-400">
          Data: MODIS LST + Sentinel-2 NDVI — Random Forest (R² = 0.652, MAE = 1.63°C, RMSE = 2.15°C)
        </div>
      </div>
    </div>
  );
}