import urllib.request
import json

url = "https://api.justwatch.com/titles/en_US/popular"
headers = {
    "Content-Type": "application/json",
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
}

body = json.dumps({
    "query": "The Big Bang Theory",
    "content_types": ["show"]
}).encode('utf-8')

req = urllib.request.Request(url, data=body, headers=headers)
try:
    with urllib.request.urlopen(req) as resp:
        res = json.loads(resp.read().decode('utf-8'))
        print(f"Total results: {len(res.get('items', []))}")
        for item in res.get('items', []):
            print(f"  Title: {item.get('title')} (ID: {item.get('id')}, Object_ID: {item.get('object_id')})")
            
            # Fetch show details
            show_id = item.get('id')
            show_url = f"https://api.justwatch.com/titles/show/{show_id}/locale/en_US"
            req2 = urllib.request.Request(show_url, headers=headers)
            with urllib.request.urlopen(req2) as resp2:
                show_details = json.loads(resp2.read().decode('utf-8'))
                with open(r'C:\Users\afkav\.gemini\antigravity\scratch\sitcom-shuffle-app\scratch\justwatch_tbbt_rest.json', 'w', encoding='utf-8') as f:
                    json.dump(show_details, f, indent=2)
                print("  Saved show details!")
                break
except Exception as e:
    print("Error:", e)
