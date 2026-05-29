"use client";

import "mapbox-gl/dist/mapbox-gl.css";

import React, { useEffect, useMemo, useRef, useState } from "react";
import type mapboxgl from "mapbox-gl";
import cityBoundary from "../../data/city-boundary.json";
import {
  disableTerrain,
  enableBuildings,
  enableTerrain,
  set3DPitch,
  BUILDINGS_LAYER_ID,
  HILLSHADE_LAYER_ID,
} from "./map3d";

type Basemap = "light" | "satellite";

type MapViewProps = {
  basemap: Basemap;
  showTerrain: boolean;
  showBuildings: boolean;
  showHotspots: boolean;
  showHeatmap: boolean;
  showMediumRisk: boolean;
  showLowRisk: boolean;
  mode: "observed" | "predicted";
};

const INITIAL_CENTER: [number, number] = [101.69, 3.12];
const INITIAL_ZOOM = 11;

const KL_BOUNDS: mapboxgl.LngLatBoundsLike = [
  [101.5, 2.9],
  [101.9, 3.3],
];

const MAP_STYLE_LIGHT = "mapbox://styles/mapbox/light-v11";
const MAP_STYLE_SAT = "mapbox://styles/mapbox/satellite-streets-v12";

const HOTSPOT_SOURCE_ID = "hotspots";
const HOTSPOT_LAYER_ID = "hotspots-layer";

const MEDIUM_SOURCE_ID = "medium-risk";
const MEDIUM_LAYER_ID = "medium-risk-layer";

const LOW_SOURCE_ID = "low-risk";
const LOW_LAYER_ID = "low-risk-layer";

const BOUNDARY_SOURCE_ID = "city-boundary";
const BOUNDARY_LINE_ID = "city-boundary-line";
const BOUNDARY_FILL_ID = "city-boundary-fill";

const GRID_SOURCE_ID = "lst-grid";
const GRID_FILL_LAYER_ID = "lst-grid-fill";
const GRID_LINE_LAYER_ID = "lst-grid-line";

const API = process.env.NEXT_PUBLIC_API_URL;

function waitForIdle(map: mapboxgl.Map): Promise<void> {
  return new Promise((resolve) => {
    if (!map.isMoving() && !map.isRotating() && !map.isZooming()) {
      resolve();
    } else {
      map.once("idle", () => resolve());
    }
  });
}

