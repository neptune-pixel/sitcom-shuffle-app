import urllib.request
import re
from concurrent.futures import ThreadPoolExecutor, as_completed
import json

headers = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "Accept-Language": "tr-TR,tr;q=0.9,en-US;q=0.8,en;q=0.7"
}

def probe_id(id_num):
    url = f"https://www.netflix.com/tr/title/{id_num}"
    req = urllib.request.Request(url, headers=headers)
    try:
        with urllib.request.urlopen(req, timeout=4) as resp:
            html = resp.read().decode('utf-8', errors='ignore')
            # Extract title / episode title
            title_match = re.search(r'"name":"([^"]+)"', html) or re.search(r'<title>([^<]+)</title>', html)
            if title_match:
                t = title_match.group(1)
                return id_num, t
    except Exception as e:
        pass
    return id_num, None

id_list = list(range(70080610, 70080665)) + list(range(70108685, 70108710))
results = {}

print(f"Probing {len(id_list)} IDs concurrently...")
with ThreadPoolExecutor(max_workers=20) as executor:
    future_to_id = {executor.submit(probe_id, i): i for i in id_list}
    for future in as_completed(future_to_id):
        id_num, title = future.result()
        if title:
            results[str(id_num)] = title
            print(f"  {id_num}: {title}")

with open(r'C:\Users\afkav\.gemini\antigravity\scratch\sitcom-shuffle-app\scratch\probed_watch_ids.json', 'w', encoding='utf-8') as f:
    json.dump(results, f, indent=2)

print(f"\nDone! Found {len(results)} valid title matches.")
