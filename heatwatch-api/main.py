from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from database import supabase
from functools import lru_cache
import time
import joblib
import numpy as np
import pandas as pd
import os

app = FastAPI(title="HeatWatch API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "https://heatwatch-chi.vercel.app",
    ],
    allow_origin_regex=r"https://heatwatch-.*\.vercel\.app",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Simple cache
_cache = {}
# Cache TTL: 1 hour — data is static MODIS satellite processed data
# that does not change between sessions. Cache improves response time
# from ~5s to <100ms for all paginated endpoints.
_cache_ttl = 3600

def get_cached(key):
    if key in _cache:
        data, timestamp = _cache[key]
        if time.time() - timestamp < _cache_ttl:
            return data
    return None

def set_cached(key, data):
    _cache[key] = (data, time.time())
    
    
# Load model safely
try:
    model = joblib.load('models/rf_model.pkl')
    print("Model loaded successfully")
except FileNotFoundError:
    print("WARNING: rf_model.pkl not found — /predictions/run will not work")
    model = None
except Exception as e:
    print(f"WARNING: Could not load model: {e}")
    model = None

@app.on_event("startup")
async def preload_cache():
    print("Preloading cache on startup...")
    try:
        get_features_grid()
        print("✓ features/grid cached")
    except Exception as e:
        print(f"✗ features/grid preload failed: {e}")
    try:
        get_all_hotspots()
        print("✓ hotspots/all cached")
    except Exception as e:
        print(f"✗ hotspots/all preload failed: {e}")
    print("Cache preload complete.")

@app.get("/")
def root():
    return {
        "message": "HeatWatch API running",
        "model_loaded": model is not None
    }

@app.get("/summary")
def get_summary():
    try:
        stats = supabase.table("summary_stats")\
            .select("avg_lst, avg_ndvi, resolution")\
            .eq("city", "Kuala Lumpur")\
            .limit(1)\
            .execute().data

        avg_lst = stats[0]["avg_lst"] if stats else 33.4
        avg_ndvi = stats[0]["avg_ndvi"] if stats else 0.41
        resolution = stats[0]["resolution"] if stats else "1km"

        all_preds = supabase.table("predictions")\
            .select("hotspot_level")\
            .execute().data

        if not all_preds:
            hotspot_count = 5
            high_risk = 2
        else:
            hotspot_count = len([p for p in all_preds
                                 if p["hotspot_level"] in ["high", "medium"]])
            high_risk = len([p for p in all_preds
                             if p["hotspot_level"] == "high"])

        return {
            "avg_lst": round(float(avg_lst), 1),
            "avg_ndvi": round(float(avg_ndvi), 2),
            "hotspot_count": hotspot_count,
            "high_risk_count": high_risk,
            "study_area": "KL",
            "resolution": "1km"
        }

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Summary fetch failed: {str(e)}"
        )

