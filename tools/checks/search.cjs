const fs = require('fs');
fetch('https://html.duckduckgo.com/html/?q=site:play.max.com+"The+Big+Bang+Theory"', {headers:{'User-Agent':'Mozilla/5.0'}})
  .then(r=>r.text())
  .then(t => {
    const regex = /play\.max\.com\/show\/([a-zA-Z0-9-]+)/g;
    const matches = t.match(regex);
    console.log("Matches:", matches ? [...new Set(matches)] : "None");
  });
