import re

with open(r'C:\Users\afkav\.gemini\antigravity\scratch\sitcom-shuffle-app\src\data\sitcomsData.js', 'r', encoding='utf-8') as f:
    content = f.read()

# Missing IDs to add to office episodeWatchIds
missing_ids = {
    # Season 3 missing (S03E11 to S03E25)
    'S03E11': '70080626',
    'S03E12': '70080636',
    'S03E13': '70080637',
    'S03E14': '70080638',
    'S03E15': '70080639',
    'S03E16': '70080640',
    'S03E17': '70080641',
    'S03E18': '70080642',
    'S03E19': '70080643',
    'S03E20': '70080644',
    'S03E21': '70080645',
    'S03E22': '70080646',
    'S03E23': '70080647',
    'S03E24': '70080648',
    'S03E25': '70080649',

    # Season 4 missing (S04E11, S04E12, S04E14 to S04E19)
    'S04E11': '70108697',
    'S04E12': '70108698',
    'S04E14': '70108700',
    'S04E15': '70108701',
    'S04E16': '70108702',
    'S04E17': '70108703',
    'S04E18': '70108704',
    'S04E19': '70108705'
}

# Locate episodeWatchIds block for office
office_start = content.find("id: 'office'")
b99_start = content.find("id: 'b99'")
office_text = content[office_start:b99_start]

watch_ids_match = re.search(r'episodeWatchIds:\s*\{([\s\S]*?)\n\s*\}', office_text)

if watch_ids_match:
    old_block = watch_ids_match.group(1)
    
    # Check what's inside old_block and insert missing keys in alphabetical/numerical order
    lines = [l for l in old_block.splitlines() if l.strip()]
    
    # Build dictionary of existing entries
    existing_map = {}
    for l in lines:
        if ':' in l:
            parts = l.split(':')
            k = parts[0].strip().strip("'\"")
            v = parts[1].strip().strip("',\"")
            if k and v:
                existing_map[k] = v
                
    # Combine existing with missing (NOT overwriting any existing key!)
    for k, v in missing_ids.items():
        if k not in existing_map:
            existing_map[k] = v
            
    # Format new episodeWatchIds block sorted by key
    new_lines = []
    sorted_keys = sorted(existing_map.keys())
    for i, k in enumerate(sorted_keys):
        comma = ',' if i < len(sorted_keys) - 1 else ''
        new_lines.append(f"      '{k}': '{existing_map[k]}'{comma}")
        
    new_block = "\n" + "\n".join(new_lines) + "\n    "
    
    # Replace in office_text
    new_office_text = office_text.replace(old_block, new_block)
    
    # Replace in full content
    new_content = content[:office_start] + new_office_text + content[b99_start:]
    
    with open(r'C:\Users\afkav\.gemini\antigravity\scratch\sitcom-shuffle-app\src\data\sitcomsData.js', 'w', encoding='utf-8') as f:
        f.write(new_content)
        
    print(f"Successfully added {len(missing_ids)} missing episodeWatchIds for The Office!")
else:
    print("Could not find episodeWatchIds block for office")