@app.get("/summary/observed")
def get_observed_summary():
    cached = get_cached("summary_observed")
    if cached:
        return cached

    try:
        all_features = []
        page = 0
        page_size = 500

        while True:
            batch = supabase.table("features")\
                .select("lst, ndvi_mean, landcover_class")\
                .range(page * page_size, (page + 1) * page_size - 1)\
                .execute().data
            if not batch:
                break
            all_features.extend(batch)
            page += 1
            if len(batch) < page_size:
                break

        lsts = [f["lst"] for f in all_features if f.get("lst") is not None]
        ndvis = [f["ndvi_mean"] for f in all_features if f.get("ndvi_mean") is not None]
        high_risk = len([f for f in all_features if f.get("lst", 0) >= 36])
        medium_risk = len([f for f in all_features if 33 <= f.get("lst", 0) < 36])

        result = {
            "avg_lst": round(float(np.mean(lsts)), 1) if lsts else 0,
            "avg_ndvi": round(float(np.mean(ndvis)), 2) if ndvis else 0,
            "hotspot_count": high_risk + medium_risk,
            "high_risk_count": high_risk,
            "study_area": "KL",
            "resolution": "1km"
        }

        set_cached("summary_observed", result)
        return result

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/summary/predicted")
def get_predicted_summary():
    cached = get_cached("summary_predicted")
    if cached:
        return cached

    try:
        all_preds = []
        page = 0
        page_size = 500

        while True:
            batch = supabase.table("predictions")\
                .select("prediction_lst, hotspot_level")\
                .range(page * page_size, (page + 1) * page_size - 1)\
                .execute().data
            if not batch:
                break
            all_preds.extend(batch)
            page += 1
            if len(batch) < page_size:
                break

        all_features = []
        page = 0
        while True:
            batch = supabase.table("features")\
                .select("ndvi_mean")\
                .range(page * page_size, (page + 1) * page_size - 1)\
                .execute().data
            if not batch:
                break
            all_features.extend(batch)
            page += 1
            if len(batch) < page_size:
                break

        lsts = [p["prediction_lst"] for p in all_preds if p.get("prediction_lst") is not None]
        ndvis = [f["ndvi_mean"] for f in all_features if f.get("ndvi_mean") is not None]
        high_risk = len([p for p in all_preds if p.get("hotspot_level") == "high"])
        medium_risk = len([p for p in all_preds if p.get("hotspot_level") == "medium"])

        result = {
            "avg_lst": round(float(np.mean(lsts)), 1) if lsts else 0,
            "avg_ndvi": round(float(np.mean(ndvis)), 2) if ndvis else 0,
            "hotspot_count": high_risk + medium_risk,
            "high_risk_count": high_risk,
            "study_area": "KL",
            "resolution": "1km"
        }

        set_cached("summary_predicted", result)
        return result

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/hotspots")
def get_hotspots():
    try:
        data = supabase.table("hotspots").select("*").execute().data
        if not data:
            return {"hotspots": []}
        return {"hotspots": data}
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Hotspots fetch failed: {str(e)}"
        )

@app.get("/hotspots/observed")
def get_observed_hotspots():
    try:
        all_features = []
        page = 0
        page_size = 500

        while True:
            batch = supabase.table("features")\
                .select("*, zones(zone_name, lat, lng)")\
                .range(page * page_size, (page + 1) * page_size - 1)\
                .execute().data

            if not batch:
                break

            all_features.extend(batch)
            page += 1

            if len(batch) < page_size:
                break

        if not all_features:
            return {"type": "FeatureCollection", "features": []}

        # Classify all zones
        high = sorted(
            [f for f in all_features if f.get("lst", 0) >= 36],
            key=lambda x: x.get("lst", 0), reverse=True
        )[:20]

        medium = sorted(
            [f for f in all_features if 33 <= f.get("lst", 0) < 36],
            key=lambda x: x.get("lst", 0), reverse=True
        )[:20]

        low = sorted(
            [f for f in all_features if f.get("lst", 0) < 33],
            key=lambda x: x.get("lst", 0), reverse=True
        )[:10]

        selected = high + medium + low

        features = []
        for i, row in enumerate(selected):
            zone = row.get("zones", {})
            lat = zone.get("lat")
            lng = zone.get("lng")

            if lat is None or lng is None:
                continue

            lst = row.get("lst", 0)
            ndvi = row.get("ndvi_mean", 0)

            if lst >= 36:
                risk = "high"
                severity = 3
            elif lst >= 33:
                risk = "medium"
                severity = 2
            else:
                risk = "low"
                severity = 1

            intervention = get_intervention(
                risk, ndvi, row.get("landcover_class", 50)
            )

            features.append({
                "type": "Feature",
                "geometry": {
                    "type": "Point",
                    "coordinates": [lng, lat]
                },
                "properties": {
                    "name": zone.get("zone_name", f"Observed Zone {i+1}"),
                    "risk": risk,
                    "severity": severity,
                    "lst_c": round(float(lst), 1),
                    "ndvi": round(float(ndvi), 3) if ndvi else None,
                    "intervention_type": intervention["type"],
                    "intervention_rationale": intervention["rationale"]
                }
            })

        return {"type": "FeatureCollection", "features": features}

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Observed hotspots failed: {str(e)}"
        )

