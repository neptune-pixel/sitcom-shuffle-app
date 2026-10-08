import urllib.request
import urllib.parse
import json

# SPARQL query to find all episodes of TV series Q23831 (The Office US)
sparql = """
SELECT ?ep ?epLabel ?seasonNum ?epNum ?netflixId WHERE {
  ?ep wdt:P31 wd:Q21191270 . # TV series episode
  ?ep wdt:P179 wd:Q23831 .    # part of series The Office
  OPTIONAL { ?ep wdt:P4908 ?season . ?season wdt:P6349 ?seasonNum . }
  OPTIONAL { ?ep wdt:P470 ?epNum . }
  OPTIONAL { ?ep wdt:P1874 ?netflixId . }
  SERVICE wikibase:label { bd:serviceParam wikibase:language "en". }
}
ORDER BY ?seasonNum ?epNum
"""

url = "https://query.wikidata.org/sparql?query=" + urllib.parse.quote(sparql) + "&format=json"
req = urllib.request.Request(url, headers={"User-Agent": "SitcomShuffle/1.0 (contact@example.com)"})

try:
    with urllib.request.urlopen(req) as resp:
        data = json.loads(resp.read().decode('utf-8'))
        bindings = data.get('results', {}).get('bindings', [])
        print(f"Total episodes found in Wikidata: {len(bindings)}")
        
        episodes = []
        for b in bindings:
            title = b.get('epLabel', {}).get('value')
            s = b.get('seasonNum', {}).get('value')
            e = b.get('epNum', {}).get('value')
            nid = b.get('netflixId', {}).get('value')
            episodes.append({'title': title, 'season': s, 'episode': e, 'netflixId': nid})
            if nid:
                print(f"  S{s}E{e}: {title} -> {nid}")
                
        with open(r'tools/datasets/wikidata_office_episodes.json', 'w', encoding='utf-8') as f:
            json.dump(episodes, f, indent=2)
except Exception as err:
    print("Error:", err)
