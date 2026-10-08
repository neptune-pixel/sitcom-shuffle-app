from playwright.sync_api import sync_playwright
import time
import json
import re

def scrape_office():
    watch_ids = {}
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        print("Navigating to Netflix The Office...")
        page.goto("https://www.netflix.com/tr/title/70136120", wait_until="domcontentloaded", timeout=60000)
        time.sleep(3)
        
        # Check season dropdown
        selects = page.query_selector_all("select")
        print(f"Found {len(selects)} select elements")
        
        # Intercept network requests or check DOM
        # Let's inspect page HTML or select options
        season_select = page.query_selector("select[name='season-selector'], select.season-selector, select")
        if season_select:
            options = season_select.query_selector_all("option")
            print(f"Found {len(options)} season options:")
            for opt in options:
                val = opt.get_attribute("value")
                text = opt.inner_text()
                print(f"  Option: {text} -> {val}")
                
            # Select Season 3
            for opt in options:
                val = opt.get_attribute("value")
                text = opt.inner_text()
                if "3" in text or "Season 3" in text or "3. Sezon" in text:
                    print(f"Selecting Season 3 ({val})...")
                    season_select.select_option(val)
                    time.sleep(3)
                    
                    # Extract episode links
                    ep_cards = page.query_selector_all("a[href*='/watch/']")
                    print(f"Found {len(ep_cards)} watch links in S3:")
                    for card in ep_cards:
                        href = card.get_attribute("href")
                        title = card.inner_text()
                        print(f"  Link: {href} - {title}")
                        
        browser.close()

if __name__ == "__main__":
    scrape_office()
