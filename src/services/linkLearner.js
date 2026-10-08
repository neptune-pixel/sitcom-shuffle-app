// Learns episode links from what actually plays.
//
// The extension reports, for the episode currently playing: the platform, the page URL and a
// few short texts read from the player (show name, "S2:E14", episode title...).
// learnFromObservation() works out which show/episode that is and returns the link changes:
//   - episode had no link            -> learn it            (kind 'new')
//   - episode had a different link   -> learn it (wins over the built-in one)   (kind 'replaced')
//   - the URL was stored for ANOTHER episode -> that built-in link is switched off ('bad:')
// Links the user pasted are never touched.
//
// Learned links live in their own store with keys "learned:<show>_<platform>_<SxxEyy>" and
// "bad:<show>_<platform>_<SxxEyy>", merged into the link lookup by App (see resolveEpisodeLink).

import { SITCOMS_DATABASE } from '../data/sitcomsData';
import { EPISODE_TITLES_MAP } from '../data/episodeTitles';
import { resolveEpisodeLink, getPlatformNumbering } from './shuffleEngine';

export const LEARNABLE_PLATFORMS = ['netflix', 'disney', 'max']; // Prime URLs don't identify the episode

export function normalizeText(text) {
  return String(text || '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/ı/g, 'i')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

// Canonical form of a playback URL: { key } identifies the episode, { url } is what we store.
export function canonicalWatchUrl(platform, rawUrl) {
  const url = String(rawUrl || '');
  if (platform === 'netflix') {
    const m = url.match(/netflix\.com\/(?:[a-z]{2}(?:-[a-z]{2})?\/)?watch\/(\d+)/i);
    return m ? { key: `netflix:${m[1]}`, url: `https://www.netflix.com/watch/${m[1]}` } : null;
  }
  if (platform === 'disney') {
    const m = url.match(/disneyplus\.com\/(?:[a-z]{2}-[a-z]{2}\/)?(?:play|video)\/([a-z0-9-]+)/i);
    return m ? { key: `disney:${m[1].toLowerCase()}`, url: `https://www.disneyplus.com/play/${m[1]}` } : null;
  }
  if (platform === 'max') {
    const m = url.match(/^https:\/\/([a-z.]*(?:hbo)?max\.com)\/(?:[a-z]{2}\/[a-z]{2}\/)?video\/watch\/([a-z0-9-]+(?:\/[a-z0-9-]+)?)/i);
    return m ? { key: `max:${m[2].toLowerCase()}`, url: `https://${m[1]}/video/watch/${m[2]}` } : null;
  }
  return null;
}

// "S2:E14", "S2 B14", "Season 2, Ep. 14", "Sezon 2 Bölüm 14", "2. Sezon 14. Bölüm", "Seizoen 2 Afl. 14"...
const SEASON_EPISODE_PATTERNS = [
  /\b(?:s|season|sezon|seizoen|staffel|saison|temporada|stagione)\s*(\d{1,2})\s*(?:e|ep|episode|b|bolum|afl|aflevering|folge|episodio|episode)\s*(\d{1,3})\b/,
  /\b(\d{1,2})\s*sezon\s*(\d{1,3})\s*bolum\b/
];

export function parseSeasonEpisode(texts) {
  for (const text of texts) {
    const normalized = normalizeText(text);
    for (const re of SEASON_EPISODE_PATTERNS) {
      const m = normalized.match(re);
      if (m) {
        return {
          season: Number(m[1]),
          episode: Number(m[2]),
          rest: normalized.replace(m[0], ' ').replace(/\s+/g, ' ').trim()
        };
      }
    }
  }
  return null;
}

function showNames(show) {
  return [show.title, show.originalTitle, String(show.title).replace(/\(.*?\)/g, '')]
    .map(normalizeText)
    .filter(Boolean);
}

export function identifyShow(texts) {
  const normalizedTexts = texts.map(normalizeText).filter(Boolean);
  // Score = length of the longest show name found in the texts; ambiguous best match -> null
  const scores = new Map();
  for (const show of SITCOMS_DATABASE) {
    for (const name of showNames(show)) {
      const hit = normalizedTexts.some(t => t === name || (name.length >= 5 && ` ${t} `.includes(` ${name} `)));
      if (hit) scores.set(show, Math.max(scores.get(show) || 0, name.length));
    }
  }
  const best = Math.max(0, ...scores.values());
  const winners = [...scores].filter(([, score]) => score === best).map(([show]) => show);
  return winners.length === 1 ? winners[0] : null;
}

function episodeCode(season, episode) {
  return `S${String(season).padStart(2, '0')}E${String(episode).padStart(2, '0')}`;
}

export function identifyEpisode(show, platform, texts) {
  const se = parseSeasonEpisode(texts);
  const showNameSet = new Set(showNames(show));

  // 1. By episode title (most reliable: immune to platform renumbering)
  const titleIndex = new Map();
  for (const [code, title] of Object.entries(EPISODE_TITLES_MAP[show.id] || {})) {
    const m = code.match(/^S(\d+)E(\d+)$/);
    if (!m || getPlatformNumbering(show, platform, Number(m[1]), Number(m[2])).isUnavailable) continue;
    const key = normalizeText(title);
    if (!key || /^bolum \d+$/.test(key)) continue;
    titleIndex.set(key, titleIndex.has(key) ? null : code); // null = ambiguous title
  }
  const segments = new Set();
  for (const text of texts) {
    segments.add(normalizeText(text));
    for (const part of String(text).split(/\s[-–—•|:]\s|:\s|\n/)) segments.add(normalizeText(part));
  }
  if (se?.rest) segments.add(se.rest);
  const titleCodes = new Set();
  for (const seg of segments) {
    if (seg.length < 3 || showNameSet.has(seg)) continue;
    const code = titleIndex.get(seg);
    if (code) titleCodes.add(code);
  }
  if (titleCodes.size === 1) return { code: [...titleCodes][0], method: 'title' };

  // 2. By season/episode number as the platform shows it
  if (se) {
    const season = show.seasons?.find(s => s.season === se.season);
    if (season) {
      for (let ep = 1; ep <= season.episodeCount; ep++) {
        const n = getPlatformNumbering(show, platform, se.season, ep);
        if (!n.isUnavailable && n.displayEpisode === se.episode) {
          return { code: episodeCode(se.season, ep), method: 'number' };
        }
      }
    }
  }
  return null;
}

function allEpisodeCodes(show, platform) {
  const codes = [];
  for (const s of show.seasons || []) {
    for (let ep = 1; ep <= s.episodeCount; ep++) {
      if (!getPlatformNumbering(show, platform, s.season, ep).isUnavailable) codes.push(episodeCode(s.season, ep));
    }
  }
  return codes;
}

function displayCodeOf(show, platform, code) {
  const m = code.match(/^S(\d+)E(\d+)$/);
  return m ? getPlatformNumbering(show, platform, Number(m[1]), Number(m[2])).displayCode : code;
}

/**
 * @param observation { platform, url, texts: string[] }
 * @param links       merged link lookup (learned + custom), as used by the engine
 * @returns null when nothing could be identified, otherwise
 *          { kind: 'confirmed'|'custom'|'new'|'replaced', set: {key: url}, remove: [key], entry }
 */
export function learnFromObservation(observation, links = {}, now = Date.now()) {
  const platform = observation?.platform;
  if (!LEARNABLE_PLATFORMS.includes(platform)) return null;
  const texts = (Array.isArray(observation.texts) ? observation.texts : [])
    .filter(t => typeof t === 'string')
    .map(t => t.slice(0, 160))
    .slice(0, 16);
  const canonical = canonicalWatchUrl(platform, observation.url);
  if (!canonical || texts.length === 0) return null;

  const show = identifyShow(texts);
  if (!show) return null;
  const episode = identifyEpisode(show, platform, texts);
  if (!episode) return null;

  const { code, method } = episode;
  const current = resolveEpisodeLink(show, platform, code, links);
  const currentKey = current.watchUrl ? canonicalWatchUrl(platform, current.watchUrl)?.key : null;
  const base = {
    at: now,
    showId: show.id,
    showTitle: show.title,
    platform,
    code,
    displayCode: displayCodeOf(show, platform, code),
    url: canonical.url,
    method
  };

  if (currentKey === canonical.key) return { kind: 'confirmed', set: {}, remove: [], entry: { ...base, kind: 'confirmed' } };
  if (current.linkSource === 'custom') return { kind: 'custom', set: {}, remove: [], entry: { ...base, kind: 'custom' } };

  const set = { [`learned:${show.id}_${platform}_${code}`]: canonical.url };
  const remove = [];
  const wrongCodes = [];

  // Was this URL stored for a different episode? Then that link is wrong.
  for (const other of allEpisodeCodes(show, platform)) {
    if (other === code) continue;
    const r = resolveEpisodeLink(show, platform, other, links);
    if (!r.watchUrl || canonicalWatchUrl(platform, r.watchUrl)?.key !== canonical.key) continue;
    if (r.linkSource === 'custom') continue;
    if (r.linkSource === 'learned') remove.push(`learned:${show.id}_${platform}_${other}`);
    if (r.linkSource === 'builtin') set[`bad:${show.id}_${platform}_${other}`] = r.watchUrl;
    wrongCodes.push(other);
  }

  const kind = current.watchUrl ? 'replaced' : 'new';
  return {
    kind,
    set,
    remove,
    entry: { ...base, kind, wrongCodes: wrongCodes.map(c => displayCodeOf(show, platform, c)) }
  };
}

export function describeLearning(result) {
  const e = result?.entry;
  if (!e) return null;
  const where = `${e.showTitle} ${e.displayCode}`;
  if (e.wrongCodes?.length) {
    return `${e.showTitle} ${e.wrongCodes.join(', ')} linki aslında ${e.displayCode} bölümünü açıyordu — düzeltildi.`;
  }
  if (result.kind === 'new') return `Yeni bölüm linki öğrenildi: ${where}`;
  if (result.kind === 'replaced') return `Bölüm linki güncellendi: ${where} (izlenen bölümden alındı)`;
  return null;
}
