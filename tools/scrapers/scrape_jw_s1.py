from playwright.sync_api import sync_playwright
import time
import requests

def scrape_jw_redirect():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(user_agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0 Safari/537.36")
        page = context.new_page()
        
        print("Navigating to JustWatch S1 E1...")
        # Actually JustWatch page lists all episodes in the season.
        page.goto("https://www.justwatch.com/us/tv-show/the-big-bang-theory/season-1")
        time.sleep(5)
        
        html = page.content()
        with open("jw_s1.html", "w", encoding="utf-8") as f:
            f.write(html)
        print("Saved jw_s1.html")
        
        browser.close()

if __name__ == "__main__":
    scrape_jw_redirect()
