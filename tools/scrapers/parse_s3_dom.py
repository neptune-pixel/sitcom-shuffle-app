import re

with open('scratch/s3_dom.html', 'r', encoding='utf-8') as f:
    html = f.read()

# Find all episode sections in s3_dom.html
# e.g. titlecard, episode title, watch/
matches = re.findall(r'(?:title|watch)/(\d{8})', html)
print("All /title/ or /watch/ 8-digit IDs:")
for m in sorted(set(matches)):
    # Find context around m
    idx = html.find(m)
    print(m, "context:", repr(html[max(0, idx-40):min(len(html), idx+80)]))
