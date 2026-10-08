const fs = require('fs');

const originalBrokenCode = fs.readFileSync('src/data/sitcomsData.js', 'utf8');

// 1. Extract PLATFORMS_CONFIG
const platformsStart = originalBrokenCode.indexOf('export const PLATFORMS_CONFIG = {');
const platformsEnd = originalBrokenCode.indexOf('};', platformsStart) + 2;
const platformsConfigStr = originalBrokenCode.substring(platformsStart, platformsEnd);

// 2. Extract DEFAULT_PRESETS
const presetsStart = originalBrokenCode.indexOf('export const DEFAULT_PRESETS = [');
const presetsEnd = originalBrokenCode.indexOf('];', presetsStart) + 2;
const presetsStr = originalBrokenCode.substring(presetsStart, presetsEnd);

// 3. Read extracted DB
const db = JSON.parse(fs.readFileSync('tools/datasets/extracted_db.json', 'utf8'));

// 4. Generate final JS
const finalCode = `// Comprehensive Sitcom Database for SitcomShuffle\n\n${platformsConfigStr}\n\nexport const SITCOMS_DATABASE = ${JSON.stringify(db, null, 2)};\n\n// Default presets for quick user selection\n${presetsStr}\n`;

fs.writeFileSync('src/data/sitcomsData.js', finalCode);
console.log('Rebuilt sitcomsData.js successfully with all show links intact!');
