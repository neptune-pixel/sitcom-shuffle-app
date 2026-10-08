import urllib.request, urllib.parse, re

headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36'
}

queries = [
    'site:netflix.com/watch "The Office" "The Job"',
    '"netflix.com/watch" "The Office" "The Job"',
    '"netflix.com/watch" "The Office" "S3:E23"',
    '"netflix.com/watch" "The Office" "S3:E24"',
    '"netflix.com/watch" "The Office" "S3:E25"',
    'site:netflix.com/title/70136120 "The Job"'
]

for q in queries:
    url = "https://html.duckduckgo.com/html/?q=" + urllib.parse.quote(q)
    try:
        req = urllib.request.Request(url, headers=headers)
        with urllib.request.urlopen(req, timeout=8) as resp:
            html = resp.read().decode('utf-8', errors='ignore')
            urls = re.findall(r'netflix\.com/(?:watch|title)/(\d+)', html)
            snippets = re.findall(r'<a class="result__snippet[^>]*>(.*?)</a>', html)
            print(f"\nQuery: {q}")
            print("Found IDs:", set(urls))
            for s in snippets[:3]:
                # strip html tags
                clean_s = re.sub(r'<[^>]+>', '', s)
                print("  Snippet:", clean_s)
    except Exception as e:
        print(f"Query {q} failed: {e}")
