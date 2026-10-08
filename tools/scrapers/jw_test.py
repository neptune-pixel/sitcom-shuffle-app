import urllib.request
import re

url = "https://www.justwatch.com/us/tv-show/the-big-bang-theory/season-1"
req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'})
try:
    html = urllib.request.urlopen(req).read().decode('utf-8')
    # Find all play.max.com links in the HTML
    max_links = set(re.findall(r'https://play\.max\.com/[^\s"\'<>]+', html))
    print("Found max links on JW season 1 page:")
    for l in max_links:
        print(l)
except Exception as e:
    print("Error:", e)
