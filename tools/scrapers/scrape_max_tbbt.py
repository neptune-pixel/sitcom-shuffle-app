from playwright.sync_api import sync_playwright
import time
import json
import re

json_responses = []

def handle_response(response):
    try:
        url = response.url
        if "graphql" in url or "api" in url or "content" in url or "page" in url or "max.com" in url:
            if "json" in response.headers.get("content-type", ""):
                body = response.json()
                json_responses.append({"url": url, "body": body})
    except Exception:
        pass

def scrape_tbbt():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(user_agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36")
        page = context.new_page()
        page.on("response", handle_response)
        
        print("Navigating to HBO Max TBBT page...")
        page.goto("https://play.max.com/show/da61aef2-e4b6-441a-b2aa-91855ca05dad", wait_until="domcontentloaded", timeout=40000)
        time.sleep(4)
        
        content = page.content()
        with open(r'C:\Users\afkav\.gemini\antigravity\scratch\sitcom-shuffle-app\scratch\tbbt_max_page.html', 'w', encoding='utf-8') as f:
            f.write(content)
            
        print(f"Page content saved ({len(content)} bytes)")
        print(f"Captured {len(json_responses)} JSON responses")
        
        with open(r'C:\Users\afkav\.gemini\antigravity\scratch\sitcom-shuffle-app\scratch\tbbt_max_network.json', 'w', encoding='utf-8') as f:
            json.dump(json_responses, f, indent=2)

        # Check links in page
        links = page.query_selector_all("a[href]")
        hrefs = set()
        for link in links:
            h = link.get_attribute("href")
            if h and ("/video/" in h or "/episode/" in h or "/watch" in h or "video" in h):
                hrefs.add(h)
        print(f"Found {len(hrefs)} episode/video hrefs in DOM:")
        for h in sorted(hrefs):
            print("  ", h)

        browser.close()

if __name__ == "__main__":
    scrape_tbbt()
