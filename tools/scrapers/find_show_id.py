from playwright.sync_api import sync_playwright
import time
import re

def search_max():
    with sync_playwright() as p:
        print("Launching visible Chrome...")
        browser = p.chromium.launch(headless=False, channel="chrome")
        context = browser.new_context(
            user_agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
            viewport={'width': 1920, 'height': 1080}
        )
        page = context.new_page()
        
        # Navigate to DDG or JustWatch
        print("Searching JustWatch for TBBT Max...")
        page.goto("https://www.justwatch.com/us/tv-show/the-big-bang-theory", wait_until="networkidle")
        time.sleep(5)
        
        html = page.content()
        links = set(re.findall(r'play\.max\.com/show/[a-zA-Z0-9-]+', html))
        print("JustWatch links found:", links)
        
        if not links:
            # Let's try searching on max directly
            page.goto("https://play.max.com/search?q=big+bang+theory")
            time.sleep(10)
            page.screenshot(path="max_search.png")
            html = page.content()
            links = set(re.findall(r'/show/[a-zA-Z0-9-]+', html))
            print("Max search links found:", links)
            
        browser.close()

if __name__ == "__main__":
    search_max()
