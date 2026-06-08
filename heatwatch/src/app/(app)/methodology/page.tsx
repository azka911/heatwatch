"use client";

import { useEffect, useState } from "react";

const API = process.env.NEXT_PUBLIC_API_URL;

type ModelStats = {
  model_name: string;
  model_version: string;
  mae: number;
  rmse: number;
  r2: number;
  mape: number;
  cv_folds: number;
  cv_r2_mean: number;
  cv_r2_std: number;
  cv_mae_mean: number;
  cv_mae_std: number;
  cv_rmse_mean: number;
  cv_rmse_std: number;
  spatial_r2_mean: number;
  spatial_r2_std: number;
  spatial_mae_mean: number;
  spatial_rmse_mean: number;
  spatial_r2_drop: number;
  created_at: string;
};

function Card({ title, desc, tags }: { title: string; desc: string; tags: string[] }) {
  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-4">
      <h3 className="text-sm font-semibold text-zinc-900">{title}</h3>
      <p className="mt-1 text-sm text-zinc-600">{desc}</p>
      <div className="mt-3 flex flex-wrap gap-2">
        {tags.map((tag) => (
          <span
            key={tag}
            className="rounded-full border border-zinc-200 bg-zinc-50 px-2 py-0.5 text-[11px] text-zinc-600"
          >
            {tag}
          </span>
        ))}
      </div>
    </div>
  );
}

function MetricCard({
  label,
  value,
  desc,
  color,
}: {
  label: string;
  value: string;
  desc: string;
  color: string;
}) {
  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-4">
      <div className="text-xs font-medium text-zinc-500">{label}</div>
      <div className={`mt-1 text-3xl font-semibold ${color}`}>{value}</div>
      <div className="mt-1 text-xs text-zinc-500">{desc}</div>
    </div>
  );
}

