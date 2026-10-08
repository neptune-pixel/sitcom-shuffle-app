import re
import json

with open(r'C:\Users\afkav\.gemini\antigravity\scratch\sitcom-shuffle-app\src\data\sitcomsData.js', 'r', encoding='utf-8') as f:
    text = f.read()

# Extract office section
office_start = text.find("id: 'office'")
b99_start = text.find("id: 'b99'")
office_text = text[office_start:b99_start]

# Parse episodeWatchIds
watch_ids_match = re.search(r'episodeWatchIds:\s*\{([^}]+)\}', office_text)
watch_ids = {}
if watch_ids_match:
    for line in watch_ids_match.group(1).splitlines():
        line = line.strip()
        if ':' in line:
            parts = line.split(':')
            k = parts[0].strip().strip("'\"")
            v = parts[1].strip().strip("',\"")
            if k and v:
                watch_ids[k] = v

print(f"Total watch IDs defined for Office: {len(watch_ids)}")

# Check seasons and episodes
# We can find all SxxExx codes in watch_ids
print("\nWatch IDs mapped:")
for k, v in sorted(watch_ids.items()):
    print(f"  {k}: {v}")