export default function MapView({
  basemap,
  showTerrain,
  showBuildings,
  showHotspots,
  showHeatmap,
  showMediumRisk,
  showLowRisk,
  mode,
}: MapViewProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const popupRef = useRef<mapboxgl.Popup | null>(null);
  const mapboxRef = useRef<any>(null);
  const mountedRef = useRef(false);
  const [isReady, setIsReady] = useState(false);
  const layersLoadedRef = useRef(false);

  const tokenMissing = useMemo(() => {
    const t = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
    return !t || t.trim().length === 0;
  }, []);

  // Init once
  useEffect(() => {
    if (tokenMissing) return;
    if (!containerRef.current) return;
    if (mapRef.current) return;

    let cancelled = false;

    (async () => {
      const mod = await import("mapbox-gl");
      const mapbox = (mod as any).default ?? (mod as any);

      (mapbox as any).accessToken =
        process.env.NEXT_PUBLIC_MAPBOX_TOKEN as string;
      mapboxRef.current = mapbox;

      const map = new mapbox.Map({
        container: containerRef.current!,
        style: basemap === "light" ? MAP_STYLE_LIGHT : MAP_STYLE_SAT,
        center: INITIAL_CENTER,
        zoom: INITIAL_ZOOM,
        pitch: 45,
        bearing: -10,
        minZoom: 10,
        maxZoom: 18,
        maxBounds: KL_BOUNDS,
        attributionControl: true,
        cooperativeGestures: true,
      });

      mapRef.current = map;
      map.dragRotate.disable();
      map.touchZoomRotate.disableRotation();
      map.addControl(
        new mapbox.NavigationControl({ showCompass: false }),
        "top-right"
      );

      map.on("load", async () => {
        if (cancelled) return;

        addCityBoundary(map);
        if (showTerrain) enableTerrain(map, 1.4);
        else disableTerrain(map);
        enableBuildings(map);
        set3DPitch(map, true);

        await waitForIdle(map);
        if (cancelled) return;

        await new Promise((resolve) => setTimeout(resolve, 1200));
        if (cancelled) return;

        await fetchAndAddGrid(map);
        await fetchAndAddHotspots(map, popupRef, mapbox, mode);
        await fetchAndAddMediumRisk(map, mapbox, mode);
        await fetchAndAddLowRisk(map, mapbox, mode);

        layersLoadedRef.current = true;

        applyLayerVisibility(
          map, showTerrain, showBuildings,
          showHotspots, showHeatmap, showMediumRisk, showLowRisk
        );

        await new Promise((resolve) => setTimeout(resolve, 100));
        setIsReady(true);
      });
    })();

    return () => {
      cancelled = true;
      popupRef.current?.remove();
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
        mapboxRef.current = null;
        layersLoadedRef.current = false;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tokenMissing]);

  // Basemap changes
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !isReady) return;

    if (!mountedRef.current) {
      mountedRef.current = true;
      return;
    }

    layersLoadedRef.current = false;
    popupRef.current?.remove();
    map.setStyle(basemap === "light" ? MAP_STYLE_LIGHT : MAP_STYLE_SAT);

    map.once("style.load", async () => {
      addCityBoundary(map);
      if (showTerrain) enableTerrain(map, 1.4);
      else disableTerrain(map);
      enableBuildings(map);
      set3DPitch(map, true);

      await waitForIdle(map);

      const mapbox = mapboxRef.current;
      await fetchAndAddGrid(map);
      if (mapbox) {
        await fetchAndAddHotspots(map, popupRef, mapbox, mode);
        await fetchAndAddMediumRisk(map, mapbox, mode);
        await fetchAndAddLowRisk(map, mapbox, mode);
      }

      layersLoadedRef.current = true;

      applyLayerVisibility(
        map, showTerrain, showBuildings,
        showHotspots, showHeatmap, showMediumRisk, showLowRisk
      );
    });
  }, [basemap, isReady]);

  // Toggle visibility
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !isReady) return;
    if (!layersLoadedRef.current) return;

    if (showTerrain) enableTerrain(map, 1.4);
    else disableTerrain(map);

    const reloadIfNeeded = async () => {
      const mapbox = mapboxRef.current;

      if (showHeatmap && !map.getLayer(GRID_FILL_LAYER_ID)) {
        await fetchAndAddGrid(map);
      }
      if (showHotspots && !map.getLayer(HOTSPOT_LAYER_ID)) {
        if (mapbox) await fetchAndAddHotspots(map, popupRef, mapbox, mode);
      }
      if (showMediumRisk && !map.getLayer(MEDIUM_LAYER_ID)) {
        if (mapbox) await fetchAndAddMediumRisk(map, mapbox, mode);
      }
      if (showLowRisk && !map.getLayer(LOW_LAYER_ID)) {
        if (mapbox) await fetchAndAddLowRisk(map, mapbox, mode);
      }

      applyLayerVisibility(
        map, showTerrain, showBuildings,
        showHotspots, showHeatmap, showMediumRisk, showLowRisk
      );
      set3DPitch(map, true);
    };

    reloadIfNeeded();
  }, [showTerrain, showBuildings, showHotspots, showHeatmap,
      showMediumRisk, showLowRisk, isReady]);

  // Mode change
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !isReady) return;
    if (!layersLoadedRef.current) return;

    const mapbox = mapboxRef.current;
    if (!mapbox) return;

    async function reloadForMode() {
      // Remove all risk layers
      if (map!.getLayer(HOTSPOT_LAYER_ID)) map!.removeLayer(HOTSPOT_LAYER_ID);
      if (map!.getSource(HOTSPOT_SOURCE_ID)) map!.removeSource(HOTSPOT_SOURCE_ID);
      if (map!.getLayer(MEDIUM_LAYER_ID)) map!.removeLayer(MEDIUM_LAYER_ID);
      if (map!.getSource(MEDIUM_SOURCE_ID)) map!.removeSource(MEDIUM_SOURCE_ID);
      if (map!.getLayer(LOW_LAYER_ID)) map!.removeLayer(LOW_LAYER_ID);
      if (map!.getSource(LOW_SOURCE_ID)) map!.removeSource(LOW_SOURCE_ID);

      // Reload with new mode — each called ONCE
      await fetchAndAddHotspots(map!, popupRef, mapbox, mode);
      await fetchAndAddMediumRisk(map!, mapbox, mode);
      await fetchAndAddLowRisk(map!, mapbox, mode);

      applyLayerVisibility(
        map!,
        showTerrain,
        showBuildings,
        showHotspots,
        showHeatmap,
        showMediumRisk,
        showLowRisk
      );
    }

    reloadForMode();
  }, [mode, isReady]);

  if (tokenMissing) {
    return (
      <div className="h-full w-full rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
        <div className="font-semibold">Mapbox token missing</div>
        <div className="mt-2">
          Add <span className="font-mono">NEXT_PUBLIC_MAPBOX_TOKEN</span> to{" "}
          <span className="font-mono">.env.local</span>, then restart the dev server.
        </div>
      </div>
    );
  }

  return (
    <div className="relative h-full w-full">
      <div ref={containerRef} className="h-full w-full" />
    </div>
  );
}

