import urllib.request
import re

url = "https://reelgood.com/show/the-big-bang-theory-2007"
req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0 Safari/537.36'})
try:
    html = urllib.request.urlopen(req).read().decode('utf-8')
    print("Fetched Reelgood TBBT page. Checking for max links...")
    # Reelgood links are usually reelgood.com/show/... or direct. Let's see if there are any play.max.com links in the HTML
    max_links = set(re.findall(r'play\.max\.com/[a-zA-Z0-9-/_]+', html))
    print(f"Found {len(max_links)} Max links on Reelgood:")
    for l in max_links:
        print(l)
except Exception as e:
    print("Error:", e)
