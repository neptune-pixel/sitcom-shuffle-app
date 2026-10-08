const fs = require('fs');
const code = fs.readFileSync('dist/assets/index-C6zhD7eQ.js', 'utf8');

const startStr = '[{id:`office`';
let startIdx = code.indexOf(startStr);
if (startIdx === -1) {
  console.log('not found');
  process.exit(1);
}

let openBrackets = 0;
let endIdx = -1;
for (let i = startIdx; i < code.length; i++) {
  if (code[i] === '[') openBrackets++;
  else if (code[i] === ']') {
    openBrackets--;
    if (openBrackets === 0) {
      endIdx = i;
      break;
    }
  }
}

if (endIdx !== -1) {
  let dbStr = code.substring(startIdx, endIdx + 1);
  
  try {
    const dbObj = eval(dbStr);
    const outStr = JSON.stringify(dbObj, null, 2);
    fs.writeFileSync('tools/datasets/extracted_db.json', outStr);
    console.log('Successfully extracted DB to JSON!');
  } catch(e) {
    console.log('Error evaluating:', e);
  }
} else {
  console.log('Could not find end of array');
}
