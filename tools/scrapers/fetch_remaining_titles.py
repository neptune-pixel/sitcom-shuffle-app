import urllib.request
import urllib.parse
import json
import time

headers = {"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)"}

def get_json(url):
    req = urllib.request.Request(url, headers=headers)
    with urllib.request.urlopen(req, timeout=10) as resp:
        return json.loads(resp.read().decode('utf-8'))

show_queries = {
    'b99': 'Brooklyn Nine-Nine',
    'community': 'Community',
    'himym': 'How I Met Your Mother',
    'modern_family': 'Modern Family',
    'tbbt': 'The Big Bang Theory'
}

with open(r'tools/datasets/all_episodes_perfect.json', 'r', encoding='utf-8') as f:
    all_titles = json.load(f)

for show_key, query in show_queries.items():
    print(f"\nSearching for {query} ({show_key})...")
    search_url = f"https://api.tvmaze.com/search/shows?q={urllib.parse.quote(query)}"
    res = get_json(search_url)
    
    # Find matching show
    for item in res:
        show_info = item['show']
        title_name = show_info['name']
        tv_id = show_info['id']
        print(f"  Candidate: {title_name} (ID: {tv_id})")
        
        # Get seasons
        seasons = get_json(f"https://api.tvmaze.com/shows/{tv_id}/seasons")
        print(f"  Found {len(seasons)} seasons for ID {tv_id}")
        
        show_dict = all_titles.get(show_key, {})
        for s in seasons:
            s_id = s['id']
            eps = get_json(f"https://api.tvmaze.com/seasons/{s_id}/episodes")
            for ep in eps:
                s_num = ep['season']
                e_num = ep['number']
                t_name = ep['name']
                if s_num and e_num:
                    code = f"S{s_num:02d}E{e_num:02d}"
                    show_dict[code] = t_name
            time.sleep(0.1)
            
        all_titles[show_key] = show_dict
        print(f"  -> Total mapped for {show_key}: {len(show_dict)}")
        if len(show_dict) > 100:
            break

with open(r'tools/datasets/all_episodes_perfect.json', 'w', encoding='utf-8') as f:
    json.dump(all_titles, f, indent=2)

print("\nUpdated all_episodes_perfect.json!")