@app.get("/hotspots/geojson")
def get_hotspots_geojson():
    try:
        data = supabase.table("predictions")\
            .select("*, zones(zone_name, lat, lng), interventions(*)")\
            .eq("hotspot_level", "high")\
            .order("prediction_lst", desc=True)\
            .limit(50)\
            .execute().data

        if not data:
            fallback = supabase.table("hotspots").select("*").execute().data
            features = []
            for row in fallback:
                if row.get("lng") is None or row.get("lat") is None:
                    continue
                features.append({
                    "type": "Feature",
                    "geometry": {
                        "type": "Point",
                        "coordinates": [row["lng"], row["lat"]]
                    },
                    "properties": {
                        "name": row["name"],
                        "risk": row["risk"],
                        "severity": row["severity"],
                        "lst_c": row["lst_c"],
                        "ndvi": row["ndvi"],
                        "intervention_type": row.get("intervention_type"),
                        "intervention_rationale": row.get("intervention_rationale")
                    }
                })
            return {"type": "FeatureCollection", "features": features}

        # Get zone_ids to fetch NDVI from features table
        zone_ids = [row["zone_id"] for row in data if row.get("zone_id")]

        # Fetch NDVI for these zones
        ndvi_map = {}
        if zone_ids:
            ndvi_data = supabase.table("features")\
                .select("zone_id, ndvi_mean")\
                .in_("zone_id", zone_ids)\
                .execute().data
            ndvi_map = {f["zone_id"]: f["ndvi_mean"] for f in ndvi_data}

        features = []
        for i, row in enumerate(data):
            zone = row.get("zones", {})
            lat = zone.get("lat")
            lng = zone.get("lng")
            interventions = row.get("interventions", [])

            if lat is None or lng is None:
                continue

            lst = row["prediction_lst"]
            severity = 3 if lst >= 38 else (2 if lst >= 35 else 1)
            ndvi = ndvi_map.get(row.get("zone_id"))

            features.append({
                "type": "Feature",
                "geometry": {
                    "type": "Point",
                    "coordinates": [lng, lat]
                },
                "properties": {
                    "name": zone.get("zone_name", f"Hotspot {i+1}"),
                    "risk": row["hotspot_level"],
                    "severity": severity,
                    "lst_c": round(row["prediction_lst"], 1),
                    "ndvi": round(float(ndvi), 3) if ndvi is not None else None,
                    "intervention_type": interventions[0]["intervention_type"]
                        if interventions else "Monitor",
                    "intervention_rationale": interventions[0]["rationale"]
                        if interventions else ""
                }
            })

        return {"type": "FeatureCollection", "features": features}

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Hotspots GeoJSON failed: {str(e)}"
        )
