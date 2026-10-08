from playwright.sync_api import sync_playwright
import time
import json
import re

json_responses = []

def handle_response(response):
    try:
        url = response.url
        if "graphql" in url or "api" in url or "shakti" in url or "pathEvaluator" in url:
            text = response.text()
            json_responses.append({"url": url, "body": text})
    except Exception:
        pass

def scrape_office():
    watch_ids_found = {}
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(user_agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36")
        page = context.new_page()
        page.on("response", handle_response)
        
        print("Navigating to Netflix The Office...")
        page.goto("https://www.netflix.com/tr/title/70136120", wait_until="domcontentloaded", timeout=30000)
        time.sleep(2)
        
        # Select Season 3
        select = page.query_selector("select")
        if select:
            print("Selecting Season 3...")
            select.select_option("70054868")
            time.sleep(3)
            
            # Save S3 DOM
            s3_html = page.content()
            with open(r'C:\Users\afkav\.gemini\antigravity\scratch\sitcom-shuffle-app\scratch\s3_dom.html', 'w', encoding='utf-8') as f:
                f.write(s3_html)
                
            # Select Season 4
            print("Selecting Season 4...")
            select.select_option("70070301")
            time.sleep(3)
            
            s4_html = page.content()
            with open(r'C:\Users\afkav\.gemini\antigravity\scratch\sitcom-shuffle-app\scratch\s4_dom.html', 'w', encoding='utf-8') as f:
                f.write(s4_html)

        browser.close()

if __name__ == "__main__":
    scrape_office()
