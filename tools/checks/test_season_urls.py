from playwright.sync_api import sync_playwright
import re

def test_season_urls():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        
        for s_num, sid in [(3, "70054868"), (4, "70070301")]:
            url = f"https://www.netflix.com/tr/title/{sid}"
            print(f"\nNavigating to S{s_num} page: {url}")
            page.goto(url, wait_until="domcontentloaded")
            content = page.content()
            episodes = re.findall(r'data-uia="episode-title"[^>]*>([^<]+)<', content)
            watch_ids = re.findall(r'/watch/(\d+)', content)
            print(f"Season {s_num} page loaded. Found {len(episodes)} episodes in DOM:")
            for ep in episodes:
                print(f"  - {ep}")
            print(f"Watch IDs in DOM: {set(watch_ids)}")
            
        browser.close()

if __name__ == "__main__":
    test_season_urls()
