import json
import re

with open('tools/datasets/tbbt_max_links.json', 'r', encoding='utf-8') as f:
    data = json.load(f)

eps = {}
season = 0
episode = 1
for item in data:
    url, title = item.split(' ||| ')
    if title.startswith('E1:'):
        season += 1
        episode = 1
    
    key = f'S{season:02d}E{episode:02d}'
    eps[key] = url
    episode += 1

js_path = r'C:\Users\afkav\.gemini\antigravity\scratch\sitcom-shuffle-app\src\data\sitcomsData.js'
with open(js_path, 'r', encoding='utf-8') as f:
    content = f.read()

start_idx = content.find('"id": "tbbt"')
if start_idx == -1:
    print("Could not find tbbt in JS")
    exit(1)

# Find "directPlatformLinks": { ... },
direct_start = content.find('"directPlatformLinks":', start_idx)
brace_start = content.find('{', direct_start)
count = 0
brace_end = -1
for i in range(brace_start, len(content)):
    if content[i] == '{':
        count += 1
    elif content[i] == '}':
        count -= 1
        if count == 0:
            brace_end = i
            break

# We need to insert after brace_end + 1 (the comma)
insert_pos = content.find(',', brace_end) + 1

new_obj = '\n    "episodeWatchIds": {\n'
for k, v in eps.items():
    new_obj += f'      "{k}": "{v}",\n'
new_obj = new_obj.rstrip(',\n') + '\n    },'

new_content = content[:insert_pos] + new_obj + content[insert_pos:]

with open(js_path, 'w', encoding='utf-8') as f:
    f.write(new_content)

print("Successfully injected into sitcomsData.js!")
