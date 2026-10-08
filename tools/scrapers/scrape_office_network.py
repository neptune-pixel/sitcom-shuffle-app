from playwright.sync_api import sync_playwright
import time
import json
import re

json_responses = []

def handle_response(response):
    try:
        if "application/json" in response.headers.get("content-type", ""):
            body = response.json()
            json_responses.append(body)
    except Exception:
        pass

def scrape_office():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        page.on("response", handle_response)
        
        print("Navigating to Netflix The Office page...")
        page.goto("https://www.netflix.com/tr/title/70136120", wait_until="networkidle", timeout=60000)
        
        season_select = page.query_selector("select")
        if season_select:
            # Select Season 3
            print("Selecting Season 3 (70054868)...")
            season_select.select_option("70054868")
            time.sleep(4)
            
            # Select Season 4
            print("Selecting Season 4 (70070301)...")
            season_select.select_option("70070301")
            time.sleep(4)
            
        print(f"Captured {len(json_responses)} JSON network responses")
        
        with open(r'C:\Users\afkav\.gemini\antigravity\scratch\sitcom-shuffle-app\scratch\office_network_responses.json', 'w', encoding='utf-8') as f:
            json.dump(json_responses, f, indent=2)
            
        # Also inspect page DOM for episode cards / text / data attributes
        content = page.content()
        with open(r'C:\Users\afkav\.gemini\antigravity\scratch\sitcom-shuffle-app\scratch\office_season_page.html', 'w', encoding='utf-8') as f:
            f.write(content)

        browser.close()

if __name__ == "__main__":
    scrape_office()
