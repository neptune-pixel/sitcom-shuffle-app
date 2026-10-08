import urllib.request
import json

url = "https://api.tvmaze.com/shows/526/episodes"

try:
    with urllib.request.urlopen(url) as resp:
        episodes = json.loads(resp.read().decode('utf-8'))
        print(f"Total TVMaze episodes: {len(episodes)}")
        
        s3 = [e for e in episodes if e['season'] == 3]
        s4 = [e for e in episodes if e['season'] == 4]
        
        print("\n--- SEASON 3 ---")
        for e in s3:
            print(f"  S03E{e['number']:02d}: {e['name']}")
            
        print("\n--- SEASON 4 ---")
        for e in s4:
            print(f"  S04E{e['number']:02d}: {e['name']}")
            
        with open(r'tools/datasets/tvmaze_office.json', 'w', encoding='utf-8') as f:
            json.dump(episodes, f, indent=2)
except Exception as err:
    print("Error:", err)