@app.get("/model/stats")
async def get_model_stats():
    try:
        result = supabase.table('model_runs') \
            .select('*') \
            .order('created_at', desc=True) \
            .limit(1) \
            .execute()

        if not result.data:
            raise HTTPException(status_code=404, detail="No model runs found")

        row = result.data[0]

        return {
            # Identity
            "model_name":    row.get("model_name"),
            "model_version": row.get("model_version"),
            "created_at":    row.get("created_at"),

            # Baseline 80/20
            "mae":  row.get("mae"),
            "rmse": row.get("rmse"),
            "r2":   row.get("r2"),
            "mape": row.get("mape"),

            # 5-Fold CV
            "cv_folds":     row.get("cv_folds"),
            "cv_r2_mean":   row.get("cv_r2_mean"),
            "cv_r2_std":    row.get("cv_r2_std"),
            "cv_mae_mean":  row.get("cv_mae_mean"),
            "cv_mae_std":   row.get("cv_mae_std"),
            "cv_rmse_mean": row.get("cv_rmse_mean"),
            "cv_rmse_std":  row.get("cv_rmse_std"),

            # Spatial CV
            "spatial_r2_mean":    row.get("spatial_r2_mean"),
            "spatial_r2_std":     row.get("spatial_r2_std"),
            "spatial_mae_mean":   row.get("spatial_mae_mean"),
            "spatial_rmse_mean":  row.get("spatial_rmse_mean"),
            "spatial_r2_drop":    row.get("spatial_r2_drop"),
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/suhi")
def get_suhi():
    cached = get_cached("suhi")
    if cached:
        return cached

    try:
        all_data = []
        page = 0
        page_size = 500

        while True:
            batch = supabase.table("features")\
                .select("lst, landcover_class")\
                .range(page * page_size, (page + 1) * page_size - 1)\
                .execute().data
            if not batch:
                break
            all_data.extend(batch)
            page += 1
            if len(batch) < page_size:
                break

        if not all_data:
            return {
                "suhi": 0,
                "urban_lst": 0,
                "rural_lst": 0,
                "urban_zones": 0,
                "rural_zones": 0
            }

        urban = [f["lst"] for f in all_data
                 if f.get("landcover_class") == 50
                 and f.get("lst") is not None]

        rural = [f["lst"] for f in all_data
                 if f.get("landcover_class") in [10, 20, 40]
                 and f.get("lst") is not None]

        if not urban or not rural:
            return {
                "suhi": 0,
                "urban_lst": 0,
                "rural_lst": 0,
                "urban_zones": len(urban),
                "rural_zones": len(rural)
            }

        urban_lst = round(float(np.mean(urban)), 2)
        rural_lst = round(float(np.mean(rural)), 2)
        suhi = round(urban_lst - rural_lst, 2)

        result = {
            "suhi": suhi,
            "urban_lst": urban_lst,
            "rural_lst": rural_lst,
            "urban_zones": len(urban),
            "rural_zones": len(rural)
        }

        set_cached("suhi", result)
        return result

    except Exception as e:
        print(f"SUHI error: {e}")
        raise HTTPException(status_code=500, detail=str(e))
        
        

def get_intervention(level, ndvi, landcover):
    # Landcover classes
    is_builtup = landcover == 50
    is_forest = landcover == 10
    is_water = landcover == 80
    is_cropland = landcover in [40, 30]
    
    # High risk interventions
    if level == "high":
        if is_builtup and ndvi < 0.15:
            return {
                "type": "Cool Roof + Tree Planting",
                "priority": 1,
                "rationale": "Dense built-up zone with critically low vegetation. "
                            "Install reflective roofing materials and establish "
                            "street tree corridors to reduce surface absorption."
            }
        elif is_builtup and ndvi < 0.3:
            return {
                "type": "Rooftop Garden + Shaded Walkways",
                "priority": 1,
                "rationale": "Built-up area with moderate vegetation deficit. "
                            "Rooftop greening and shaded pedestrian infrastructure "
                            "can reduce ambient temperature by 2-4°C."
            }
        elif is_builtup and ndvi >= 0.3:
            return {
                "type": "Expand Green Corridors",
                "priority": 1,
                "rationale": "Built-up zone with existing vegetation showing heat stress. "
                            "Expand and connect green spaces to enhance cooling airflow."
            }
        elif is_forest:
            return {
                "type": "Forest Edge Protection",
                "priority": 1,
                "rationale": "Forest boundary zone experiencing elevated temperatures. "
                            "Restrict development at forest edges and add buffer planting."
            }
        elif is_cropland:
            return {
                "type": "Agroforestry + Windbreaks",
                "priority": 2,
                "rationale": "Agricultural zone with high heat exposure. "
                            "Introduce shade trees and windbreak vegetation "
                            "to reduce soil surface temperature."
            }
        else:
            return {
                "type": "Urgent Vegetation Cover",
                "priority": 1,
                "rationale": "High heat zone with low vegetation. "
                            "Immediate greening intervention required."
            }
    
    # Medium risk interventions
    elif level == "medium":
        if is_builtup and ndvi < 0.2:
            return {
                "type": "Street Trees + Cool Pavements",
                "priority": 2,
                "rationale": "Mixed urban zone with sparse vegetation. "
                            "Street tree planting and light-coloured pavement "
                            "materials can reduce LST by 1-3°C."
            }
        elif is_builtup:
            return {
                "type": "Shaded Pedestrian Corridors",
                "priority": 2,
                "rationale": "Urban zone with moderate heat stress. "
                            "Shading structures along pedestrian routes "
                            "improve thermal comfort without major infrastructure changes."
            }
        elif is_forest or ndvi > 0.5:
            return {
                "type": "Green Space Maintenance",
                "priority": 3,
                "rationale": "Vegetated zone showing moderate heat. "
                            "Maintain and protect existing green cover "
                            "to sustain cooling effect."
            }
        else:
            return {
                "type": "Mixed Greening Strategy",
                "priority": 2,
                "rationale": "Moderate heat zone. Combination of tree planting "
                            "and surface albedo improvement recommended."
            }
    
    # Low risk / cooling zones
    else:
        if is_water:
            return {
                "type": "Preserve Water Body",
                "priority": 3,
                "rationale": "Water body providing natural cooling through "
                            "evaporation. Protect from encroachment and "
                            "maintain water quality."
            }
        elif is_forest or ndvi > 0.6:
            return {
                "type": "Protect Forest Cover",
                "priority": 3,
                "rationale": "Dense vegetation acting as urban cooling corridor. "
                            "Enforce green buffer protection and prevent deforestation."
            }
        else:
            return {
                "type": "Green Buffer Maintenance",
                "priority": 3,
                "rationale": "Low risk zone contributing to urban cooling. "
                            "Maintain existing vegetation and monitor for "
                            "development encroachment."
            }

@app.post("/predictions/run")
def run_predictions():
    if model is None:
        raise HTTPException(
            status_code=503,
            detail="Model not loaded — run train_model.py first"
        )

    try:
        # Fetch all features with pagination
        all_features = []
        page = 0
        page_size = 500

        while True:
            batch = supabase.table("features")\
                .select("*")\
                .range(page * page_size, (page + 1) * page_size - 1)\
                .execute().data

            if not batch:
                break

            all_features.extend(batch)
            page += 1

            if len(batch) < page_size:
                break

        print(f"Total features fetched: {len(all_features)}")

        if not all_features:
            raise HTTPException(
                status_code=404,
                detail="No features found — run train_model.py first"
            )

        # Get latest model run
        run_data = supabase.table("model_runs")\
            .select("run_id")\
            .order("created_at", desc=True)\
            .limit(1)\
            .execute().data

        if not run_data:
            raise HTTPException(
                status_code=404,
                detail="No model run found in database"
            )

        run = run_data[0]
        print(f"Using run_id: {run['run_id']}")

        results = []
        skipped = 0
        errors = 0

        for f in all_features:
            try:
                # Skip rows with missing required features
                if any(f.get(col) is None for col in
                       ["ndvi_mean", "landcover_class", "month_index", "dist_to_cbd", "elevation"]):
                    skipped += 1
                    continue

                # Predict using DataFrame to avoid sklearn warning
                X = pd.DataFrame([[
                    f["ndvi_mean"],
                    f["landcover_class"],
                    f["month_index"],
                    f["dist_to_cbd"],
                    f["elevation"]
                ]], columns=['ndvi', 'landcover', 'month_index', 'dist_to_cbd', 'elevation'])

                lst_pred = float(model.predict(X)[0])

                if lst_pred >= 36:
                    level = "high"
                elif lst_pred >= 33:
                    level = "medium"
                else:
                    level = "low"

                pred = supabase.table("predictions").insert({
                    "run_id": run["run_id"],
                    "zone_id": f["zone_id"],
                    "prediction_lst": round(lst_pred, 2),
                    "hotspot_level": level
                }).execute().data[0]

                intervention = get_intervention(
                    level, f["ndvi_mean"], f["landcover_class"]
                )
                supabase.table("interventions").insert({
                    "prediction_id": pred["prediction_id"],
                    "intervention_type": intervention["type"],
                    "priority_rank": intervention["priority"],
                    "rationale": intervention["rationale"]
                }).execute()

                results.append(pred)

                if len(results) == 1:
                    print(f"First prediction OK: zone={f['zone_id']} "
                          f"lst={lst_pred:.2f} level={level}")

            except Exception as row_error:
                errors += 1
                if errors <= 3:
                    print(f"ERROR at zone {f.get('zone_id')}: "
                          f"{type(row_error).__name__}: {row_error}")
                continue

        print(f"Done — Results: {len(results)}, "
              f"Skipped: {skipped}, Errors: {errors}")

        return {
            "message": f"Predictions complete for {len(results)} zones",
            "high": len([r for r in results
                         if r["hotspot_level"] == "high"]),
            "medium": len([r for r in results
                           if r["hotspot_level"] == "medium"]),
            "low": len([r for r in results
                        if r["hotspot_level"] == "low"])
        }

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Prediction run failed: {str(e)}"
        )
        
        
