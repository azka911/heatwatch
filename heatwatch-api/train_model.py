import pandas as pd
import numpy as np
from sklearn.ensemble import RandomForestRegressor
from sklearn.model_selection import train_test_split, KFold, cross_val_score, GroupKFold
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score, mean_absolute_percentage_error
import joblib
import json
from supabase import create_client
from dotenv import load_dotenv
import os

load_dotenv()
supabase = create_client(os.getenv("SUPABASE_URL"), os.getenv("SUPABASE_KEY"))

# Load GEE data
print("Loading data...")
df = pd.read_csv('HeatWatch_KL_Dataset.csv')

# Parse coordinates from .geo column
def parse_coords(geo_str):
    try:
        geo = json.loads(geo_str)
        coords = geo.get('coordinates', [0, 0])
        return coords[0], coords[1]
    except:
        return 0, 0

df[['lng', 'lat']] = df['.geo'].apply(
    lambda x: pd.Series(parse_coords(x))
)

# Clean data
df = df.dropna(subset=['lst', 'ndvi', 'landcover'])

# Add missing columns with defaults
df['month_index'] = 6
df['near_road'] = 0

# Filter realistic KL LST values
df = df[(df['lst'] >= 22) & (df['lst'] <= 45)]
df = df[(df['ndvi'] >= -0.1) & (df['ndvi'] <= 1.0)]

print(f"Clean dataset: {df.shape}")
print(f"LST range: {df['lst'].min():.1f} - {df['lst'].max():.1f} °C")
print(f"NDVI range: {df['ndvi'].min():.3f} - {df['ndvi'].max():.3f}")

# Features and target
X = df[['ndvi', 'landcover', 'month_index']]
y = df['lst']

# ── Baseline 80/20 ─────────────────────────────────────────────────────────────
X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.2, random_state=42
)

print(f"\nTraining on {len(X_train)} samples...")

rf = RandomForestRegressor(n_estimators=100, random_state=42, n_jobs=-1)
rf.fit(X_train, y_train)

preds = rf.predict(X_test)
mae  = mean_absolute_error(y_test, preds)
rmse = np.sqrt(mean_squared_error(y_test, preds))
r2   = r2_score(y_test, preds)
mape = mean_absolute_percentage_error(y_test, preds) * 100

print(f"\n=== Baseline 80/20 ===")
print(f"MAE:  {mae:.2f} °C")
print(f"RMSE: {rmse:.2f} °C")
print(f"R²:   {r2:.3f}")
print(f"MAPE: {mape:.2f}%")

# ── Feature Importance ─────────────────────────────────────────────────────────
print(f"\n=== Feature Importance ===")
for feat, imp in zip(X.columns, rf.feature_importances_):
    print(f"{feat}: {imp:.3f}")

# ── 5-Fold Cross-Validation ────────────────────────────────────────────────────
print(f"\n=== 5-Fold Cross-Validation ===")

rf_cv = RandomForestRegressor(n_estimators=100, random_state=42, n_jobs=-1)
kf = KFold(n_splits=5, shuffle=True, random_state=42)

cv_r2   = cross_val_score(rf_cv, X, y, cv=kf, scoring="r2")
cv_mae  = cross_val_score(rf_cv, X, y, cv=kf, scoring="neg_mean_absolute_error")
cv_rmse = cross_val_score(rf_cv, X, y, cv=kf, scoring="neg_root_mean_squared_error")

print(f"R²   : {cv_r2.mean():.3f} ± {cv_r2.std():.3f}")
print(f"MAE  : {-cv_mae.mean():.3f} ± {cv_mae.std():.3f} °C")
print(f"RMSE : {-cv_rmse.mean():.3f} ± {cv_rmse.std():.3f} °C")

# ── Spatial Block Cross-Validation ─────────────────────────────────────────────
print(f"\n=== Spatial Block Cross-Validation ===")

def assign_spatial_blocks(lats, lngs, n_blocks=5):
    lat_bins = pd.cut(lats, bins=n_blocks, labels=False).fillna(0).astype(int)
    lng_bins = pd.cut(lngs, bins=n_blocks, labels=False).fillna(0).astype(int)
    return lat_bins * n_blocks + lng_bins

spatial_groups = assign_spatial_blocks(df['lat'], df['lng'], n_blocks=5)
gkf = GroupKFold(n_splits=5)

