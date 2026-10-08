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
                watch_ids[k] = v

print("=== SEASON 2 (22 episodes) ===")
for i in range(1, 23):
    code = f"S02E{i:02d}"
    print(f"  {code}: {watch_ids.get(code)}")

print("\n=== SEASON 3 (25 episodes) ===")
for i in range(1, 26):
    code = f"S03E{i:02d}"
    print(f"  {code}: {watch_ids.get(code)}")

print("\n=== SEASON 4 (19 episodes) ===")
for i in range(1, 20):
    code = f"S04E{i:02d}"
    print(f"  {code}: {watch_ids.get(code)}")