@app.get("/features/geojson")
def get_features_geojson():
    try:
        all_features = []
        page = 0
        page_size = 500

        while True:
            batch = supabase.table("features")\
                .select("*, zones(lat, lng)")\
                .range(page * page_size, (page + 1) * page_size - 1)\
                .execute().data

            if not batch:
                break

            all_features.extend(batch)
            page += 1

            if len(batch) < page_size:
                break

        if not all_features:
            return {"type": "FeatureCollection", "features": []}

        features = []
        for row in all_features:
            zone = row.get("zones", {})
            lat = zone.get("lat")
            lng = zone.get("lng")

            if lat is None or lng is None:
                continue

            features.append({
                "type": "Feature",
                "geometry": {
                    "type": "Point",
                    "coordinates": [lng, lat]
                },
                "properties": {
                    "lst": row.get("lst"),
                    "ndvi": row.get("ndvi_mean"),
                    "landcover": row.get("landcover_class")
                }
            })

        return {"type": "FeatureCollection", "features": features}

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Features GeoJSON failed: {str(e)}"
        )

@app.get("/features/grid")
def get_features_grid():
    cached = get_cached("features_grid")
    if cached:
        return cached
    try:
        all_features = []
        page = 0
        page_size = 500

        while True:
            batch = supabase.table("features")\
                .select("*, zones(lat, lng)")\
                .range(page * page_size, (page + 1) * page_size - 1)\
                .execute().data

            if not batch:
                break

            all_features.extend(batch)
            page += 1

            if len(batch) < page_size:
                break

        if not all_features:
            return {"type": "FeatureCollection", "features": []}

        cell_size = 0.009

        features = []
        for row in all_features:
            zone = row.get("zones", {})
            lat = zone.get("lat")
            lng = zone.get("lng")
            lst = row.get("lst")

            if lat is None or lng is None or lst is None:
                continue

            half = cell_size / 2
            coordinates = [[
                [lng - half, lat - half],
                [lng + half, lat - half],
                [lng + half, lat + half],
                [lng - half, lat + half],
                [lng - half, lat - half],
            ]]

            features.append({
                "type": "Feature",
                "geometry": {
                    "type": "Polygon",
                    "coordinates": coordinates
                },
                "properties": {
                    "lst": round(float(lst), 2),
                    "ndvi": round(float(row.get("ndvi_mean", 0)), 3),
                    "landcover": row.get("landcover_class"),
                }
            })

        result = {"type": "FeatureCollection", "features": features}
        set_cached("features_grid", result)
        return result

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Grid fetch failed: {str(e)}"
        )

