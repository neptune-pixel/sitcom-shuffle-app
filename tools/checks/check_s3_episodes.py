import json

with open('tools/datasets/tvmaze_office.json', 'r', encoding='utf-8') as f:
    tvmaze = json.load(f)

print("TVMaze Season 3:")
for ep in tvmaze:
    if ep.get('season') == 3:
        print(f"S{ep['season']:02d}E{ep['number']:02d}: {ep['name']}")
