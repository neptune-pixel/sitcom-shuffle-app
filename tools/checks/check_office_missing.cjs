const fs = require('fs');

const content = fs.readFileSync('C:/Users/afkav/.gemini/antigravity/scratch/sitcom-shuffle-app/src/data/sitcomsData.js', 'utf8');

const officeStartIndex = content.indexOf("id: 'office'");
const b99StartIndex = content.indexOf("id: 'b99'");
const officeStr = content.substring(officeStartIndex, b99StartIndex);

// Extract episodeWatchIds
const watchIdsMatch = officeStr.match(/episodeWatchIds:\s*\{([\s\S]*?)\n\s*\}/);
const watchIds = {};
if (watchIdsMatch) {
  const lines = watchIdsMatch[1].split('\n');
  lines.forEach(l => {
    const parts = l.split(':');
    if (parts.length === 2) {
      const key = parts[0].trim().replace(/['"]/g, '');
      const val = parts[1].trim().replace(/['",]/g, '');
      if (key && val) watchIds[key] = val;
    }
  });
}

const seasons = [
  { season: 1, episodeCount: 6 },
  { season: 2, episodeCount: 22 },
  { season: 3, episodeCount: 25 },
  { season: 4, episodeCount: 19 },
  { season: 5, episodeCount: 28 },
  { season: 6, episodeCount: 26 },
  { season: 7, episodeCount: 26 },
  { season: 8, episodeCount: 24 },
  { season: 9, episodeCount: 25 }
];

let totalEpisodes = 0;
const missing = [];
const present = [];

seasons.forEach(s => {
  for (let e = 1; e <= s.episodeCount; e++) {
    totalEpisodes++;
    const code = `S${String(s.season).padStart(2, '0')}E${String(e).padStart(2, '0')}`;
    if (watchIds[code]) {
      present.push({ code, watchId: watchIds[code] });
    } else {
      missing.push({ code, season: s.season, episode: e });
    }
  }
});

console.log(`Total episodes across 9 seasons: ${totalEpisodes}`);
console.log(`Present mapped watch IDs: ${present.length}`);
console.log(`Missing watch IDs: ${missing.length}\n`);

console.log('Missing episodes list by Season:');
const bySeason = {};
missing.forEach(m => {
  if (!bySeason[m.season]) bySeason[m.season] = [];
  bySeason[m.season].push(m.code);
});

Object.keys(bySeason).forEach(season => {
  console.log(`Season ${season}: (${bySeason[season].length} missing) -> ${bySeason[season].join(', ')}`);
});
