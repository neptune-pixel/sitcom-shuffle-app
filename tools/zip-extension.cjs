const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// This script lives in tools/, so the project root is one level up
const projectRoot = path.join(__dirname, '..');
const extDir = path.join(projectRoot, 'extension');
const publicZip = path.join(projectRoot, 'public', 'sitcom-shuffle-extension.zip');

if (!fs.existsSync(path.join(extDir, 'manifest.json'))) {
  console.error('Extension folder not found at', extDir);
  process.exit(1);
}

try {
  // Use powershell Compress-Archive on Windows
  if (fs.existsSync(publicZip)) {
    fs.unlinkSync(publicZip);
  }
  execSync(`powershell -Command "Compress-Archive -Path '${extDir}\\*' -DestinationPath '${publicZip}' -Force"`);
  console.log('Successfully updated public/sitcom-shuffle-extension.zip');
} catch (e) {
  console.error('Zip creation failed:', e.message);
  process.exit(1);
}
