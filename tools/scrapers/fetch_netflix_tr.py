import urllib.request, http.client, re, json

url = "https://www.netflix.com/tr/title/70136120"
headers = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
    "Accept-Language": "tr-TR,tr;q=0.9,en-US;q=0.8,en;q=0.7"
}

html = ""
req = urllib.request.Request(url, headers=headers)
try:
    with urllib.request.urlopen(req, timeout=10) as resp:
        html = resp.read().decode('utf-8', errors='ignore')
except http.client.IncompleteRead as e:
    html = e.partial.decode('utf-8', errors='ignore')
except Exception as e:
    print("Other error:", e)

print("Fetched bytes:", len(html))
with open('scratch/netflix_office_tr.html', 'w', encoding='utf-8') as f:
    f.write(html)

# Extract all JSON or data embedded in page
matches = re.findall(r'(?:watch/|title/|data-videoid=[\"\\\']?)(\d{8})', html)
print("Unique 8-digit IDs:", sorted(set(matches)))

# Look for titles
titles = re.findall(r'"name":"([^"]+)"', html)
print(f"Titles found ({len(titles)}):", titles[:25])
