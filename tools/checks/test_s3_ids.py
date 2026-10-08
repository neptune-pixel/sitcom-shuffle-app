import urllib.request
import re
import time

headers = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "Accept-Language": "tr-TR,tr;q=0.9,en-US;q=0.8,en;q=0.7"
}

results = {}

for id_num in range(70080615, 70080645):
    url = f"https://www.netflix.com/tr/title/{id_num}"
    req = urllib.request.Request(url, headers=headers)
    try:
        resp = urllib.request.urlopen(req, timeout=5)
        html = resp.read().decode('utf-8', errors='ignore')
        
        # Look for schema.org title or og:title
        title_match = re.search(r'"name":"([^"]+)"', html) or re.search(r'<title>([^<]+)</title>', html)
        if title_match:
            t_str = title_match.group(1)
            results[str(id_num)] = t_str
            print(f"ID {id_num}: {t_str}")
        else:
            print(f"ID {id_num}: Loaded but no title match")
    except Exception as e:
        print(f"ID {id_num}: Failed ({e})")
    time.sleep(0.3)

import json
with open(r'C:\Users\afkav\.gemini\antigravity\scratch\sitcom-shuffle-app\scratch\s3_id_results.json', 'w', encoding='utf-8') as f:
    json.dump(results, f, indent=2)
