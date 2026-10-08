import json

with open(r'C:\Users\afkav\.gemini\antigravity\scratch\sitcom-shuffle-app\scratch\check_office_links.py', 'r') as f:
    pass

# Read sitcomsData.js watchIds directly
import re
with open(r'C:\Users\afkav\.gemini\antigravity\scratch\sitcom-shuffle-app\src\data\sitcomsData.js', 'r', encoding='utf-8') as f:
    text = f.read()

watch_ids_match = re.search(r'id:\s*\'office\'[\s\S]*?episodeWatchIds:\s*\{([^}]+)\}', text)
watch_ids = {}
if watch_ids_match:
    for line in watch_ids_match.group(1).splitlines():
        if ':' in line:
            parts = line.split(':')
            k = parts[0].strip().strip("'\"")
            v = parts[1].strip().strip("',\"")
            if k and v:
                watch_ids[k] = int(v)

print("--- SEASON 3 mapped IDs ---")
for k, v in sorted(watch_ids.items()):
    if k.startswith("S03"):
        print(f"  {k}: {v}")

print("\n--- SEASON 4 mapped IDs ---")
for k, v in sorted(watch_ids.items()):
    if k.startswith("S04"):
        print(f"  {k}: {v}")
