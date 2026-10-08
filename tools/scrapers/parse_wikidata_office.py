import json

with open(r'tools/datasets/wikidata_office_episodes.json', 'r', encoding='utf-8') as f:
    episodes = json.load(f)

print(f"Total entries: {len(episodes)}")
for ep in episodes:
    print(ep)