// --- Grid ---
async function fetchAndAddGrid(map: mapboxgl.Map, retries = 3) {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const res = await fetch(`${API}/features/grid`);
      if (!res.ok) throw new Error(`API error: ${res.status}`);
      const geojson = await res.json();

      if (!geojson.features || geojson.features.length === 0) {
        throw new Error("Empty grid data");
      }

      if (map.getSource(GRID_SOURCE_ID)) {
        (map.getSource(GRID_SOURCE_ID) as mapboxgl.GeoJSONSource).setData(geojson);
      } else {
        map.addSource(GRID_SOURCE_ID, { type: "geojson", data: geojson });
      }

      if (!map.getLayer(GRID_FILL_LAYER_ID)) {
        map.addLayer({
          id: GRID_FILL_LAYER_ID,
          type: "fill",
          source: GRID_SOURCE_ID,
          paint: {
            "fill-color": [
              "interpolate", ["linear"], ["get", "lst"],
              23, "#313695",
              26, "#4575b4",
              28, "#74add1",
              30, "#abd9e9",
              32, "#e0f3f8",
              33, "#ffffbf",
              34, "#fee090",
              35, "#fdae61",
              36, "#f46d43",
              37, "#d73027",
              39, "#a50026",
            ],
            "fill-opacity": [
              "interpolate", ["linear"], ["zoom"],
              10, 0.75, 12, 0.70, 13, 0.60, 14, 0.35, 15, 0.1, 16, 0,
            ],
          },
        });
      }

      if (!map.getLayer(GRID_LINE_LAYER_ID)) {
        map.addLayer({
          id: GRID_LINE_LAYER_ID,
          type: "line",
          source: GRID_SOURCE_ID,
          paint: {
            "line-color": "rgba(0, 0, 0, 0.08)",
            "line-width": 0.3,
            "line-opacity": [
              "interpolate", ["linear"], ["zoom"],
              10, 0.4, 14, 0.2, 15, 0,
            ],
          },
        });
      }

      map.triggerRepaint();
      return;
    } catch (err) {
      console.warn(`Grid attempt ${attempt} failed:`, err);
      if (attempt < retries) {
        await new Promise((resolve) => setTimeout(resolve, 1000 * attempt));
      } else {
        console.error("Grid failed after all retries");
      }
    }
  }
}

