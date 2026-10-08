import urllib.request
import json

url = "https://apis.justwatch.com/graphql"
headers = {
    "Content-Type": "application/json",
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
}

# JustWatch GraphQL search query
search_gql = """
query GetShow($id: ID!) {
  node(id: $id) {
    ... on Show {
      id
      title
      seasons {
        seasonNumber
        episodes {
          episodeNumber
          title
          offers(country: "US", platform: BROWSER) {
            standardWebURL
            package {
              shortName
              clearName
            }
          }
        }
      }
    }
  }
}
"""

def make_gql(show_id):
    body = json.dumps({"query": search_gql, "variables": {"id": show_id}}).encode('utf-8')
    req = urllib.request.Request(url, data=body, headers=headers)
    try:
        with urllib.request.urlopen(req) as resp:
            return json.loads(resp.read().decode('utf-8'))
    except Exception as e:
        print("Error:", e)
        return None

# Show ID for The Big Bang Theory on JustWatch (ts3482 or similar)
# Let's search first
search_query = """
query SearchTitle($query: String!) {
  popularTitles(country: "US", filter: {query: $query}) {
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

def search_title(name):
    body = json.dumps({"query": search_query, "variables": {"query": name}}).encode('utf-8')
    req = urllib.request.Request(url, data=body, headers=headers)
    with urllib.request.urlopen(req) as resp:
        return json.loads(resp.read().decode('utf-8'))

res = search_title("The Big Bang Theory")
print("Search results:", json.dumps(res, indent=2))

show_node_id = None
for edge in res.get('data', {}).get('popularTitles', {}).get('edges', []):
    n = edge['node']
    if n['objectType'] == 'SHOW' and 'Big Bang' in n['title']:
        show_node_id = n['id']
        print(f"Found TBBT Show ID: {show_node_id}")
        break

if show_node_id:
    details = make_gql(show_node_id)
    with open(r'C:\Users\afkav\.gemini\antigravity\scratch\sitcom-shuffle-app\scratch\justwatch_tbbt_details.json', 'w', encoding='utf-8') as f:
        json.dump(details, f, indent=2)
    print("Saved justwatch_tbbt_details.json!")
