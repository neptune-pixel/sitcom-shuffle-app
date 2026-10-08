import re

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

# Find seasons in office_text
season_blocks = re.findall(r'season:\s*(\d+)[\s\S]*?episodes:\s*\[([\s\S]*?)\]\s*\}', office_text)

missing_episodes = []
total_episodes = 0

for s_num_str, ep_text in season_blocks:
    s_num = int(s_num_str)
    ep_matches = re.findall(r'episode:\s*(\d+)[\s\S]*?title:\s*[\'"]([^\'"]+)[\'"]', ep_text)
    for e_num_str, title in ep_matches:
        total_episodes += 1
        e_num = int(e_num_str)
        code = f"S{s_num:02d}E{e_num:02d}"
        if code not in watch_ids:
            missing_episodes.append((code, s_num, e_num, title))

print(f"Total Office episodes in DB: {total_episodes}")
print(f"Total mapped watch IDs: {len(watch_ids)}")
print(f"Total missing watch IDs: {len(missing_episodes)}\n")

print("Missing Episodes List:")
for code, s, e, title in missing_episodes:
    print(f"  - {code}: {title} (Sezon {s}, Bölüm {e})")

