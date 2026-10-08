import re

html = open('max_search.html', encoding='utf-8').read()
# match <a href="/show/...".*?aria-label="The Big Bang Theory"
matches = re.findall(r'<a[^>]*href="(/show/[a-zA-Z0-9-]+)"[^>]*aria-label="([^"]*)"', html, re.IGNORECASE)
for href, label in matches:
    print(f"Link: {href} | Label: {label}")
    
# Or match alt="The Big Bang Theory"
matches2 = re.findall(r'<a[^>]*href="(/show/[a-zA-Z0-9-]+)"[^>]*>.*?alt="([^"]*)"', html, re.IGNORECASE | re.DOTALL)
for href, label in matches2:
    print(f"Link: {href} | Alt: {label}")
