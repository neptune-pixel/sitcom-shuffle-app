import json

with open(r'tools/datasets/tvmaze_office.json', 'r', encoding='utf-8') as f:
    data = json.load(f)

s7 = [e for e in data if e['season'] == 7]
for e in s7:
    print(f"S07E{e['number']:02d}: {e['name']}")
