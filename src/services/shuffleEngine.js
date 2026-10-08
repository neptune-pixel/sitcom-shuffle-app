import { SITCOMS_DATABASE, PLATFORMS_CONFIG } from '../data/sitcomsData';
import { EPISODE_TITLES_MAP } from '../data/episodeTitles';

// Helper to get show by ID
export function getShowById(id) {
  return SITCOMS_DATABASE.find(show => show.id === id);
}

// Detect which platform a stored link/ID belongs to.
// Full URLs are identified by host; bare IDs belong to the show's default (data-source) platform.
export function detectLinkPlatform(link, fallbackPlatform) {
  if (!link) return null;
  const value = String(link);
  if (!value.startsWith('http')) return fallbackPlatform;
  if (/netflix\.com/i.test(value)) return 'netflix';
  if (/disneyplus\.com/i.test(value)) return 'disney';
  if (/(^|\.|\/)(hbo)?max\.com/i.test(value)) return 'max';
  if (/primevideo\.com|amazon\.[a-z.]+\/gp\/video/i.test(value)) return 'prime';
  return null; // unknown host: accept for any platform (user-supplied)
}

function buildUrlFromId(id, platformId) {
  if (id.startsWith('http')) return id;
  if (platformId === 'netflix') return `https://www.netflix.com/watch/${id}`;
  if (platformId === 'disney') return `https://www.disneyplus.com/play/${id}`;
  return null; // bare IDs for Max/Prime can't be turned into a playable URL
}

// Resolve the playable link for one episode on the chosen platform.
// Links that belong to a different platform are ignored, so switching platform never builds a wrong URL.
// Priority: link the user pasted > link learned from real playback (key "learned:...") >
// built-in watch ID, unless that built-in link was proven to open another episode (key "bad:...").
// linkSource tells which one won: 'custom' | 'learned' | 'builtin' | null.
export function resolveEpisodeLink(show, platformId, episodeCode, customLinks = {}) {
  const matches = (link) => {
    const linkPlatform = detectLinkPlatform(link, show.platform);
    return linkPlatform === null || linkPlatform === platformId;
  };

  // 1. User-entered link for this platform + episode (always trusted)
  const platformKey = `${show.id}_${platformId}_${episodeCode}`;
  if (customLinks[platformKey]) {
    return { watchUrl: customLinks[platformKey], hasExactEpisodeLink: true, linkSource: 'custom' };
  }

  // 2. Legacy platform-less custom link, only if it points to the chosen platform
  const legacyKey = `${show.id}_${episodeCode}`;
  if (customLinks[legacyKey] && matches(customLinks[legacyKey])) {
    return { watchUrl: customLinks[legacyKey], hasExactEpisodeLink: true, linkSource: 'custom' };
  }

  // 3. Link learned by the extension from what actually played
  const learnedUrl = customLinks[`learned:${show.id}_${platformId}_${episodeCode}`];
  if (learnedUrl) {
    return { watchUrl: learnedUrl, hasExactEpisodeLink: true, linkSource: 'learned' };
  }

  // 4. Built-in watch ID from the database, only if it belongs to the chosen platform
  //    and playback hasn't shown that it opens a different episode
  const exactId = show.episodeWatchIds?.[episodeCode];
  if (exactId && matches(exactId)) {
    const url = buildUrlFromId(String(exactId), platformId);
    const provenWrong = customLinks[`bad:${show.id}_${platformId}_${episodeCode}`] === url;
    if (url && !provenWrong) return { watchUrl: url, hasExactEpisodeLink: true, linkSource: 'builtin' };
  }

  // 5. No fallback to the title page: leave it empty so the UI asks for a link
  return { watchUrl: null, hasExactEpisodeLink: false, linkSource: null };
}

// Resolve the show's page on the chosen platform. It is only a helper for finding missing
// episode links: it is never used as a playback URL.
// Priority: user's show link for this platform > legacy show link (same platform) > built-in link.
// isSpecific is false when the link is just the platform's homepage.
export function resolveShowPage(show, platformId, customLinks = {}) {
  const belongsToPlatform = (link) => {
    const linkPlatform = detectLinkPlatform(link, show.platform);
    return linkPlatform === null || linkPlatform === platformId;
  };
  const candidates = [
    customLinks[`${show.id}_${platformId}`],
    belongsToPlatform(customLinks[show.id]) ? customLinks[show.id] : null,
    belongsToPlatform(show.directPlatformLinks?.[platformId]) ? show.directPlatformLinks?.[platformId] : null
  ];
  const url = candidates.find(link => typeof link === 'string' && link.startsWith('http')) || null;
  if (!url) return { showPageUrl: null, showPageIsSpecific: false };

  let isSpecific = true;
  try {
    const parsed = new URL(url);
    isSpecific = parsed.pathname.replace(/\/+$/, '') !== '';
  } catch {
    isSpecific = false;
  }
  return { showPageUrl: url, showPageIsSpecific: isSpecific };
}

// Re-resolve links/platform info for queue items without reshuffling
// (used after the user saves a link or switches a show's platform).
export function refreshQueueLinks(queue, rules, customLinks = {}) {
  return queue.map(item => {
    const show = getShowById(item.showId);
    if (!show) return item;
    const rule = rules.find(r => r.showId === item.showId);
    const platformId = (rule?.platform && PLATFORMS_CONFIG[rule.platform]) ? rule.platform : show.platform;
    const platformConfig = PLATFORMS_CONFIG[platformId] || PLATFORMS_CONFIG.netflix;
    const { watchUrl, hasExactEpisodeLink } = resolveEpisodeLink(show, platformConfig.id, item.episodeCode, customLinks);
    const { displayEpisode, displayCode } = getPlatformNumbering(show, platformConfig.id, item.season, item.episode);
    return {
      ...item,
      displayEpisode,
      displayCode,
      ...resolveShowPage(show, platformConfig.id, customLinks),
      platform: platformConfig.id,
      platformName: platformConfig.name,
      platformColor: platformConfig.color,
      watchUrl,
      hasExactEpisodeLink
    };
  });
}

