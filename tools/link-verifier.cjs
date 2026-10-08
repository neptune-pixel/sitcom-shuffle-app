const { chromium } = require('playwright-chromium');
const fs = require('fs');
const path = require('path');

// Target Netflix Show IDs (Examples)
// The Office: 70136120
// Community: 70155589
const SHOWS_TO_CHECK = [
  { id: 'the-office', netflixId: '70136120', name: 'The Office' },
  { id: 'community', netflixId: '70155589', name: 'Community' }
];

async function runVerifier() {
  console.log('🚀 Starting Automated Link Verification Bot...');
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/117.0.0.0 Safari/537.36'
  });

  const page = await context.newPage();
  const report = {};

  for (const show of SHOWS_TO_CHECK) {
    console.log(`\n📺 Checking [${show.name}] on Netflix...`);
    try {
      const url = `https://www.netflix.com/title/${show.netflixId}`;
      await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
      
      // Wait for episode list to render
      await page.waitForTimeout(3000);

      // Scrape the episode list
      const episodes = await page.evaluate(() => {
        const results = [];
        // Netflix public pages usually have .episode-title or similar elements.
        // If they use standard structural data, we can scrape it:
        const epNodes = document.querySelectorAll('.episode-title');
        
        epNodes.forEach(node => {
          results.push(node.innerText.trim());
        });

        // Also check if there's any JSON-LD data which Netflix often provides
        const jsonLdNodes = document.querySelectorAll('script[type="application/ld+json"]');
        let schemaEps = [];
        jsonLdNodes.forEach(node => {
          try {
            const data = JSON.parse(node.innerText);
            // Schema.org/TVSeries usually has an "episode" or "containsSeason" array
            if (data['@type'] === 'TVSeries' && data.containsSeason) {
              data.containsSeason.forEach(season => {
                if (season.episode) {
                  season.episode.forEach(ep => {
                    schemaEps.push({ season: season.seasonNumber, epNumber: ep.episodeNumber, name: ep.name });
                  });
                }
              });
            }
          } catch (e) {}
        });

        return { textTitles: results, schemaEps };
      });

      console.log(`  -> Found ${episodes.schemaEps.length} episodes via Schema Data.`);
      console.log(`  -> Found ${episodes.textTitles.length} episodes via DOM classes.`);
      
      report[show.id] = {
        totalFound: Math.max(episodes.schemaEps.length, episodes.textTitles.length),
        details: episodes.schemaEps.slice(0, 5) // Just showing sample of first 5
      };

    } catch (err) {
      console.log(`❌ Failed to scrape ${show.name}: ${err.message}`);
    }
  }

  await browser.close();

  console.log('\n✅ Verification Complete! Summary:');
  console.log(JSON.stringify(report, null, 2));
  
  console.log('\nIn the future, this bot will load src/data/sitcomsData.js, compare the counts, and automatically inject `unavailableEpisodes` shifts!');
}

runVerifier().catch(console.error);