// --- High Risk Hotspots ---
async function fetchAndAddHotspots(
  map: mapboxgl.Map,
  popupRef: React.MutableRefObject<mapboxgl.Popup | null>,
  mapbox: any,
  mode: string = "observed"
) {
  try {
    // Observed → real MODIS top 50 high LST
    // Predicted → RF model top 50 high predicted LST
    const endpoint = mode === "predicted"
      ? `${API}/hotspots/by-risk/high`
      : `${API}/hotspots/observed/high`; 

    const res = await fetch(endpoint);
    if (!res.ok) throw new Error(`API error: ${res.status}`);
    const geojson = await res.json();

    if (!map.getSource(HOTSPOT_SOURCE_ID)) {
      map.addSource(HOTSPOT_SOURCE_ID, { type: "geojson", data: geojson });
    } else {
      (map.getSource(HOTSPOT_SOURCE_ID) as mapboxgl.GeoJSONSource).setData(geojson);
    }

    if (!map.getLayer(HOTSPOT_LAYER_ID)) {
      map.addLayer({
        id: HOTSPOT_LAYER_ID,
        type: "circle",
        source: HOTSPOT_SOURCE_ID,
        paint: {
          "circle-color": [
            "match", ["get", "risk"],
            "low", "#22c55e",
            "medium", "#f59e0b",
            "high", "#ef4444",
            "#3b82f6",
          ],
          "circle-radius": [
            "interpolate", ["linear"], ["get", "severity"],
            1, 6, 2, 10, 3, 14,
          ],
          "circle-opacity": 0.85,
          "circle-stroke-color": "#0b1220",
          "circle-stroke-width": 1,
        },
      });

      map.on("click", HOTSPOT_LAYER_ID, (e) => {
        const feature = e.features?.[0];
        if (!feature || !e.lngLat) return;
        const props = feature.properties as any;
        const riskLabel = String(props?.risk ?? "high").toUpperCase();
        popupRef.current?.remove();
        popupRef.current = new mapbox.Popup({ closeButton: true, closeOnClick: true })
          .setLngLat(e.lngLat)
          .setHTML(buildPopupHtml(props, riskLabel))
          .addTo(map);
      });

      map.on("mouseenter", HOTSPOT_LAYER_ID, () => {
        map.getCanvas().style.cursor = "pointer";
      });
      map.on("mouseleave", HOTSPOT_LAYER_ID, () => {
        map.getCanvas().style.cursor = "";
      });
    }
  } catch (err) {
    console.warn("Could not fetch hotspots from API:", err);
  }
}

// --- Medium Risk ---
async function fetchAndAddMediumRisk(
  map: mapboxgl.Map,
  mapbox: any,
  mode: string = "observed"
) {
  try {
    const endpoint = mode === "predicted"
      ? `${API}/hotspots/by-risk/medium`
      : `${API}/hotspots/observed/medium`; // same for now — both use predictions

    const res = await fetch(endpoint);
    if (!res.ok) throw new Error(`API error: ${res.status}`);
    const geojson = await res.json();

    if (!map.getSource(MEDIUM_SOURCE_ID)) {
      map.addSource(MEDIUM_SOURCE_ID, { type: "geojson", data: geojson });
    } else {
      (map.getSource(MEDIUM_SOURCE_ID) as mapboxgl.GeoJSONSource).setData(geojson);
    }

    if (!map.getLayer(MEDIUM_LAYER_ID)) {
      map.addLayer({
        id: MEDIUM_LAYER_ID,
        type: "circle",
        source: MEDIUM_SOURCE_ID,
        paint: {
          "circle-color": "#f59e0b",
          "circle-radius": [
            "interpolate", ["linear"], ["get", "severity"],
            1, 5, 2, 8, 3, 11,
          ],
          "circle-opacity": 0.75,
          "circle-stroke-color": "#0b1220",
          "circle-stroke-width": 0.8,
        },
      });

      map.on("click", MEDIUM_LAYER_ID, (e) => {
        const feature = e.features?.[0];
        if (!feature || !e.lngLat) return;
        const props = feature.properties as any;
        new mapbox.Popup({ closeButton: true, closeOnClick: true })
          .setLngLat(e.lngLat)
          .setHTML(buildPopupHtml(props, "MEDIUM"))
          .addTo(map);
      });

      map.on("mouseenter", MEDIUM_LAYER_ID, () => {
        map.getCanvas().style.cursor = "pointer";
      });
      map.on("mouseleave", MEDIUM_LAYER_ID, () => {
        map.getCanvas().style.cursor = "";
      });
    }
  } catch (err) {
    console.warn("Medium risk load failed:", err);
  }
}

