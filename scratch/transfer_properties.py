import requests

url = "https://nkwemnfunfsxkcpfipyq.supabase.co/rest/v1/properties"
headers = {
    "apikey": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5rd2VtbmZ1bmZzeGtjcGZpcHlxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MjIxODMzOCwiZXhwIjoyMDg3Nzk0MzM4fQ.LbMoz4nSw1sb3qww4-FAPhm2nzjoYJ_5pzW8IeylhIQ",
    "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5rd2VtbmZ1bmZzeGtjcGZpcHlxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MjIxODMzOCwiZXhwIjoyMDg3Nzk0MzM4fQ.LbMoz4nSw1sb3qww4-FAPhm2nzjoYJ_5pzW8IeylhIQ",
    "Content-Type": "application/json",
    "Prefer": "return=representation"
}

old_owner = "195cb62c-e5f0-4a40-b409-38734dce697e"
new_owner = "fcc6d3d9-4778-440e-aa3a-6deb3d542990"

try:
    # SQL Update vía REST API (usando filtros)
    r = requests.patch(f"{url}?owner_id=eq.{old_owner}", 
                       headers=headers, 
                       json={"owner_id": new_owner})
    
    if r.status_code in [200, 204]:
        print(f"Éxito: Propiedades transferidas correctamente al nuevo propietario.")
    else:
        print(f"Error ({r.status_code}): {r.text}")
except Exception as e:
    print(f"Error: {e}")
