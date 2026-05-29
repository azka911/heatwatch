import type mapboxgl from "mapbox-gl";

/* ================================
   CONSTANT IDS
================================ */
export const TERRAIN_SOURCE_ID = "mapbox-dem";
export const HILLSHADE_LAYER_ID = "hillshade";
export const BUILDINGS_LAYER_ID = "3d-buildings";

/* ================================
   TERRAIN (DEM + HILLSHADE)
================================ */
export function enableTerrain(map: mapboxgl.Map, exaggeration = 1.4) {
  if (!map.getSource(TERRAIN_SOURCE_ID)) {
    map.addSource(TERRAIN_SOURCE_ID, {
      type: "raster-dem",
      url: "mapbox://mapbox.mapbox-terrain-dem-v1",
      tileSize: 512,
      maxzoom: 14,
    });
  }

  map.setTerrain({
    source: TERRAIN_SOURCE_ID,
    exaggeration,
  });

  if (!map.getLayer(HILLSHADE_LAYER_ID)) {
    map.addLayer(
      {
        id: HILLSHADE_LAYER_ID,
        type: "hillshade",
        source: TERRAIN_SOURCE_ID,
        paint: {
          "hillshade-exaggeration": 0.7,
          "hillshade-shadow-color": "#1f2937",
        },
      },
      findFirstSymbolLayer(map) // IMPORTANT
    );
  } else {
    map.setLayoutProperty(HILLSHADE_LAYER_ID, "visibility", "visible");
  }
}

export function disableTerrain(map: mapboxgl.Map) {
  map.setTerrain(null);
  if (map.getLayer(HILLSHADE_LAYER_ID)) {
    map.setLayoutProperty(HILLSHADE_LAYER_ID, "visibility", "none");
  }
}

/* ================================
   3D BUILDINGS (ALWAYS ON)
================================ */
export function enableBuildings(map: mapboxgl.Map) {
  // Ensure composite source exists
  if (!map.getSource("composite")) {
    console.warn("Mapbox composite source not found — buildings unavailable.");
    return;
  }

  // Avoid duplicate layer
  if (map.getLayer(BUILDINGS_LAYER_ID)) {
    map.setLayoutProperty(BUILDINGS_LAYER_ID, "visibility", "visible");
    return;
  }

  map.addLayer(
    {
      id: BUILDINGS_LAYER_ID,
      type: "fill-extrusion",
      source: "composite",
      "source-layer": "building",
      minzoom: 15,
      paint: {
        // Robust height handling across styles
        "fill-extrusion-height": [
          "coalesce",
          ["get", "height"],
          ["get", "render_height"],
          5,
        ],
        "fill-extrusion-base": [
          "coalesce",
          ["get", "min_height"],
          ["get", "render_min_height"],
          0,
        ],
        "fill-extrusion-color": "#94a3b8", // neutral slate
        "fill-extrusion-opacity": 0.75,
      },
    },
    findFirstSymbolLayer(map) // ⬅️ CRITICAL
  );
}

/* ================================
   CAMERA CONTROL
================================ */
export function set3DPitch(map: mapboxgl.Map, enabled: boolean) {
  map.easeTo({
    pitch: enabled ? 60 : 0,
    bearing: 0,
    duration: 800,
  });
}

/* ================================
   UTIL: FIND SAFE INSERT POINT
================================ */
function findFirstSymbolLayer(map: mapboxgl.Map): string | undefined {
  const layers = map.getStyle().layers;
  if (!layers) return undefined;

  for (const layer of layers) {
    if (layer.type === "symbol") {
      return layer.id;
    }
  }

  return undefined;
}
