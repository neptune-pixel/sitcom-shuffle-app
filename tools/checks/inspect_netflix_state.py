import re
import json

with open(r'C:\Users\afkav\.gemini\antigravity\scratch\sitcom-shuffle-app\scratch\office_page.html', 'r', encoding='utf-8') as f:
    html = f.read()

# Look for window.__INITIAL_STATE__ or netflix.falkor or reactContext or script type="application/json"
scripts = re.findall(r'<script[^>]*>(.*?)</script>', html, re.DOTALL)

print(f"Total script tags: {len(scripts)}")
for i, s in enumerate(scripts):
    if len(s) > 500:
        print(f"\n--- Script {i} (length: {len(s)}) ---")
        # search for 700806 or 701086 or episodes inside script
        matches = re.findall(r'70\d{6}', s)
        unique_matches = sorted(set(matches))
        print(f"  Found {len(unique_matches)} 70xxxxxx IDs: {unique_matches[:30]}")

