import urllib.request
import json

url = "https://apis.justwatch.com/graphql"
headers = {
    "Content-Type": "application/json",
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)"
}

# JustWatch GraphQL query for The Office (US) seasons and episodes on Netflix
query = """
query GetShowEpisodes($id: ID!) {
  node(id: $id) {
    ... on Show {
      title
      seasons {
        seasonNumber
        episodes {
          episodeNumber
          title
          offers(country: "TR", platform: BROWSER) {
            standardWebURL
            package {
              clearName
              shortName
            }
          }
        }
      }
    }
  }
}
"""

# First search for The Office
search_query = """
query Search($query: String!) {
  popularTitles(country: "TR", filter: {query: $query}) {
    edges {
      node {
        id
        title
        objectType
      }
    }
  }
}
"""

def make_gql(q, vars=None):
    data = json.dumps({"query": q, "variables": vars or {}}).encode('utf-8')
    req = urllib.request.Request(url, data=data, headers=headers)
    with urllib.request.urlopen(req) as resp:
        return json.loads(resp.read().decode('utf-8'))

res = make_gql(search_query, {"query": "The Office"})
print("Search results:", json.dumps(res, indent=2))

# Find show ID
show_id = None
for edge in res.get('data', {}).get('popularTitles', {}).get('edges', []):
    node = edge['node']
    if node['objectType'] == 'SHOW' and 'Office' in node['title']:
        show_id = node['id']
        print(f"Found Show: {node['title']} -> {show_id}")
        break

if show_id:
    ep_res = make_gql(query, {"id": show_id})
    with open(r'C:\Users\afkav\.gemini\antigravity\scratch\sitcom-shuffle-app\scratch\justwatch_office_seasons.json', 'w', encoding='utf-8') as f:
        json.dump(ep_res, f, indent=2)
    print("Saved justwatch_office_seasons.json!")
