import requests

url = "http://localhost:3000/api/properties"

try:
    r = requests.get(url)
    print(f"Status: {r.status_code}")
    if r.status_code == 200:
        data = r.json()
        print(f"Found {len(data)} properties")
        if len(data) > 0:
            print(f"First property: {data[0]['title']}")
    else:
        print(f"Error: {r.text}")
except Exception as e:
    print(f"Error: {e}")
