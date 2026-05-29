"use client";

import { useDashboard } from "@/context/DashboardContext";

export default function FilterPanel() {
  const { city, mode, setMode } = useDashboard();

  return (
    <div className="p-1">
      <div className="flex flex-col gap-3">

        {/* Grid for aligned labels */}
        <div className="grid grid-cols-[auto_1fr] items-center gap-x-3 gap-y-2.5">
          
          {/* Study Area */}
          <span className="text-xs font-medium text-zinc-600 whitespace-nowrap">
            Study Area
          </span>
          <span className="rounded-full border border-zinc-200 bg-zinc-50 px-3 py-1 text-xs font-medium text-zinc-800 w-fit">
            {city} <span className="text-zinc-500">(Locked)</span>
          </span>

          {/* Data Period */}
          <span className="text-xs font-medium text-zinc-600 whitespace-nowrap">
            Data Period
          </span>
          <span className="rounded-full border border-zinc-200 bg-zinc-50 px-3 py-1 text-xs text-zinc-700 w-fit">
            2022 – 2024
          </span>

          {/* Mode */}
          <span className="text-xs font-medium text-zinc-600 whitespace-nowrap">
            Mode
          </span>
          <div className="inline-flex overflow-hidden rounded-lg border border-zinc-200 w-fit">
            <button
              type="button"
              onClick={() => setMode("observed")}
              className={`px-3 py-1.5 text-xs font-medium ${
                mode === "observed"
                  ? "bg-zinc-900 text-white"
                  : "bg-white text-zinc-800 hover:bg-zinc-50"
              }`}
            >
              Observed
            </button>
            <button
              type="button"
              onClick={() => setMode("predicted")}
              className={`px-3 py-1.5 text-xs font-medium ${
                mode === "predicted"
                  ? "bg-zinc-900 text-white"
                  : "bg-white text-zinc-800 hover:bg-zinc-50"
              }`}
            >
              Predicted
            </button>
          </div>
        </div>

        {/* Mode description */}
        <div className="rounded-lg border border-zinc-100 bg-zinc-50 px-3 py-2">
          {mode === "observed" ? (
            <p className="text-[11px] text-zinc-500">
              <span className="font-medium text-zinc-700">Observed mode</span> —
              displays real MODIS LST satellite data averaged over 2022–2024.
            </p>
          ) : (
            <p className="text-[11px] text-zinc-500">
              <span className="font-medium text-zinc-700">Predicted mode</span> —
              displays Random Forest model predictions based on NDVI and land cover features.
            </p>
          )}
        </div>

      </div>
    </div>
  );
}