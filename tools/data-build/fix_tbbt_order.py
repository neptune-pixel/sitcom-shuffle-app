import json
import re
import os

with open('tools/datasets/tbbt_max_links.json', 'r', encoding='utf-8') as f:
    data = json.load(f)

# Split into chunks of seasons
seasons = []
current_season = []

for item in data:
    url, title = item.split(' ||| ')
    if title.startswith('E1:'):
        if current_season:
            seasons.append(current_season)
        current_season = []
    current_season.append((url, title))

if current_season:
    seasons.append(current_season)

print("Found", len(seasons), "seasons.")

# For each season chunk, determine the year from E1
season_years = []
for idx, chunk in enumerate(seasons):
    e1_title = chunk[0][1]
    # Extract year, e.g., "dk.2007" or just "2007"
    match = re.search(r'(200[7-9]|201[0-9])', e1_title)
    if match:
        year = int(match.group(1))
    else:
        print(f"Warning: could not find year in {e1_title}")
        year = 0
    season_years.append({'year': year, 'chunk': chunk})

# Sort seasons by year
season_years.sort(key=lambda x: x['year'])

eps = {}
for s_idx, sy in enumerate(season_years):
    season_num = s_idx + 1
    for e_idx, (url, title) in enumerate(sy['chunk']):
        episode_num = e_idx + 1
        key = f'S{season_num:02d}E{episode_num:02d}'
        eps[key] = url

js_path = r'C:\Users\afkav\.gemini\antigravity\scratch\sitcom-shuffle-app\src\data\sitcomsData.js'
with open(js_path, 'r', encoding='utf-8') as f:
    content = f.read()

start_idx = content.find('"id": "tbbt"')
if start_idx == -1:
    print("Could not find tbbt in JS")
    exit(1)

# Now we already have "episodeWatchIds": { ... } in the file, we must replace it entirely.
ep_start = content.find('"episodeWatchIds":', start_idx)
if ep_start == -1:
    print("Could not find episodeWatchIds for tbbt")
    exit(1)

brace_start = content.find('{', ep_start)
brace_end = -1
count = 0
for i in range(brace_start, len(content)):
    if content[i] == '{':
        count += 1
    elif content[i] == '}':
        count -= 1
        if count == 0:
            brace_end = i
            break

if brace_end == -1:
    print("Could not find end of episodeWatchIds")
    exit(1)

new_obj = '{\n'
for k, v in eps.items():
    new_obj += f'      "{k}": "{v}",\n'
new_obj = new_obj.rstrip(',\n') + '\n    }'

new_content = content[:brace_start] + new_obj + content[brace_end+1:]

with open(js_path, 'w', encoding='utf-8') as f:
    f.write(new_content)

print("Successfully fixed and injected into sitcomsData.js!")