// --- Low Risk / Cooling Zones ---
async function fetchAndAddLowRisk(
  map: mapboxgl.Map,
  mapbox: any,
  mode: string = "observed"
) {
  try {
    const endpoint = mode === "predicted"
      ? `${API}/hotspots/by-risk/low`
      : `${API}/hotspots/observed/low`; // same for now

    const res = await fetch(endpoint);
    if (!res.ok) throw new Error(`API error: ${res.status}`);
    const geojson = await res.json();

    if (!map.getSource(LOW_SOURCE_ID)) {
      map.addSource(LOW_SOURCE_ID, { type: "geojson", data: geojson });
    } else {
      (map.getSource(LOW_SOURCE_ID) as mapboxgl.GeoJSONSource).setData(geojson);
    }

    if (!map.getLayer(LOW_LAYER_ID)) {
      map.addLayer({
        id: LOW_LAYER_ID,
        type: "circle",
        source: LOW_SOURCE_ID,
        paint: {
          "circle-color": "#22c55e",
          "circle-radius": [
            "interpolate", ["linear"], ["get", "severity"],
            1, 4, 2, 6, 3, 8,
          ],
          "circle-opacity": 0.7,
          "circle-stroke-color": "#0b1220",
          "circle-stroke-width": 0.8,
        },
      });

      map.on("click", LOW_LAYER_ID, (e) => {
        const feature = e.features?.[0];
        if (!feature || !e.lngLat) return;
        const props = feature.properties as any;
        new mapbox.Popup({ closeButton: true, closeOnClick: true })
          .setLngLat(e.lngLat)
          .setHTML(buildPopupHtml(props, "LOW"))
          .addTo(map);
      });

      map.on("mouseenter", LOW_LAYER_ID, () => {
        map.getCanvas().style.cursor = "pointer";
      });
      map.on("mouseleave", LOW_LAYER_ID, () => {
        map.getCanvas().style.cursor = "";
      });
    }
  } catch (err) {
    console.warn("Low risk load failed:", err);
  }
}

// --- City Boundary ---
function addCityBoundary(map: mapboxgl.Map) {
  if (!map.getSource(BOUNDARY_SOURCE_ID)) {
    map.addSource(BOUNDARY_SOURCE_ID, {
      type: "geojson",
      data: cityBoundary as GeoJSON.FeatureCollection,
    });
  }

  if (!map.getLayer(BOUNDARY_FILL_ID)) {
    map.addLayer({
      id: BOUNDARY_FILL_ID,
      type: "fill",
      source: BOUNDARY_SOURCE_ID,
      paint: { "fill-color": "#0f172a", "fill-opacity": 0.05 },
    });
  }

  if (!map.getLayer(BOUNDARY_LINE_ID)) {
    map.addLayer({
      id: BOUNDARY_LINE_ID,
      type: "line",
      source: BOUNDARY_SOURCE_ID,
      paint: {
        "line-color": "#0f172a",
        "line-width": 2,
        "line-opacity": 0.35,
      },
    });
  }
}

// --- Visibility ---
function applyLayerVisibility(
  map: mapboxgl.Map,
  terrain: boolean,
  buildings: boolean,
  hotspotsVisible: boolean,
  heatmapVisible: boolean,
  mediumVisible: boolean,
  lowVisible: boolean
) {
  if (map.getLayer(HILLSHADE_LAYER_ID)) {
    map.setLayoutProperty(HILLSHADE_LAYER_ID, "visibility",
      terrain ? "visible" : "none");
  }
  if (map.getLayer(BUILDINGS_LAYER_ID)) {
    map.setLayoutProperty(BUILDINGS_LAYER_ID, "visibility",
      buildings ? "visible" : "none");
  }
  if (map.getLayer(HOTSPOT_LAYER_ID)) {
    map.setLayoutProperty(HOTSPOT_LAYER_ID, "visibility",
      hotspotsVisible ? "visible" : "none");
  }
  if (map.getLayer(MEDIUM_LAYER_ID)) {
    map.setLayoutProperty(MEDIUM_LAYER_ID, "visibility",
      mediumVisible ? "visible" : "none");
  }
  if (map.getLayer(LOW_LAYER_ID)) {
    map.setLayoutProperty(LOW_LAYER_ID, "visibility",
      lowVisible ? "visible" : "none");
  }
  if (map.getLayer(GRID_FILL_LAYER_ID)) {
    map.setLayoutProperty(GRID_FILL_LAYER_ID, "visibility",
      heatmapVisible ? "visible" : "none");
  }
  if (map.getLayer(GRID_LINE_LAYER_ID)) {
    map.setLayoutProperty(GRID_LINE_LAYER_ID, "visibility",
      heatmapVisible ? "visible" : "none");
  }
}

