import re
import json

with open(r'C:\Users\afkav\.gemini\antigravity\scratch\sitcom-shuffle-app\scratch\office_page.html', 'r', encoding='utf-8') as f:
    html = f.read()

# Look for script tags containing react context or build id or initial state
scripts = re.findall(r'<script[^>]*>(.*?)</script>', html, re.DOTALL)
print(f"Total script tags found: {len(scripts)}")

for i, s in enumerate(scripts):
    if "episode" in s.lower() or "season" in s.lower() or "titleId" in s or "70136120" in s:
        print(f"\n--- Script {i} (len: {len(s)}) ---")
        print(s[:300])

# Also search for episode numbers like S3 or S4 or titles like "Back from Vacation", "Traveling Salesmen", "Chair Model"
titles_to_check = ["Back from Vacation", "Traveling Salesmen", "The Return", "Ben Franklin", "Chair Model", "Did I Stutter"]
for t in titles_to_check:
    if t.lower() in html.lower():
        print(f"FOUND title in HTML: {t}")
        # print snippet around it
        idx = html.lower().find(t.lower())
        print("  Snippet:", html[max(0, idx-100):min(len(html), idx+200)])
