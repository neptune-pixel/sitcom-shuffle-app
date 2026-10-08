const fs = require('fs');
const code = fs.readFileSync('dist/assets/index-C6zhD7eQ.js', 'utf8');
const idx = code.indexOf('S12E24');
if (idx > -1) {
  console.log(code.substring(idx - 100, idx + 200));
} else {
  console.log('not found');
}
