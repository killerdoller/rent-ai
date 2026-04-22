import requests

url = "https://nkwemnfunfsxkcpfipyq.supabase.co/rest/v1/properties"
headers = {
    "apikey": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5rd2VtbmZ1bmZzeGtjcGZpcHlxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MjIxODMzOCwiZXhwIjoyMDg3Nzk0MzM4fQ.LbMoz4nSw1sb3qww4-FAPhm2nzjoYJ_5pzW8IeylhIQ",
    "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5rd2VtbmZ1bmZzeGtjcGZpcHlxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MjIxODMzOCwiZXhwIjoyMDg3Nzk0MzM4fQ.LbMoz4nSw1sb3qww4-FAPhm2nzjoYJ_5pzW8IeylhIQ"
}

try:
    r = requests.get(f"{url}?select=allows_students", headers=headers)
    data = r.json()
    true_count = len([x for x in data if x.get('allows_students') is True])
    false_count = len([x for x in data if x.get('allows_students') is False])
    null_count = len([x for x in data if x.get('allows_students') is None])
    print(f"Total: {len(data)}")
    print(f"Allows: {true_count}")
    print(f"Disallows: {false_count}")
    print(f"Null: {null_count}")
except Exception as e:
    print(f"Error: {e}")
