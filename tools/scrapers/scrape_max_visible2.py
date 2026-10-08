from playwright.sync_api import sync_playwright
import time
import re

def scrape_max_visible():
    with sync_playwright() as p:
        print("Launching visible Chrome...")
        browser = p.chromium.launch(headless=False, channel="chrome")
        context = browser.new_context(
            user_agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
            viewport={'width': 1920, 'height': 1080}
        )
        page = context.new_page()
        
        print("Navigating to Max TBBT page...")
        page.goto("https://play.max.com/show/da61aef2-e4b6-441a-b2aa-91855ca05dad", wait_until="networkidle")
        
        print("Waiting 10 seconds...")
        time.sleep(10)
        
        # Take a screenshot so I can see what the page looks like
        page.screenshot(path="max_page_loaded.png")
        
        # Dump HTML
        html = page.content()
        with open("max_page_loaded.html", "w", encoding="utf-8") as f:
            f.write(html)
            
        print("Done saving screenshot and html.")
        
        browser.close()

if __name__ == "__main__":
    scrape_max_visible()