export default function Page() {
  const [stats, setStats] = useState<ModelStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch(`${API}/model/stats`)
      .then((r) => {
        if (!r.ok) throw new Error("Failed to fetch model stats");
        return r.json();
      })
      .then((data) => {
        setStats(data);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, []);

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-semibold text-zinc-900">Data & Methodology</h1>
        <p className="text-sm text-zinc-600">
          Study area is fixed to Kuala Lumpur. Real satellite data from MODIS and
          Sentinel-2 processed via Google Earth Engine.
        </p>
      </div>

      {/* Data sources */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card
          title="MODIS Land Surface Temperature (LST)"
          desc="Daily thermal data at 1km resolution. Converted to Celsius using scale factor 0.02 − 273.15. Averaged over 2022–2024."
          tags={["Thermal", "1km resolution", "2022–2024", "KL clip"]}
        />
        <Card
          title="Sentinel-2 NDVI"
          desc="Vegetation index derived from Band 8 (NIR) and Band 4 (Red). Cloud filtered (<20%) and median composited over 2022–2024."
          tags={["Vegetation", "10m resolution", "Cloud filtered", "KL clip"]}
        />
        <Card
          title="ESA WorldCover Land Cover"
          desc="10m resolution land cover classification used as a model input feature to distinguish built-up, vegetation, and water zones."
          tags={["Land cover", "10m resolution", "ESA", "Urban morphology"]}
        />
      </div>

      {/* Model Performance */}
      <div className="rounded-xl border border-zinc-200 bg-white p-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-zinc-900">
            Random Forest Model Performance
          </h2>
          {stats && (
            <span className="rounded-full border border-zinc-200 bg-zinc-50 px-2 py-1 text-[11px] text-zinc-600">
              {stats.model_name} {stats.model_version}
            </span>
          )}
        </div>

        {loading && (
          <div className="mt-4 text-sm text-zinc-400">Loading model metrics...</div>
        )}
        {error && (
          <div className="mt-4 text-sm text-red-500">
            Could not load model stats: {error}
          </div>
        )}

        {stats && !loading && (
          <>
            {/* Baseline */}
            <p className="mt-4 text-xs font-semibold uppercase tracking-wider text-zinc-400">
              Baseline — 80/20 Holdout
            </p>
            <div className="mt-2 grid grid-cols-2 gap-3 sm:grid-cols-4">
              <MetricCard
                label="MAE"
                value={`${stats.mae?.toFixed(2)} °C`}
                desc="Average prediction error"
                color="text-blue-600"
              />
              <MetricCard
                label="RMSE"
                value={`${stats.rmse?.toFixed(2)} °C`}
                desc="Penalises large errors more"
                color="text-amber-600"
              />
              <MetricCard
                label="R² Score"
                value={stats.r2?.toFixed(3)}
                desc="Variance explained by model"
                color={stats.r2 >= 0.6 ? "text-emerald-600" : "text-red-600"}
              />
              <MetricCard
                label="MAPE"
                value={stats.mape ? `${stats.mape?.toFixed(2)}%` : "—"}
                desc="Mean absolute % error"
                color="text-violet-600"
              />
            </div>

            {/* 5-Fold CV */}
            <p className="mt-5 text-xs font-semibold uppercase tracking-wider text-zinc-400">
              5-Fold Cross-Validation
            </p>
            <div className="mt-2 grid grid-cols-1 gap-3 sm:grid-cols-3">
              <MetricCard
                label="CV R² Mean"
                value={stats.cv_r2_mean ? stats.cv_r2_mean?.toFixed(3) : "—"}
                desc={`± ${stats.cv_r2_std?.toFixed(3) ?? "—"} across 5 folds`}
                color="text-emerald-600"
              />
              <MetricCard
                label="CV MAE Mean"
                value={stats.cv_mae_mean ? `${stats.cv_mae_mean?.toFixed(2)} °C` : "—"}
                desc={`± ${stats.cv_mae_std?.toFixed(2) ?? "—"} °C across 5 folds`}
                color="text-blue-600"
              />
              <MetricCard
                label="CV RMSE Mean"
                value={stats.cv_rmse_mean ? `${stats.cv_rmse_mean?.toFixed(2)} °C` : "—"}
                desc={`± ${stats.cv_rmse_std?.toFixed(2) ?? "—"} °C across 5 folds`}
                color="text-amber-600"
              />
            </div>

            {/* Spatial CV */}
            <p className="mt-5 text-xs font-semibold uppercase tracking-wider text-zinc-400">
              Spatial Block Cross-Validation
            </p>
            <div className="mt-2 grid grid-cols-1 gap-3 sm:grid-cols-3">
              <MetricCard
                label="Spatial R² Mean"
                value={stats.spatial_r2_mean ? stats.spatial_r2_mean?.toFixed(3) : "—"}
                desc={`± ${stats.spatial_r2_std?.toFixed(3) ?? "—"} across blocks`}
                color="text-emerald-600"
              />
              <MetricCard
                label="Spatial MAE"
                value={stats.spatial_mae_mean ? `${stats.spatial_mae_mean?.toFixed(2)} °C` : "—"}
                desc="Avg error on unseen locations"
                color="text-blue-600"
              />
              <MetricCard
                label="Spatial R² Drop"
                value={stats.spatial_r2_drop != null ? stats.spatial_r2_drop?.toFixed(3) : "—"}
                desc={
                  stats.spatial_r2_drop != null && stats.spatial_r2_drop < 0.05
                    ? "✅ No spatial leakage"
                    : "⚠️ Spatial autocorrelation present"
                }
                color={
                  stats.spatial_r2_drop != null && stats.spatial_r2_drop < 0.05
                    ? "text-emerald-600"
                    : "text-amber-600"
                }
              />
            </div>
          </>
        )}
      </div>

      {/* Feature Importance */}
      <div className="rounded-xl border border-zinc-200 bg-white p-4">
        <h2 className="text-sm font-semibold text-zinc-900">Feature Importance</h2>
        <p className="mt-1 text-xs text-zinc-500">
          Relative contribution of each input variable to LST prediction
        </p>
        <div className="mt-4 space-y-3">
          {[
            { feature: "NDVI (Vegetation Index)", importance: 89.4, color: "bg-emerald-500" },
            { feature: "Land Cover Class", importance: 10.6, color: "bg-blue-500" },
          ].map((f) => (
            <div key={f.feature}>
              <div className="flex items-center justify-between text-xs text-zinc-600">
                <span>{f.feature}</span>
                <span className="font-medium">{f.importance}%</span>
              </div>
              <div className="mt-1 h-2 w-full rounded-full bg-zinc-100">
                <div
                  className={`h-2 rounded-full ${f.color}`}
                  style={{ width: `${f.importance}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Workflow */}
      <div className="rounded-xl border border-zinc-200 bg-white p-4">
        <h2 className="text-sm font-semibold text-zinc-900">Workflow</h2>
        <ol className="mt-3 space-y-2 text-sm text-zinc-700">
          <li>1. Acquire MODIS LST and Sentinel-2 NDVI via Google Earth Engine for KL (2022–2024).</li>
          <li>2. Export 1,936 sample points clipped to KL bounding box at 1km grid resolution.</li>
          <li>3. Train Random Forest Regressor on NDVI, land cover, road proximity, and month index.</li>
          <li>4. Classify predicted LST into hotspot levels — high (≥36°C), medium (≥33°C), low (&lt;33°C).</li>
          <li>5. Apply rule-based cooling interventions based on hotspot level and vegetation cover.</li>
          <li>6. Visualize results in HeatWatch dashboard with interactive map and analytical insights.</li>
        </ol>
      </div>

      {/* Dataset Summary */}
      <div className="rounded-xl border border-zinc-200 bg-white p-4">
        <h2 className="text-sm font-semibold text-zinc-900">Dataset Summary</h2>
        <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            { label: "Total Samples", value: "1,934" },
            { label: "Training Set", value: "1,547 (80%)" },
            { label: "Test Set", value: "387 (20%)" },
            { label: "Study Period", value: "2022–2024" },
          ].map((item) => (
            <div key={item.label} className="rounded-lg border border-zinc-200 bg-zinc-50 p-3">
              <div className="text-xs text-zinc-500">{item.label}</div>
              <div className="mt-1 text-sm font-semibold text-zinc-900">{item.value}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Assumptions & Limitations */}
      <div className="rounded-xl border border-zinc-200 bg-white p-4">
        <h2 className="text-sm font-semibold text-zinc-900">Assumptions & Limitations</h2>
        <ul className="mt-3 space-y-2 text-sm text-zinc-700">
          <li>• Study area is locked to Kuala Lumpur to maintain city-scale analytical focus.</li>
          <li>• LST values represent daytime surface temperature averaged over 2022–2024.</li>
          <li>• Road proximity feature has near-zero importance — may require OSM integration for improvement.</li>
          <li>• Hotspot thresholds (36°C high, 33°C medium) are based on observed KL LST distribution.</li>
          <li>• Cooling interventions are rule-based — not ML predicted — and serve as planning suggestions only.</li>
          <li>• Model R² of 0.652 indicates moderate predictive power; NDVI is the dominant feature.</li>
          <li>• Spatial cross-validation shows R² drop of 0.158 — expected due to spatial autocorrelation in satellite data.</li>
        </ul>
      </div>
    </div>
  );
}