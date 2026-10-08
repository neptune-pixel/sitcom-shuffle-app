const fs = require('fs');
const code = fs.readFileSync('dist/assets/index-C6zhD7eQ.js', 'utf8');
const idx = code.indexOf('office');
console.log(code.substring(idx - 50, idx + 200));
