# SitcomShuffle

Personal app that shuffles episodes from several sitcoms (Netflix, Disney+, HBO Max, Prime Video) into one queue, plus a Chrome extension that skips intros and jumps to the next queued episode automatically.

## Run

```
npm install
npm run dev        # http://localhost:5173
npm run build      # production build into dist/
npm run zip:ext    # rebuild public/sitcom-shuffle-extension.zip from extension/ (Windows, uses PowerShell)
npm run lint
```

Load the extension: `chrome://extensions` → Developer mode → "Load unpacked" → pick the `extension` folder. After changing extension files, click reload on the extension card and refresh the app and streaming tabs.

## Folder layout

```
extension/            Chrome extension (Manifest V3)
  manifest.json         version lives here; the app reads it for display
  background.js         relays "episode finished" → app, opens next episode (streaming URLs only)
  content.js            runs on streaming sites: autoplay, skip intro, detect end of episode
  local_bridge.js       runs on the app page (localhost:3000/5173), bridges window ↔ extension
public/
  sitcom-shuffle-extension.zip   downloadable copy of extension/ (npm run zip:ext)
src/
  main.jsx, App.jsx     app state (rules, queue, watched list, custom links in localStorage)
  index.css             all styles
  components/           Header, PlaylistBuilder, PlayerView, QueueList
    modals/             Modal (shared shell) + AddShow, EditLink, SeasonFilter, ExtensionGuide
  services/
    shuffleEngine.js    queue generation and per-platform link resolution
    linkLearner.js      learns/fixes episode links from what the extension saw playing
  data/
    sitcomsData.js      shows, seasons, episode watch IDs, presets
    episodeTitles.js    episode titles per show id
tools/                dev-only, not part of the app
  zip-extension.cjs     used by npm run zip:ext
  scrapers/             one-off scripts that collected watch IDs and titles (Netflix, Disney+, Max, JustWatch, TVmaze, Wikidata)
  data-build/           scripts that wrote results into src/data
  checks/               one-off analysis / verification scripts
  datasets/             raw scraper output kept for re-scraping
```

## Episode links

`episodeWatchIds` in `sitcomsData.js` hold one link per episode for the show's default platform. Bare numbers are Netflix/Disney IDs, full URLs are used as-is. When a show is switched to another platform, links from the old platform are ignored and the app asks for a link instead. Links you paste in the app are stored per platform in localStorage and always win.

Shows without built-in links yet: Seinfeld, It's Always Sunny, Rick and Morty, New Girl. Missing single episodes: The Office S03E12, S03E13, S03E15 and Community S04E09 (removed because they duplicated another episode's ID).

Episodes a platform has removed go in `unavailableEpisodes` on the show, e.g. Community `"netflix": ["S02E14"]` (Advanced Dungeons & Dragons, pulled by Netflix in 2020). They are never picked on that platform, and the rest of the season is shown with the platform's numbering (Netflix calls the original S02E15 "S02E14"). Internally the original codes are kept, so titles, watch IDs, your pasted links and the watched list don't change.

### Links learned while watching

While an episode plays on Netflix, Disney+ or HBO Max, the extension reads the show name, season/episode label and episode title from the player and sends them with the page URL to the app (`src/services/linkLearner.js`). The app identifies the episode (by title first, then by the platform's episode number) and:

- saves the URL as a learned link when the episode had none, or had a different built-in one;
- switches off a built-in link that turned out to open a different episode;
- never changes links you pasted yourself.

Lookup order is: your pasted link > learned link > built-in watch ID. Learned links are stored in localStorage (`sitcom_shuffle_learned_links`) and listed in the extension guide window, which also has a reset button. Prime Video is not supported (its URLs don't identify the episode).

## Notes on tools/

The scripts were written as one-offs. Paths to `tools/datasets/` assume you run them from the project root; some still point to HTML dumps and screenshots that were deleted during cleanup, so expect to adjust paths before reusing one.

## Netflix default profile (extension 2.8)

Click the extension icon to open its popup and type (or pick from the suggestions) the Netflix profile to use. When SitcomShuffle opens Netflix after an episode on another platform and Netflix shows "Who's watching?", the extension clicks that profile and returns to the queued episode. The popup choice wins over the profile you last picked by hand. Suggestions are filled in the first time the picker is shown.

### Profile pick → reopen episode (extension 2.9/2.10)

Netflix leaves the tab on the show page after a profile is picked. When that happens during an auto-advance, the extension closes the tab and opens the queued episode link in a fresh tab (once per episode; it does not advance the queue). If the reopen is not possible it falls back to redirecting the same tab.

Since 2.10 it waits ~5 s after the profile pick (Netflix needs a moment to finish switching profiles), retries up to 3 times if the new tab lands on the show page again, and the popup has a "Recent activity" log for debugging.

Since 2.14: Netflix redirects a `/watch/<id>` link to the show page when the tab has not had a real user click (browser autoplay policy). That is why the same link works when you click it in the app, but not when the extension opens it, nor when you paste it into a tab you never clicked in. When a tab lands on the show page during an auto-advance, the extension uses the `debugger` permission to send one genuine mouse click to the tab's top-left corner (Chrome briefly shows "started debugging this browser") and then navigates the same tab to the episode again, up to 3 tries. Alternative without the extension click: allow autoplay in the browser (flag `#autoplay-policy` → "No user gesture is required").