@app.get("/hotspots/predicted/geojson")
def get_predicted_hotspots_geojson():
    try:
        data = supabase.table("predictions")\
            .select("*, zones(zone_name, lat, lng), interventions(*)")\
            .eq("hotspot_level", "high")\
            .limit(100)\
            .execute().data

        if not data:
            return {"type": "FeatureCollection", "features": []}

        features = []
        for row in data:
            zone = row.get("zones", {})
            lat = zone.get("lat")
            lng = zone.get("lng")
            interventions = row.get("interventions", [])

            if lat is None or lng is None:
                continue

            features.append({
                "type": "Feature",
                "geometry": {
                    "type": "Point",
                    "coordinates": [lng, lat]
                },
                "properties": {
                    "name": zone.get("zone_name", "Predicted Hotspot"),
                    "risk": row["hotspot_level"],
                    "severity": 3,
                    "lst_c": row["prediction_lst"],
                    "ndvi": None,
                    "intervention_type": interventions[0]["intervention_type"]
                        if interventions else "Monitor",
                    "intervention_rationale": interventions[0]["rationale"]
                        if interventions else ""
                }
            })

        return {"type": "FeatureCollection", "features": features}

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Predicted hotspots failed: {str(e)}"
        )


@app.get("/hotspots/all")
def get_all_hotspots():
    cached = get_cached("hotspots_all")
    if cached:
        return cached

    try:
        all_predictions = []
        page = 0
        page_size = 500

        while True:
            batch = supabase.table("predictions")\
                .select("*, zones(zone_name, lat, lng), interventions(*)")\
                .range(page * page_size, (page + 1) * page_size - 1)\
                .execute().data

            if not batch:
                break

            all_predictions.extend(batch)
            page += 1

            if len(batch) < page_size:
                break

        if not all_predictions:
            result = {"hotspots": []}
            set_cached("hotspots_all", result)
            return result

        zone_ids = [p["zone_id"] for p in all_predictions if p.get("zone_id")]
        ndvi_map = {}

        for i in range(0, len(zone_ids), 100):
            batch_ids = zone_ids[i:i+100]
            try:
                ndvi_data = supabase.table("features")\
                    .select("zone_id, ndvi_mean")\
                    .in_("zone_id", batch_ids)\
                    .execute().data
                for f in ndvi_data:
                    ndvi_map[f["zone_id"]] = f["ndvi_mean"]
            except Exception as ndvi_err:
                print(f"NDVI batch {i} failed: {ndvi_err}")
                continue

        hotspots = []
        for i, pred in enumerate(all_predictions):
            zone = pred.get("zones") or {}
            interventions = pred.get("interventions") or []
            lst = pred["prediction_lst"]
            severity = 3 if lst >= 38 else (2 if lst >= 35 else 1)
            ndvi = ndvi_map.get(pred.get("zone_id"))

            hotspots.append({
                "id": str(pred["prediction_id"]),
                "name": zone.get("zone_name", f"Zone_{i+1}"),
                "risk": pred["hotspot_level"],
                "severity": severity,
                "lst_c": round(float(lst), 1),
                "ndvi": round(float(ndvi), 3) if ndvi is not None else None,
                "intervention_type": interventions[0]["intervention_type"]
                    if interventions else None,
                "intervention_rationale": interventions[0]["rationale"]
                    if interventions else None,
                "lng": zone.get("lng"),
                "lat": zone.get("lat"),
            })

        result = {"hotspots": hotspots}
        set_cached("hotspots_all", result)
        return result

    except Exception as e:
        print(f"ERROR in /hotspots/all: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"All hotspots fetch failed: {str(e)}"
        )

