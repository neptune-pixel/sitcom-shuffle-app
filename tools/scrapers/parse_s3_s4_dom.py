import re

print("--- PARSING S3 DOM ---")
with open(r'C:\Users\afkav\.gemini\antigravity\scratch\sitcom-shuffle-app\scratch\s3_dom.html', 'r', encoding='utf-8') as f:
    s3_html = f.read()

# Look for watch IDs or title references in s3_html
s3_watch_ids = re.findall(r'/watch/(\d+)', s3_html)
print("S3 Watch IDs in DOM:", len(s3_watch_ids), set(s3_watch_ids))

# Search for episode cards/elements or JSON data in s3_html
ep_titles_s3 = ["Back from Vacation", "Traveling Salesmen", "The Return", "Ben Franklin", "Phyllis' Wedding", "Business School", "Cocktails", "The Negotiation", "Safety Training", "Product Recall", "Women's Appreciation", "Beach Games", "The Job"]

for t in ep_titles_s3:
    if t.lower() in s3_html.lower():
        idx = s3_html.lower().find(t.lower())
        snippet = s3_html[max(0, idx-150):min(len(s3_html), idx+250)]
        print(f"\nFOUND '{t}':\n  {snippet}")

print("\n--- PARSING S4 DOM ---")
with open(r'C:\Users\afkav\.gemini\antigravity\scratch\sitcom-shuffle-app\scratch\s4_dom.html', 'r', encoding='utf-8') as f:
    s4_html = f.read()

s4_watch_ids = re.findall(r'/watch/(\d+)', s4_html)
print("S4 Watch IDs in DOM:", len(s4_watch_ids), set(s4_watch_ids))

ep_titles_s4 = ["Night Out", "Did I Stutter", "Chair Model", "Local Ad", "Job Fair", "Goodbye, Toby"]
for t in ep_titles_s4:
    if t.lower() in s4_html.lower():
        idx = s4_html.lower().find(t.lower())
        snippet = s4_html[max(0, idx-150):min(len(s4_html), idx+250)]
        print(f"\nFOUND '{t}':\n  {snippet}")

