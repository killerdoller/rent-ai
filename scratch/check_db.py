import os
from supabase import create_client

url = "https://nkwemnfunfsxkcpfipyq.supabase.co"
key = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5rd2VtbmZ1bmZzeGtjcGZpcHlxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MjIxODMzOCwiZXhwIjoyMDg3Nzk0MzM4fQ.LbMoz4nSw1sb3qww4-FAPhm2nzjoYJ_5pzW8IeylhIQ"

supabase = create_client(url, key)

res = supabase.table("properties").select("count", count="exact").execute()
print(f"Total properties: {res.count}")

res2 = supabase.table("properties").select("property_id, title, allows_students").limit(5).execute()
print(f"Sample properties: {res2.data}")
