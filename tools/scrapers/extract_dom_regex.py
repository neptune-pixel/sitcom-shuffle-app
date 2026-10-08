import re

def parse_html_regex(file_path, label):
    print(f"\n=================== {label} ===================")
    with open(file_path, 'r', encoding='utf-8') as f:
        html = f.read()
        
    # Find all data-uia="episode-title">...</div> or <p ...>
    episodes = re.findall(r'data-uia="episode-title"[^>]*>([^<]+)<', html)
    print(f"Found {len(episodes)} episodes:")
    for ep in episodes:
        print(f"  - {ep}")

parse_html_regex(r'C:\Users\afkav\.gemini\antigravity\scratch\sitcom-shuffle-app\scratch\s3_dom.html', 'SEASON 3')
parse_html_regex(r'C:\Users\afkav\.gemini\antigravity\scratch\sitcom-shuffle-app\scratch\s4_dom.html', 'SEASON 4')
