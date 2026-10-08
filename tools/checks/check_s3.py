import re

with open('scratch/s3_dom.html', 'r', encoding='utf-8') as f:
    text = f.read()

matches = re.findall(r'70080\d{3}|70069\d{3}|70108\d{3}|70136120', text)
print('Matches found:', len(matches))
print('Unique matches:', sorted(set(matches)))

# Look for titles or episode numbers
episodes = re.findall(r'<h3[^>]*>([^<]+)</h3>|data-uia="episode-title"[^>]*>([^<]+)<|class="episode-title"[^>]*>([^<]+)<', text)
print('Episodes found:', len(episodes))

# Also search for 'The Job'
pos = text.find('The Job')
if pos != -1:
    print('Found "The Job" at:', pos)
    print(text[pos-200:pos+300])
else:
    print('"The Job" not found in s3_dom.html')
