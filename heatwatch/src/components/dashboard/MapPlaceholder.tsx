"use client";

import { useState } from "react";
import { useDashboard } from "@/context/DashboardContext";
import MapView from "@/components/map/MapView";

type Basemap = "light" | "satellite";

export default function MapPlaceholder() {
  const { city, mode } = useDashboard();

  const [basemap, setBasemap] = useState<Basemap>("light");
  const [showTerrain, setShowTerrain] = useState(true);
  const [showHeatmap, setShowHeatmap] = useState(true);
  const [showHighRisk, setShowHighRisk] = useState(true);
  const [showMediumRisk, setShowMediumRisk] = useState(true);
  const [showLowRisk, setShowLowRisk] = useState(false);

  return (
    <div className="grid h-full w-full gap-3 lg:grid-cols-12 items-stretch">
      {/* LEFT PANEL */}
      <aside className="lg:col-span-3 h-full min-h-0">
        <div className="h-full min-h-0 rounded-xl border border-slate-200 bg-white shadow-sm flex flex-col overflow-hidden">
          {/* Header */}
          <div className="p-3 border-b border-slate-200">
            <div className="text-sm font-semibold text-slate-900">Map Context</div>
            <p className="mt-1 text-xs text-slate-500">
              City-scale visualization for urban heat interpretation.
            </p>
          </div>

          {/* Scroll area */}
          <div className="min-h-0 flex-1 overflow-auto p-3">
            <div className="space-y-2.5 text-sm">

              {/* Study / Mode */}
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                <div className="text-xs text-slate-500">Study Area</div>
                <div className="mt-0.5 font-medium text-slate-900">{city}</div>
                <div className="mt-2 text-xs text-slate-500">Mode</div>
                <div className="mt-0.5 font-medium text-slate-900">{mode}</div>
              </div>

              {/* Map controls */}
              <div className="rounded-lg border border-slate-200 p-3">
                <div className="text-xs font-medium text-slate-700">Map Controls</div>

                {/* Basemap */}
                <div className="mt-3">
                  <div className="text-[11px] font-medium text-slate-600">Basemap</div>
                  <div className="mt-2 grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setBasemap("light")}
                      className={[
                        "rounded-lg border px-3 py-2 text-xs font-medium",
                        basemap === "light"
                          ? "border-slate-900 bg-slate-900 text-white"
                          : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50",
                      ].join(" ")}
                    >
                      Light
                    </button>
                    <button
                      type="button"
                      onClick={() => setBasemap("satellite")}
                      className={[
                        "rounded-lg border px-3 py-2 text-xs font-medium",
                        basemap === "satellite"
                          ? "border-slate-900 bg-slate-900 text-white"
                          : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50",
                      ].join(" ")}
                    >
                      Satellite
                    </button>
                  </div>
                </div>

                {/* Layers */}
                <div className="mt-4 space-y-2">
                  <div className="text-[11px] font-medium text-slate-600">Layers</div>

                  {/* 3D Terrain */}
                  <label className="flex cursor-pointer items-center justify-between rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
                    <div>
                      <div className="text-xs font-medium text-slate-900">3D Terrain</div>
                      <div className="text-[11px] text-slate-500">Elevation + hillshade</div>
                    </div>
                    <input
                      type="checkbox"
                      checked={showTerrain}
                      onChange={(e) => setShowTerrain(e.target.checked)}
                      className="h-4 w-4"
                    />
                  </label>

                  {/* LST Thermal Grid */}
                  <label className="flex cursor-pointer items-center justify-between rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
                    <div>
                      <div className="text-xs font-medium text-slate-900">LST Thermal Grid</div>
                      <div className="text-[11px] text-slate-500">Temperature surface — zoom out</div>
                    </div>
                    <input
                      type="checkbox"
                      checked={showHeatmap}
                      onChange={(e) => setShowHeatmap(e.target.checked)}
                      className="h-4 w-4"
                    />
                  </label>

                  {/* Divider */}
                  <div className="pt-1 text-[11px] font-medium text-slate-600">
                    Risk Zones
                  </div>

                  {/* High Risk */}
                  <label className="flex cursor-pointer items-center justify-between rounded-lg border border-red-100 bg-red-50 px-3 py-2">
                    <div className="flex items-center gap-2">
                      <span className="h-2.5 w-2.5 rounded-full bg-red-500 shrink-0" />
                      <div>
                        <div className="text-xs font-medium text-slate-900">High Risk Zones</div>
                        <div className="text-[11px] text-slate-500">Top 50 hottest — LST ≥36°C</div>
                      </div>
                    </div>
                    <input
                      type="checkbox"
                      checked={showHighRisk}
                      onChange={(e) => setShowHighRisk(e.target.checked)}
                      className="h-4 w-4"
                    />
                  </label>

                  {/* Medium Risk */}
                  <label className="flex cursor-pointer items-center justify-between rounded-lg border border-amber-100 bg-amber-50 px-3 py-2">
                    <div className="flex items-center gap-2">
                      <span className="h-2.5 w-2.5 rounded-full bg-amber-500 shrink-0" />
                      <div>
                        <div className="text-xs font-medium text-slate-900">Medium Risk Zones</div>
                        <div className="text-[11px] text-slate-500">Moderate stress — LST 33–36°C</div>
                      </div>
                    </div>
                    <input
                      type="checkbox"
                      checked={showMediumRisk}
                      onChange={(e) => setShowMediumRisk(e.target.checked)}
                      className="h-4 w-4"
                    />
                  </label>

                  {/* Low Risk / Cooling Zones */}
                  <label className="flex cursor-pointer items-center justify-between rounded-lg border border-emerald-100 bg-emerald-50 px-3 py-2">
                    <div className="flex items-center gap-2">
                      <span className="h-2.5 w-2.5 rounded-full bg-emerald-500 shrink-0" />
                      <div>
                        <div className="text-xs font-medium text-slate-900">Cooling Zones</div>
                        <div className="text-[11px] text-slate-500">Green reference — LST &lt;33°C</div>
                      </div>
                    </div>
                    <input
                      type="checkbox"
                      checked={showLowRisk}
                      onChange={(e) => setShowLowRisk(e.target.checked)}
                      className="h-4 w-4"
                    />
                  </label>
                </div>

                {/* Legend */}
                <div className="mt-4 rounded-lg border border-slate-200 bg-white p-3">
                  <div className="text-[11px] font-medium text-slate-700">
                    LST Thermal Scale
                  </div>
                  <div className="mt-2 flex items-center gap-1">
                    <span className="text-[10px] text-slate-500">23°C</span>
                    <div className="flex-1 h-2 rounded-full" style={{
                      background: "linear-gradient(to right, #313695, #4575b4, #74add1, #abd9e9, #ffffbf, #fee090, #fdae61, #f46d43, #d73027, #a50026)"
                    }} />
                    <span className="text-[10px] text-slate-500">39°C</span>
                  </div>
                  <div className="mt-3 space-y-1.5 text-xs text-slate-600">
                    <div className="flex items-center gap-2">
                      <span className="h-2.5 w-2.5 rounded-full bg-red-500 shrink-0" />
                      <span>High Risk — urgent intervention</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="h-2.5 w-2.5 rounded-full bg-amber-500 shrink-0" />
                      <span>Medium Risk — monitoring needed</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="h-2.5 w-2.5 rounded-full bg-emerald-500 shrink-0" />
                      <span>Cooling Zone — green reference</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* What you're seeing */}
              <div className="rounded-lg border border-slate-200 p-3">
                <div className="text-xs font-medium text-slate-700">What you're seeing</div>
                <ul className="mt-2 list-disc space-y-1 pl-4 text-xs text-slate-600">
                  <li>LST thermal grid from MODIS satellite (2022–2024).</li>
                  <li>Risk zones predicted by Random Forest model.</li>
                  <li>Terrain shading shows elevation context.</li>
                  <li>Toggle cooling zones to identify green corridors.</li>
                </ul>
              </div>

            </div>
          </div>
        </div>
      </aside>

      {/* MAP */}
      <div className="lg:col-span-9 h-full min-h-0">
        <div className="h-full w-full overflow-hidden rounded-xl border border-slate-200 bg-slate-50">
          <MapView
            basemap={basemap}
            showTerrain={showTerrain}
            showBuildings={true}
            showHotspots={showHighRisk}
            showHeatmap={showHeatmap}
            showMediumRisk={showMediumRisk}
            showLowRisk={showLowRisk}
            mode={mode}
          />
        </div>
      </div>
    </div>
  );
}