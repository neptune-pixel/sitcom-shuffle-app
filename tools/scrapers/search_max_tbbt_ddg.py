import urllib.request
import urllib.parse
import re
import json

headers = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
}

queries = [
    'site:play.max.com "Big Bang Theory"',
    'site:play.hbomax.com "Big Bang Theory"',
    '"play.max.com/video/watch" "Big Bang Theory"',
    '"play.max.com/episode" "Big Bang Theory"'
]

all_found = set()

for q in queries:
    url = "https://html.duckduckgo.com/html/?q=" + urllib.parse.quote(q)
    req = urllib.request.Request(url, headers=headers)
    try:
        with urllib.request.urlopen(req, timeout=5) as resp:
            html = resp.read().decode('utf-8', errors='ignore')
            matches = re.findall(r'play\.(?:max|hbomax)\.com/[^\s"\'<>]+', html)
            print(f"Query '{q}' found {len(matches)} matches:")
            for m in matches:
                print("  ", m)
                all_found.add(m)
    except Exception as e:
        print(f"Query '{q}' failed: {e}")

print("\n--- ALL UNIQUE MAX URLS FOUND ---")
for u in sorted(all_found):
    print("  ", u)
