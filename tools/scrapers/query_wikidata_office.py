import urllib.request
import urllib.parse
import json

sparql_query = """
SELECT ?seasonNum ?epNum ?epLabel ?netflixId WHERE {
  ?show rdfs:label "The Office"@en .
  ?show wdt:P31 wd:Q5398426 . # TV series
  ?ep wdt:P179 ?show .
  ?ep wdt:P4908 ?season .
  ?season wdt:P6349 ?seasonNum .
  ?ep wdt:P4908 ?season .
  ?ep wdt:P470 ?epNum .
  OPTIONAL { ?ep wdt:P1874 ?netflixId . }
  SERVICE wikibase:label { bd:serviceParam wikibase:language "en". }
}
ORDER BY ?seasonNum ?epNum
"""

# Simpler Wikidata query for The Office (Q23831) episodes and Netflix ID
sparql_query_2 = """
SELECT ?season ?episode ?epLabel ?netflixId WHERE {
  ?ep wdt:P361 wd:Q23831 . # part of The Office
  OPTIONAL { ?ep wdt:P4908 ?seasonItem . ?seasonItem wdt:P6349 ?season . }
  OPTIONAL { ?ep wdt:P470 ?episode . }
  OPTIONAL { ?ep wdt:P1874 ?netflixId . }
  SERVICE wikibase:label { bd:serviceParam wikibase:language "en". }
}
"""

url = "https://query.wikidata.org/sparql?query=" + urllib.parse.quote(sparql_query_2) + "&format=json"
req = urllib.request.Request(url, headers={"User-Agent": "SitcomShuffleBot/1.0"})

try:
    with urllib.request.urlopen(req) as resp:
        data = json.loads(resp.read().decode('utf-8'))
        bindings = data.get('results', {}).get('bindings', [])
        print(f"Wikidata returned {len(bindings)} results:")
        results = []
        for b in bindings:
            s = b.get('season', {}).get('value')
            e = b.get('episode', {}).get('value')
            title = b.get('epLabel', {}).get('value')
            n_id = b.get('netflixId', {}).get('value')
            if n_id or s or title:
                results.append({"season": s, "episode": e, "title": title, "netflixId": n_id})
                print(f"  S{s}E{e}: {title} -> Netflix ID: {n_id}")
                
        with open(r'tools/datasets/wikidata_office_results.json', 'w', encoding='utf-8') as f:
            json.dump(results, f, indent=2)
except Exception as e:
    print("Error:", e)
