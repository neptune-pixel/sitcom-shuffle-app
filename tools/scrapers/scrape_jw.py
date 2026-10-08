from playwright.sync_api import sync_playwright
import time
import json

def scrape_jw():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(user_agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0 Safari/537.36")
        page = context.new_page()
        
        print("Navigating to JustWatch TBBT Season 1...")
        page.goto("https://www.justwatch.com/us/tv-show/the-big-bang-theory/season-1")
        time.sleep(5)
        
        # Get all episode elements or links
        links = page.query_selector_all("a[href]")
        hrefs = set()
        for link in links:
            h = link.get_attribute("href")
            if h and "max" in h:
                hrefs.add(h)
        print("Found MAX links on JustWatch S1:")
        for h in hrefs:
            print(h)
            
        browser.close()

if __name__ == "__main__":
    scrape_jw()
