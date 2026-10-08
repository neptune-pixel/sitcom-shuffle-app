from playwright.sync_api import sync_playwright
import time
import json
import re

def scrape_max_visible():
    with sync_playwright() as p:
        print("Launching visible Chrome...")
        browser = p.chromium.launch(headless=False, channel="chrome")
        context = browser.new_context(
            user_agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
        )
        page = context.new_page()
        
        print("Navigating to Max TBBT page...")
        page.goto("https://play.max.com/show/da61aef2-e4b6-441a-b2aa-91855ca05dad", wait_until="domcontentloaded")
        
        print("Waiting 15 seconds to bypass any initial blocks or allow manual captcha...")
        time.sleep(15)
        
        # Check if we got blocked
        title = page.title()
        if "Access Denied" in title:
            print("Still blocked by Akamai.")
            browser.close()
            return
            
        print("Page loaded successfully! Extracting links...")
        
        # We need to extract episode links. On Max, season tabs usually need to be clicked.
        # But let's just see if we can get ANY video links first.
        html = page.content()
        links = set(re.findall(r'/video/watch/[a-zA-Z0-9-]+', html))
        print("Found links:", links)
        
        browser.close()

if __name__ == "__main__":
    scrape_max_visible()
