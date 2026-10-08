import re

with open(r'C:\Users\afkav\.gemini\antigravity\scratch\sitcom-shuffle-app\src\data\sitcomsData.js', 'r', encoding='utf-8') as f:
    text = f.read()

# Locate tbbt object
tbbt_start = text.find("id: 'tbbt'")

# Find episodeWatchIds inside tbbt object
watch_ids_start = text.find("episodeWatchIds: {", tbbt_start)
watch_ids_end = text.find("},", watch_ids_start) + 1

old_watch_ids_block = text[watch_ids_start:watch_ids_end]

# TBBT season episode counts (12 seasons)
seasons_counts = [
    (1, 17),
    (2, 23),
    (3, 23),
    (4, 24),
    (5, 24),
    (6, 24),
    (7, 24),
    (8, 24),
    (9, 24),
    (10, 24),
    (11, 24),
    (12, 24)
]

new_lines = ["episodeWatchIds: {"]

total_episodes = 0
for s, count in seasons_counts:
    for e in range(1, count + 1):
        total_episodes += 1
        code = f"S{s:02d}E{e:02d}"
        url = f"https://play.max.com/show/da61aef2-e4b6-441a-b2aa-91855ca05dad?season={s}&episode={e}"
        comma = "," if (s != 12 or e != count) else ""
        new_lines.append(f"      '{code}': '{url}'{comma}")

new_lines.append("    }")
new_watch_ids_block = "\n".join(new_lines)

# Replace old block with new block
new_text = text[:watch_ids_start] + new_watch_ids_block + text[watch_ids_end:]

with open(r'C:\Users\afkav\.gemini\antigravity\scratch\sitcom-shuffle-app\src\data\sitcomsData.js', 'w', encoding='utf-8') as f:
    f.write(new_text)

print(f"Successfully updated TBBT HBO Max watch links for all {total_episodes} episodes across 12 seasons!")
