from supabase import create_client
from dotenv import load_dotenv
import os

load_dotenv()

url = os.getenv("SUPABASE_URL")
key = os.getenv("SUPABASE_KEY")

print(f"URL: {url}")
print(f"Key: {key[:20] if key else 'NOT FOUND'}...")

supabase = create_client(url, key)
result = supabase.table("zones").select("zone_id").limit(1).execute()
print(f"Connection OK: {result.data}")