@app.get("/hotspots/by-risk/{risk_level}")
def get_hotspots_by_risk(risk_level: str):
    cache_key = f"predicted_{risk_level}"  # FIXED
    cached = get_cached(cache_key)
    if cached:
        return cached

    try:
        if risk_level not in ["high", "medium", "low"]:
            raise HTTPException(status_code=400, detail="Invalid risk level")

        data = supabase.table("predictions")\
            .select("*, zones(zone_name, lat, lng), interventions(*)")\
            .eq("hotspot_level", risk_level)\
            .order("prediction_lst", desc=True)\
            .limit(50)\
            .execute().data

        if not data:
            result = {"type": "FeatureCollection", "features": []}
            set_cached(cache_key, result)
            return result

        zone_ids = [row["zone_id"] for row in data if row.get("zone_id")]
        ndvi_map = {}
        if zone_ids:
            ndvi_data = supabase.table("features")\
                .select("zone_id, ndvi_mean")\
                .in_("zone_id", zone_ids)\
                .execute().data
            ndvi_map = {f["zone_id"]: f["ndvi_mean"] for f in ndvi_data}

        features = []
        for i, row in enumerate(data):
            zone = row.get("zones", {}) or {}
            lat = zone.get("lat")
            lng = zone.get("lng")
            interventions = row.get("interventions") or []

            if lat is None or lng is None:
                continue

            lst = row["prediction_lst"]
            severity = 3 if lst >= 38 else (2 if lst >= 35 else 1)
            ndvi = ndvi_map.get(row.get("zone_id"))

            features.append({
                "type": "Feature",
                "geometry": {
                    "type": "Point",
                    "coordinates": [lng, lat]
                },
                "properties": {
                    "name": zone.get("zone_name", f"Zone_{i+1}"),
                    "risk": row["hotspot_level"],
                    "severity": severity,
                    "lst_c": round(float(lst), 1),
                    "ndvi": round(float(ndvi), 3) if ndvi is not None else None,
                    "intervention_type": interventions[0]["intervention_type"]
                        if interventions else "Monitor",
                    "intervention_rationale": interventions[0]["rationale"]
                        if interventions else ""
                }
            })

        result = {"type": "FeatureCollection", "features": features}
        set_cached(cache_key, result)
        return result

    except HTTPException:
        raise
    except Exception as e:
        print(f"ERROR in by-risk/{risk_level}: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/hotspots/observed/{risk_level}")