// Episodes a platform removed (e.g. Community S02E14 on Netflix). They are never picked on that
// platform, and the platform renumbers the rest of the season, so later episodes are shown with
// the platform's number (displayEpisode / displayCode). Internally episodeCode keeps the original
// numbering, because titles, watch IDs, custom links and the watched list are keyed by it.
export function getPlatformNumbering(show, platformId, season, episode) {
  const removed = show.unavailableEpisodes?.[platformId] || [];
  const episodeCode = `S${String(season).padStart(2, '0')}E${String(episode).padStart(2, '0')}`;
  const removedBefore = removed.filter(code => {
    const m = code.match(/^S(\d+)E(\d+)$/);
    return m && Number(m[1]) === season && Number(m[2]) < episode;
  }).length;
  const displayEpisode = episode - removedBefore;
  return {
    isUnavailable: removed.includes(episodeCode),
    displayEpisode,
    displayCode: `S${String(season).padStart(2, '0')}E${String(displayEpisode).padStart(2, '0')}`
  };
}

// Generate all possible (Season, Episode) tuples for a show
export function getAvailableEpisodesForShow(show, allowedSeasons = [], customPlatformId = null, customLinks = {}) {
  if (!show || !show.seasons) return [];

  const activePlatformId = customPlatformId || show.platform;
  const platformConfig = PLATFORMS_CONFIG[activePlatformId] || PLATFORMS_CONFIG[show.platform] || PLATFORMS_CONFIG.netflix;

  const showPage = resolveShowPage(show, platformConfig.id, customLinks);
  const episodeTuples = [];
  show.seasons.forEach(s => {
    if (allowedSeasons.length > 0 && !allowedSeasons.includes(s.season)) {
      return;
    }

    for (let ep = 1; ep <= s.episodeCount; ep++) {
      const episodeCode = `S${String(s.season).padStart(2, '0')}E${String(ep).padStart(2, '0')}`;
      const numbering = getPlatformNumbering(show, platformConfig.id, s.season, ep);
      if (numbering.isUnavailable) continue;
      
      const { watchUrl, hasExactEpisodeLink } = resolveEpisodeLink(show, platformConfig.id, episodeCode, customLinks);

      const highlight = (show.highlightEpisodes || []).find(h => h.season === s.season && h.episode === ep);
      const officialTitle =
        EPISODE_TITLES_MAP[show.id]?.[episodeCode] ||
        (highlight ? highlight.title : `Bölüm ${ep}`);
      
      episodeTuples.push({
        showId: show.id,
        showTitle: show.title,
        platform: platformConfig.id,
        platformName: platformConfig.name,
        platformColor: platformConfig.color,
        season: s.season,
        episode: ep,
        episodeCode: episodeCode,
        title: officialTitle,
        description: highlight ? highlight.description : `${show.title} ${s.season}. Sezon ${ep}. Bölüm`,
        watchUrl: watchUrl,
        hasExactEpisodeLink: hasExactEpisodeLink,
        displayEpisode: numbering.displayEpisode,
        displayCode: numbering.displayCode,
        ...showPage
      });
    }
  });

  return episodeTuples;
}

// Select a random episode for a show, avoiding watched episodes if possible
export function pickRandomEpisodeForShow(showId, allowedSeasons = [], watchedList = [], customPlatformId = null, customLinks = {}) {
  const show = getShowById(showId);
  if (!show) return null;

  const allEpisodes = getAvailableEpisodesForShow(show, allowedSeasons, customPlatformId, customLinks);
  if (allEpisodes.length === 0) return null;

  const watchedSet = new Set(watchedList.map(item => `${item.showId}-S${item.season}E${item.episode}`));
  const unwatched = allEpisodes.filter(ep => !watchedSet.has(`${ep.showId}-S${ep.season}E${ep.episode}`));

  const pool = unwatched.length > 0 ? unwatched : allEpisodes;
  const randomIndex = Math.floor(Math.random() * pool.length);
  return pool[randomIndex];
}

/**
 * Generate a dynamic queue of episodes based on user playlist rules
 */
export function generatePlaylistQueue(rules, watchedList = [], targetQueueLength = 25, customLinks = {}) {
  if (!rules || rules.length === 0) return [];

  const validRules = rules.filter(r => r.count > 0 && getShowById(r.showId));
  if (validRules.length === 0) return [];

  const queue = [];
  let tempWatched = [...watchedList];
  let ruleIndex = 0;

  while (queue.length < targetQueueLength) {
    const currentRule = validRules[ruleIndex % validRules.length];
    
    for (let c = 0; c < currentRule.count; c++) {
      if (queue.length >= targetQueueLength) break;

      const episode = pickRandomEpisodeForShow(
        currentRule.showId,
        currentRule.allowedSeasons,
        tempWatched,
        currentRule.platform,
        customLinks
      );

      if (episode) {
        const queueItem = {
          ...episode,
          queueId: `${episode.showId}-${episode.season}-${episode.episode}-${Math.random().toString(36).substr(2, 9)}`
        };
        queue.push(queueItem);
        tempWatched.push(episode);
      }
    }

    ruleIndex++;
    if (ruleIndex > 500) break;
  }

  return queue;
}
