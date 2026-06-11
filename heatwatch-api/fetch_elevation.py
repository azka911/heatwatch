import requests
import time
import pandas as pd

df = pd.read_csv('zones_export.csv')
print(f"Total zones: {len(df)}")

elevations = []
for i, row in df.iterrows():
    try:
        res = requests.get(
            "https://api.open-elevation.com/api/v1/lookup",
            params={"locations": f"{row['lat']},{row['lng']}"},
            timeout=10
        )
        elev = res.json()['results'][0]['elevation']
        elevations.append(elev)
        if i % 100 == 0:
            print(f"{i}/{len(df)} — elevation: {elev}m")
    except Exception as e:
        print(f"Error at {i}: {e}")
        elevations.append(None)
    time.sleep(0.3)

df['elevation'] = elevations
df.to_csv('zones_with_elevation.csv', index=False)
print("Done! Saved to zones_with_elevation.csv")