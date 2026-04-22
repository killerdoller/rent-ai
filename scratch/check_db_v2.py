import requests
import json

url = "https://nkwemnfunfsxkcpfipyq.supabase.co/rest/v1/properties"
headers = {
    "apikey": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5rd2VtbmZ1bmZzeGtjcGZpcHlxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MjIxODMzOCwiZXhwIjoyMDg3Nzk0MzM4fQ.LbMoz4nSw1sb3qww4-FAPhm2nzjoYJ_5pzW8IeylhIQ",
    "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5rd2VtbmZ1bmZzeGtjcGZpcHlxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MjIxODMzOCwiZXhwIjoyMDg3Nzk0MzM4fQ.LbMoz4nSw1sb3qww4-FAPhm2nzjoYJ_5pzW8IeylhIQ"
}

try:
    r = requests.get(f"{url}?select=property_id,allows_students&limit=5", headers=headers)
    print(f"Status: {r.status_code}")
    print(f"Data: {r.text}")
    
    r2 = requests.get(f"{url}?select=count", headers=headers, params={"count": "exact"})
    print(f"Total Count: {r2.headers.get('Content-Range')}")
except Exception as e:
    print(f"Error: {e}")
