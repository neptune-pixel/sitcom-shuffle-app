import json

with open(r'tools/datasets/all_episodes_perfect.json', 'r', encoding='utf-8') as f:
    titles_map = json.load(f)

js_content = f"// Comprehensive official episode titles map for all 8 sitcoms\n\nexport const EPISODE_TITLES_MAP = {json.dumps(titles_map, indent=2, ensure_ascii=False)};\n"

with open(r'C:\Users\afkav\.gemini\antigravity\scratch\sitcom-shuffle-app\src\data\episodeTitles.js', 'w', encoding='utf-8') as f:
    f.write(js_content)

print("Successfully created src/data/episodeTitles.js!")