// --- Shared Popup Builder ---
function buildPopupHtml(props: any, riskLabel: string): string {
  const name = escapeHtml(String(props?.name ?? "Zone"));
  const lst = props?.lst_c != null ? Number(props.lst_c) : null;
  const ndvi = props?.ndvi != null ? Number(props.ndvi) : null;
  const intervention = escapeHtml(String(props?.intervention_type ?? "—"));
  const rationale = escapeHtml(String(props?.intervention_rationale ?? "—"));

  const cityAvgLst = 33.4;
  const uhiContribution = lst != null ? (lst - cityAvgLst).toFixed(1) : null;
  const uhiSign = uhiContribution && Number(uhiContribution) > 0 ? "+" : "";

  const riskColor = riskLabel === "HIGH"
    ? "#ef4444"
    : riskLabel === "MEDIUM"
    ? "#f59e0b"
    : "#22c55e";

  const ndviLabel = ndvi == null ? "—"
    : ndvi < 0.15 ? "Critically sparse"
    : ndvi < 0.2 ? "Very sparse vegetation"
    : ndvi < 0.3 ? "Low vegetation"
    : ndvi < 0.4 ? "Moderate vegetation"
    : ndvi < 0.6 ? "Good vegetation"
    : "Dense vegetation";

  const lstLabel = lst == null ? "—"
    : lst >= 38 ? "Extreme heat"
    : lst >= 36 ? "High heat"
    : lst >= 33 ? "Moderate heat"
    : "Cool zone";

  const interventionColor =
    intervention.includes("Tree") || intervention.includes("Forest") || intervention.includes("Green")
      ? "#16a34a"
      : intervention.includes("Roof") || intervention.includes("Pavement") || intervention.includes("Cool")
      ? "#2563eb"
      : intervention.includes("Shaded") || intervention.includes("Walkway")
      ? "#d97706"
      : intervention.includes("Water")
      ? "#0891b2"
      : "#6b7280";

  return `
    <div style="font-family:ui-sans-serif,system-ui;font-size:12px;line-height:1.6;max-width:260px;">
      <div style="margin-bottom:8px;">
        <div style="font-weight:700;font-size:13px;color:#111827;">${name}</div>
        <div style="display:flex;align-items:center;gap:6px;margin-top:3px;">
          <span style="background:${riskColor}20;color:${riskColor};font-weight:600;
            font-size:10px;padding:1px 6px;border-radius:99px;border:1px solid ${riskColor}40;">
            ${riskLabel} RISK
          </span>
          <span style="color:#6b7280;font-size:10px;">${lstLabel}</span>
        </div>
      </div>

      <div style="border-top:1px solid #f3f4f6;padding-top:8px;margin-bottom:8px;">
        <div style="display:flex;justify-content:space-between;margin-bottom:4px;">
          <span style="color:#6b7280;">Surface Temp</span>
          <span style="font-weight:600;color:#111827;">
            ${lst != null ? lst.toFixed(1) + "°C" : "—"}
            ${uhiContribution != null
              ? `<span style="color:${Number(uhiContribution) > 0 ? "#ef4444" : "#22c55e"};font-size:10px;">
                  (${uhiSign}${uhiContribution}°C vs avg)
                </span>`
              : ""}
          </span>
        </div>

        <div style="display:flex;justify-content:space-between;margin-bottom:4px;">
          <span style="color:#6b7280;">Vegetation</span>
          <span style="font-weight:600;color:#111827;">
            ${ndvi != null ? ndvi.toFixed(3) : "—"}
            <span style="color:#6b7280;font-size:10px;font-weight:400;">
              (${ndviLabel})
            </span>
          </span>
        </div>

        ${ndvi != null ? `
        <div style="margin:4px 0 8px;">
          <div style="background:#f3f4f6;border-radius:99px;height:4px;overflow:hidden;">
            <div style="background:${ndvi < 0.2 ? "#ef4444" : ndvi < 0.4 ? "#f59e0b" : "#22c55e"};
              height:4px;width:${Math.min(ndvi * 100, 100)}%;border-radius:99px;">
            </div>
          </div>
        </div>` : ""}
      </div>

      <div style="background:#f9fafb;border-radius:8px;padding:8px;border:1px solid #f3f4f6;">
        <div style="font-size:10px;color:#6b7280;font-weight:600;
          text-transform:uppercase;letter-spacing:0.05em;margin-bottom:4px;">
          Recommended Intervention
        </div>
        <div style="font-weight:600;color:${interventionColor};margin-bottom:3px;">
          ${intervention}
        </div>
        <div style="color:#6b7280;font-size:11px;line-height:1.4;">
          ${rationale}
        </div>
      </div>
    </div>
  `;
}

function escapeHtml(str: string) {
  return str.replace(/[&<>"']/g, (m) => {
    switch (m) {
      case "&": return "&amp;";
      case "<": return "&lt;";
      case ">": return "&gt;";
      case '"': return "&quot;";
      case "'": return "&#039;";
      default: return m;
    }
  });
}