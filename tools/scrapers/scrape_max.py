from playwright.sync_api import sync_playwright
import time

def scrape_max():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(user_agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36")
        page = context.new_page()
        
        print("Navigating to Max show page...")
        page.goto("https://play.max.com/show/da61aef2-e4b6-441a-b2aa-91855ca05dad", wait_until="domcontentloaded")
        
        time.sleep(5)
        
        # Take a screenshot to see what it looks like
        page.screenshot(path="max_page.png")
        
        # Get html
        html = page.content()
        with open("max_page.html", "w", encoding="utf-8") as f:
            f.write(html)
            
        print("Done. Saved max_page.png and max_page.html")
        browser.close()

if __name__ == "__main__":
    scrape_max()
