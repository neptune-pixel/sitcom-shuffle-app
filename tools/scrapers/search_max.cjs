const fs = require('fs');
fetch('https://html.duckduckgo.com/html/?q=site:hbomax.com+The+Big+Bang+Theory', {headers:{'User-Agent':'Mozilla/5.0'}})
  .then(r=>r.text())
  .then(t => {
    fs.writeFileSync('ddg.html', t);
    console.log('saved ddg.html');
  });
