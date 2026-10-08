const fs = require('fs');
const code = fs.readFileSync('dist/assets/index-C6zhD7eQ.js', 'utf8');
console.log('id:"office"', code.indexOf('id:"office"'));
console.log("id:'office'", code.indexOf("id:'office'"));
console.log('office', code.indexOf('office'));
