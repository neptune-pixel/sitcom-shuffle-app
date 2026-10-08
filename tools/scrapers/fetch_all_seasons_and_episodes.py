import urllib.request
import json
import time

shows_map = {
    'office': 526,
    'b99': 154,
    'community': 268,
    'friends': 431,
    'himym': 366,
    'modern_family': 82,
    'tbbt': 216,
    'parks': 174
}

all_titles = {}

headers = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)"
}

def get_json(url):
    req = urllib.request.Request(url, headers=headers)
    with urllib.request.urlopen(req, timeout=10) as resp:
        return json.loads(resp.read().decode('utf-8'))

for show_id, tvmaze_id in shows_map.items():
    try:
        seasons = get_json(f"https://api.tvmaze.com/shows/{tvmaze_id}/seasons")
        print(f"Show {show_id}: found {len(seasons)} seasons")
        show_dict = {}
        for s in seasons:
            s_id = s['id']
            eps = get_json(f"https://api.tvmaze.com/seasons/{s_id}/episodes")
            for ep in eps:
                s_num = ep['season']
                e_num = ep['number']
                title = ep['name']
                if s_num and e_num:
                    code = f"S{s_num:02d}E{e_num:02d}"
                    show_dict[code] = title
            time.sleep(0.2)
            
        all_titles[show_id] = show_dict
        print(f"  -> Total mapped for {show_id}: {len(show_dict)}")
    except Exception as e:
        print(f"Error fetching {show_id}: {e}")

print("\n--- SUMMARY OF ALL FETCHED EPISODE TITLES ---")
total_all = 0
for s_id, t_dict in all_titles.items():
    total_all += len(t_dict)
    print(f"  {s_id}: {len(t_dict)} episode titles")

print(f"\nTOTAL ALL EPISODES: {total_all}")

with open(r'tools/datasets/all_episodes_perfect.json', 'w', encoding='utf-8') as f:
    json.dump(all_titles, f, indent=2)

print("\nSaved all_episodes_perfect.json!")
