from playwright.sync_api import sync_playwright
import time
import re

def scrape_max_show_page():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=False, channel="chrome")
        context = browser.new_context(
            user_agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
            viewport={'width': 1920, 'height': 1080}
        )
        page = context.new_page()
        
        print("Navigating to true TBBT show page...")
        page.goto("https://play.max.com/show/4800b25d-ef44-4a25-86e5-4a71a8e23958", wait_until="networkidle")
        
        print("Waiting 10s...")
        time.sleep(10)
        
        # Click Accept All Cookies if present
        try:
            page.click("button:has-text('ACCEPT ALL')", timeout=3000)
            print("Clicked Accept Cookies")
            time.sleep(3)
        except Exception as e:
            print("No cookie banner or couldn't click:", e)
        
        page.screenshot(path="max_tbbt_show.png")
        with open("max_tbbt_show.html", "w", encoding="utf-8") as f:
            f.write(page.content())
            
        print("Saved max_tbbt_show.png and html.")
        browser.close()

if __name__ == "__main__":
    scrape_max_show_page()
