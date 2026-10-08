import re, json

with open('scratch/netflix_office_tr.html', 'r', encoding='utf-8') as f:
    html = f.read()

# Look for react state or __NEXT_DATA__ or netflix JSON
m = re.findall(r'netflix\.falkorCache\s*=\s*(\{.*?\});', html)
if m:
    print("Found falkorCache, length:", len(m[0]))
    with open('scratch/falkor.json', 'w', encoding='utf-8') as f:
        f.write(m[0])

# Look for any occurrence of "The Job"
for match in re.finditer(r'The Job', html, re.IGNORECASE):
    pos = match.start()
    print("Found 'The Job' at", pos)
    print(repr(html[max(0, pos-150):min(len(html), pos+200)]))

# Look for "Beach Games"
for match in re.finditer(r'Beach Games', html, re.IGNORECASE):
    pos = match.start()
    print("Found 'Beach Games' at", pos)
    print(repr(html[max(0, pos-150):min(len(html), pos+200)]))
