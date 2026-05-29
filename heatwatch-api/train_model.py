import pandas as pd
import numpy as np
from sklearn.ensemble import RandomForestRegressor
from sklearn.model_selection import train_test_split
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score
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

# Train/test split
X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.2, random_state=42
)

print(f"\nTraining on {len(X_train)} samples...")

# Train model
rf = RandomForestRegressor(
    n_estimators=100,
    random_state=42,
    n_jobs=-1
)
rf.fit(X_train, y_train)

# Evaluate
preds = rf.predict(X_test)
mae = mean_absolute_error(y_test, preds)
rmse = np.sqrt(mean_squared_error(y_test, preds))
r2 = r2_score(y_test, preds)

print(f"\n=== Model Performance ===")
print(f"MAE:  {mae:.2f} °C")
print(f"RMSE: {rmse:.2f} °C")
print(f"R²:   {r2:.3f}")

# Feature importance
print(f"\n=== Feature Importance ===")
for feat, imp in zip(X.columns, rf.feature_importances_):
    print(f"{feat}: {imp:.3f}")

# Save model
os.makedirs('models', exist_ok=True)
joblib.dump(rf, 'models/rf_model.pkl')
print("\nModel saved to models/rf_model.pkl")

# Update summary stats with real data
avg_lst = round(float(df['lst'].mean()), 1)
avg_ndvi = round(float(df['ndvi'].mean()), 2)

print(f"\n=== Real Data Stats ===")
print(f"Avg LST: {avg_lst} °C")
print(f"Avg NDVI: {avg_ndvi}")

# Update Supabase summary_stats
supabase.table('summary_stats').update({
    'avg_lst': avg_lst,
    'avg_ndvi': avg_ndvi,
}).eq('city', 'Kuala Lumpur').execute()

# Save model run metrics
supabase.table('model_runs').insert({
    'model_name': 'RandomForest',
    'model_version': 'v2.0-modis',
    'mae': round(mae, 4),
    'rmse': round(rmse, 4),
    'r2': round(r2, 4)
}).execute()

print("\nStats updated in Supabase!")
print("\n=== Seeding zones and features ===")

# Seed zones and features tables
for i, row in df.iterrows():
    try:
        # Insert zone
        zone = supabase.table('zones').insert({
            'zone_name': f'Zone_{i}',
            'zone_type': 'grid',
            'lat': float(row['lat']),
            'lng': float(row['lng'])
        }).execute().data[0]

        # Insert feature
        supabase.table('features').insert({
            'zone_id': zone['zone_id'],
            'month_index': int(row['month_index']),
            'ndvi_mean': float(row['ndvi']),
            'landcover_class': int(row['landcover']),
            'road_dist': 0.0,
            'lst': float(row['lst'])
        }).execute()

        if i % 200 == 0:
            print(f"Seeded {i}/{len(df)} rows...")

    except Exception as e:
        print(f"Error at row {i}: {e}")
        continue

print("Done! All data seeded to Supabase.")