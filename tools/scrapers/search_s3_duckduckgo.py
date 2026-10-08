import urllib.request
import urllib.parse
import re
import json

episodes_s3 = [
    ("S03E11", "A Benihana Christmas"),
    ("S03E12", "Back from Vacation"),
    ("S03E13", "Traveling Salesmen"),
    ("S03E14", "The Return"),
    ("S03E15", "Ben Franklin"),
    ("S03E16", "Phyllis' Wedding"),
    ("S03E17", "Business School"),
    ("S03E18", "Cocktails"),
    ("S03E19", "The Negotiation"),
    ("S03E20", "Safety Training"),
    ("S03E21", "Product Recall"),
    ("S03E22", "Women's Appreciation"),
    ("S03E23", "Beach Games"),
    ("S03E24", "The Job")
]

headers = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
}

found_ids = {}

for code, title in episodes_s3:
    query = f'site:netflix.com/watch "The Office" "{title}"'
    url = "https://html.duckduckgo.com/html/?q=" + urllib.parse.quote(query)
    req = urllib.request.Request(url, headers=headers)
    try:
        with urllib.request.urlopen(req, timeout=5) as resp:
            html = resp.read().decode('utf-8', errors='ignore')
            matches = re.findall(r'netflix\.com/watch/(\d+)', html)
            if matches:
                print(f"FOUND {code} ({title}): {matches}")
                found_ids[code] = matches[0]
            else:
                # Try without site restriction
                query2 = f'"netflix.com/watch/" "The Office" "{title}"'
                url2 = "https://html.duckduckgo.com/html/?q=" + urllib.parse.quote(query2)
                req2 = urllib.request.Request(url2, headers=headers)
                with urllib.request.urlopen(req2, timeout=5) as resp2:
                    html2 = resp2.read().decode('utf-8', errors='ignore')
                    matches2 = re.findall(r'netflix\.com/watch/(\d+)', html2)
                    if matches2:
                        print(f"FOUND {code} ({title}) via query2: {matches2}")
                        found_ids[code] = matches2[0]
                    else:
                        print(f"NOT FOUND {code} ({title})")
    except Exception as e:
        print(f"Error for {code}: {e}")

print("\n--- SUMMARY OF FOUND S3 WATCH IDS ---")
print(json.dumps(found_ids, indent=2))
