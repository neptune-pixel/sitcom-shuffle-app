const fs = require('fs');

async function main() {
  const current = await import('src/data/episodeTitles.js');
  const map = { ...current.EPISODE_TITLES_MAP };

  // 1. Alias modern-family and parks-and-rec
  if (map.modern_family && !map['modern-family']) {
    map['modern-family'] = map.modern_family;
    console.log('Mapped modern-family -> modern_family (' + Object.keys(map['modern-family']).length + ' eps)');
  }
  if (map.parks && !map['parks-and-rec']) {
    map['parks-and-rec'] = map.parks;
    console.log('Mapped parks-and-rec -> parks (' + Object.keys(map['parks-and-rec']).length + ' eps)');
  }

  // 2. Fetch missing shows from TVMaze
  const extraShows = {
    seinfeld: 530,
    iasip: 347,
    'rick-and-morty': 216,
    'new-girl': 58
  };

  for (const [key, tvmazeId] of Object.entries(extraShows)) {
    if (!map[key]) {
      try {
        const res = await fetch(`https://api.tvmaze.com/shows/${tvmazeId}/episodes`);
        const eps = await res.json();
        const epMap = {};
        for (const ep of eps) {
          const sStr = String(ep.season).padStart(2, '0');
          const eStr = String(ep.number).padStart(2, '0');
          const code = `S${sStr}E${eStr}`;
          epMap[code] = ep.name;
        }
        map[key] = epMap;
        console.log(`Fetched and mapped ${key}: ${Object.keys(epMap).length} episodes`);
      } catch (err) {
        console.error(`Error fetching ${key}:`, err.message);
      }
    }
  }

  // 3. Write back to src/data/episodeTitles.js
  const fileContent = `// Comprehensive official episode titles map for all sitcoms\n\nexport const EPISODE_TITLES_MAP = ${JSON.stringify(map, null, 2)};\n`;
  fs.writeFileSync('src/data/episodeTitles.js', fileContent, 'utf8');
  console.log('Successfully wrote updated src/data/episodeTitles.js');
}

main();