spatial_r2, spatial_mae, spatial_rmse = [], [], []
rf_spatial = RandomForestRegressor(n_estimators=100, random_state=42, n_jobs=-1)

for train_idx, test_idx in gkf.split(X, y, groups=spatial_groups):
    X_tr, X_te = X.iloc[train_idx], X.iloc[test_idx]
    y_tr, y_te = y.iloc[train_idx], y.iloc[test_idx]
    rf_spatial.fit(X_tr, y_tr)
    p = rf_spatial.predict(X_te)
    spatial_r2.append(r2_score(y_te, p))
    spatial_mae.append(mean_absolute_error(y_te, p))
    spatial_rmse.append(np.sqrt(mean_squared_error(y_te, p)))

spatial_r2   = np.array(spatial_r2)
spatial_mae  = np.array(spatial_mae)
spatial_rmse = np.array(spatial_rmse)
r2_drop = cv_r2.mean() - spatial_r2.mean()

print(f"R²   : {spatial_r2.mean():.3f} ± {spatial_r2.std():.3f}")
print(f"MAE  : {spatial_mae.mean():.3f} °C")
print(f"RMSE : {spatial_rmse.mean():.3f} °C")
print(f"R² drop (CV → Spatial): {r2_drop:+.4f}")
print(f"{'No spatial leakage ✅' if r2_drop < 0.05 else 'Spatial leakage detected ⚠️'}")

# ── Save model ─────────────────────────────────────────────────────────────────
os.makedirs('models', exist_ok=True)
joblib.dump(rf, 'models/rf_model.pkl')
print("\nModel saved to models/rf_model.pkl")

# ── Update Supabase summary_stats ──────────────────────────────────────────────
avg_lst  = round(float(df['lst'].mean()), 1)
avg_ndvi = round(float(df['ndvi'].mean()), 2)

print(f"\n=== Real Data Stats ===")
print(f"Avg LST: {avg_lst} °C")
print(f"Avg NDVI: {avg_ndvi}")

supabase.table('summary_stats').update({
    'avg_lst':  avg_lst,
    'avg_ndvi': avg_ndvi,
}).eq('city', 'Kuala Lumpur').execute()

# ── Save model run metrics to Supabase ─────────────────────────────────────────
supabase.table('model_runs').insert({
    'model_name':    'RandomForest',
    'model_version': 'v2.0-modis',
    # Baseline
    'mae':  round(mae, 4),
    'rmse': round(rmse, 4),
    'r2':   round(r2, 4),
    'mape': round(mape, 4),
    # 5-Fold CV
    'cv_folds':      5,
    'cv_r2_mean':    round(float(cv_r2.mean()), 4),
    'cv_r2_std':     round(float(cv_r2.std()), 4),
    'cv_mae_mean':   round(float(-cv_mae.mean()), 4),
    'cv_mae_std':    round(float(cv_mae.std()), 4),
    'cv_rmse_mean':  round(float(-cv_rmse.mean()), 4),
    'cv_rmse_std':   round(float(cv_rmse.std()), 4),
    # Spatial CV
    'spatial_r2_mean':   round(float(spatial_r2.mean()), 4),
    'spatial_r2_std':    round(float(spatial_r2.std()), 4),
    'spatial_mae_mean':  round(float(spatial_mae.mean()), 4),
    'spatial_rmse_mean': round(float(spatial_rmse.mean()), 4),
    'spatial_r2_drop':   round(float(r2_drop), 4),
}).execute()

print("Stats updated in Supabase!")

# ── Seed zones and features ────────────────────────────────────────────────────
print("\n=== Seeding zones and features ===")

for i, row in df.iterrows():
    try:
        zone = supabase.table('zones').insert({
            'zone_name': f'Zone_{i}',
            'zone_type': 'grid',
            'lat': float(row['lat']),
            'lng': float(row['lng'])
        }).execute().data[0]

        supabase.table('features').insert({
            'zone_id':         zone['zone_id'],
            'month_index':     int(row['month_index']),
            'ndvi_mean':       float(row['ndvi']),
            'landcover_class': int(row['landcover']),
            'road_dist':       0.0,
            'lst':             float(row['lst'])
        }).execute()

        if i % 200 == 0:
            print(f"Seeded {i}/{len(df)} rows...")

    except Exception as e:
        print(f"Error at row {i}: {e}")
        continue

print("Done! All data seeded to Supabase.")