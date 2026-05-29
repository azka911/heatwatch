from supabase import create_client
from dotenv import load_dotenv
import os
import sys

load_dotenv()

url = os.getenv("SUPABASE_URL")
key = os.getenv("SUPABASE_KEY")

if not url or not key:
    print("ERROR: Missing SUPABASE_URL or SUPABASE_KEY in .env")
    sys.exit(1)

try:
    supabase = create_client(url, key)
    print("Supabase connected successfully")
except Exception as e:
    print(f"ERROR: Could not connect to Supabase: {e}")
    sys.exit(1)