def get_observed_by_risk(risk_level: str):
    cache_key = f"observed_{risk_level}"
    cached = get_cached(cache_key)
    if cached:
        return cached

    try:
        if risk_level not in ["high", "medium", "low"]:
            raise HTTPException(status_code=400, detail="Invalid risk level")

        all_features = []
        page = 0
        page_size = 500

        while True:
            batch = supabase.table("features")\
                .select("*, zones(zone_name, lat, lng)")\
                .range(page * page_size, (page + 1) * page_size - 1)\
                .execute().data
            if not batch:
                break
            all_features.extend(batch)
            page += 1
            if len(batch) < page_size:
                break

        if risk_level == "high":
            filtered = [f for f in all_features if f.get("lst", 0) >= 36]
        elif risk_level == "medium":
            filtered = [f for f in all_features if 33 <= f.get("lst", 0) < 36]
        else:
            filtered = [f for f in all_features if f.get("lst", 0) < 33]

        filtered.sort(key=lambda x: x.get("lst", 0), reverse=True)
        top50 = filtered[:50]

        features = []
        for i, row in enumerate(top50):
            zone = row.get("zones", {})
            lat = zone.get("lat")
            lng = zone.get("lng")
            if lat is None or lng is None:
                continue
            lst = row.get("lst", 0)
            ndvi = row.get("ndvi_mean", 0)
            severity = 3 if lst >= 38 else (2 if lst >= 35 else 1)
            intervention = get_intervention(
                risk_level, ndvi, row.get("landcover_class", 50)
            )
            features.append({
                "type": "Feature",
                "geometry": {"type": "Point", "coordinates": [lng, lat]},
                "properties": {
                    "name": zone.get("zone_name", f"Zone_{i+1}"),
                    "risk": risk_level,
                    "severity": severity,
                    "lst_c": round(float(lst), 1),
                    "ndvi": round(float(ndvi), 3) if ndvi else None,
                    "intervention_type": intervention["type"],
                    "intervention_rationale": intervention["rationale"]
                }
            })

        result = {"type": "FeatureCollection", "features": features}
        set_cached(cache_key, result)
        return result

    except HTTPException:
        raise
    except Exception as e:
        print(f"ERROR in observed/{risk_level}: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/admin/update-zone-names")
def update_zone_names():
    """Update zone names via Nominatim reverse geocoding"""
    try:
        import requests
        import time

        all_zones = []
        page = 0
        page_size = 500

        while True:
            batch = supabase.table("zones")\
                .select("zone_id, lat, lng")\
                .range(page * page_size, (page + 1) * page_size - 1)\
                .execute().data
            if not batch:
                break
            all_zones.extend(batch)
            page += 1
            if len(batch) < page_size:
                break

        print(f"Total zones: {len(all_zones)}")

        success = 0
        failed = 0

        for i, zone in enumerate(all_zones):
            lat = zone.get("lat")
            lng = zone.get("lng")

            if lat is None or lng is None:
                continue

            try:
                res = requests.get(
                    "https://nominatim.openstreetmap.org/reverse",
                    params={
                        "lat": lat,
                        "lon": lng,
                        "format": "json",
                        "zoom": 14,
                        "addressdetails": 1
                    },
                    headers={"User-Agent": "HeatWatch-FYP/1.0"},
                    timeout=5
                )

                data = res.json()
                addr = data.get("address", {})

                # Try progressively broader fields
                name = (
                    addr.get("suburb") or
                    addr.get("neighbourhood") or
                    addr.get("quarter") or
                    addr.get("village") or
                    addr.get("town") or
                    addr.get("city_district") or
                    addr.get("municipality") or
                    addr.get("county") or
                    addr.get("state_district") or
                    addr.get("city") or
                    None
                )

                # Fallback — use first part of display_name
                if not name:
                    display = data.get("display_name", "")
                    if display:
                        parts = [p.strip() for p in display.split(",")]
                        # Skip house numbers, take first meaningful part
                        for part in parts:
                            if part and not part.isdigit() and len(part) > 2:
                                name = part
                                break

                # Add district context
                district = addr.get("city_district") or \
                           addr.get("county") or ""
                if name and district and name != district:
                    name = f"{name}, {district}"

                if name:
                    supabase.table("zones")\
                        .update({"zone_name": name})\
                        .eq("zone_id", zone["zone_id"])\
                        .execute()
                    success += 1
                    print(f"[{i+1}/{len(all_zones)}] → {name}")
                else:
                    # Last resort — use coordinate reference
                    fallback = f"KL Grid ({lat:.3f}N, {lng:.3f}E)"
                    supabase.table("zones")\
                        .update({"zone_name": fallback})\
                        .eq("zone_id", zone["zone_id"])\
                        .execute()
                    failed += 1
                    print(f"[{i+1}/{len(all_zones)}] → {fallback} (fallback)")

            except Exception as e:
                print(f"[{i+1}/{len(all_zones)}] → error: {e}")
                failed += 1

            time.sleep(1)

        _cache.clear()

        return {
            "message": "Done",
            "success": success,
            "failed": failed,
            "total": len(all_zones)
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    
