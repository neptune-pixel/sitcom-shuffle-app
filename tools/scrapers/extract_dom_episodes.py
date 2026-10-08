from bs4 import BeautifulSoup
import re

def parse_dom(file_path, label):
    print(f"\n=================== {label} ===================")
    with open(file_path, 'r', encoding='utf-8') as f:
        soup = BeautifulSoup(f.read(), 'html.parser')
    
    # Find all episode containers
    # usually div or li elements containing data-uia="episode-title"
    titles = soup.find_all(attrs={"data-uia": "episode-title"})
    print(f"Found {len(titles)} episode title elements in {label}")
    
    for t in titles:
        # find parent container
        parent = t.parent
        while parent and parent.name != 'body':
            if parent.find('a') or parent.get('data-uia') or parent.get('class'):
                # check if there's any anchor or watch ID
                a_tags = parent.find_all('a')
                if a_tags:
                    for a in a_tags:
                        print(f"  Title: {t.get_text()} -> Link: {a.get('href')}")
                    break
            parent = parent.parent
        else:
            print(f"  Title: {t.get_text()} (No anchor parent found)")

parse_dom(r'C:\Users\afkav\.gemini\antigravity\scratch\sitcom-shuffle-app\scratch\s3_dom.html', 'SEASON 3')
parse_dom(r'C:\Users\afkav\.gemini\antigravity\scratch\sitcom-shuffle-app\scratch\s4_dom.html', 'SEASON 4')
