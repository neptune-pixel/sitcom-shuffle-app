import re, json

with open('src/data/sitcomsData.js', 'r', encoding='utf-8') as f:
    text = f.read()

matches = re.findall(r'id:\s*[\'"]([^\'"]+)[\'"]|["\']id["\']:\s*["\']([^"\']+)["\']', text)
ids = [m[0] or m[1] for m in matches]
print("All show IDs:", ids[:15])

# Also find titles
titles = re.findall(r'title:\s*[\'"]([^\'"]+)[\'"]|["\']title["\']:\s*["\']([^"\']+)["\']', text)
titles = [t[0] or t[1] for t in titles]
print("All titles:", titles[:15])

for i, t in zip(ids[:15], titles[:15]):
    print(f"{i} -> {t}")
