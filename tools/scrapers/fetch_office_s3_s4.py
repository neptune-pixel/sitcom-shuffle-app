import urllib.request
import http.client
import re

url = "https://www.netflix.com/tr/title/70136120"
headers = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "Accept-Encoding": "identity"
}

req = urllib.request.Request(url, headers=headers)
try:
    resp = urllib.request.urlopen(req)
    html = ""
    try:
        html = resp.read().decode('utf-8', errors='ignore')
    except http.client.IncompleteRead as e:
        html = e.partial.decode('utf-8', errors='ignore')
    
    print(f"HTML size: {len(html)}")
    matches = re.findall(r'/watch/(\d+)', html)
    print(f"Found {len(set(matches))} watch IDs: {sorted(set(matches))}")
    
    # Save to file
    with open(r'C:\Users\afkav\.gemini\antigravity\scratch\sitcom-shuffle-app\scratch\office_page.html', 'w', encoding='utf-8') as f:
        f.write(html)
except Exception as e:
    print("Error:", e)
