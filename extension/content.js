let isFinished = false;
let lastSkipClickTime = 0;
let lastGenericSkipScanTime = 0;
const GENERIC_SKIP_SCAN_INTERVAL_MS = 1000;
let lastRestartClickTime = 0;
let userRequestedPause = false;
let hasAutoStarted = false;
let currentUrl = window.location.href;
let initialEpisodeId = extractEpisodeId(window.location.href);
let playbackStartTime = Date.now();

/**
 * Extracts a unique episode identifier from supported streaming platform URLs
 */
function extractEpisodeId(url) {
  if (!url) return null;
  const nflx = url.match(/netflix\.com\/watch\/(\d+)/);
  if (nflx) return `netflix_${nflx[1]}`;

  const dis = url.match(/disneyplus\.com\/(?:[a-z]{2}-[a-z]{2}\/)?play\/([a-zA-Z0-9-]+)/);
  if (dis) return `disney_${dis[1]}`;

  const max = url.match(/(?:max|hbomax)\.com\/(?:[a-z]{2}\/[a-z]{2}\/)?video\/watch\/([a-zA-Z0-9-]+)/);
  if (max) return `max_${max[1]}`;

  const prime = url.match(/primevideo\.com\/(?:gp\/video\/)?detail\/([a-zA-Z0-9]+)/) || url.match(/[?&]gti=([a-zA-Z0-9]+)/);
  if (prime) return `prime_${prime[1]}`;

  return url.split('?')[0];
}

/**
 * Checks if a DOM element is actually visible on screen (not hidden, non-zero size)
 */
function isElementVisible(el) {
  if (!el) return false;
  try {
    if (el.hidden || el.getAttribute('aria-hidden') === 'true') return false;
    const rect = el.getBoundingClientRect();
    if (rect.width < 10 || rect.height < 10) return false;
    const style = window.getComputedStyle(el);
    if (style && (style.display === 'none' || style.visibility === 'hidden' || parseFloat(style.opacity || '1') === 0)) {
      return false;
    }
    return true;
  } catch {
    try {
      const rect = el.getBoundingClientRect();
      return rect.width >= 10 && rect.height >= 10;
    } catch {
      return false;
    }
  }
}

// ---------------------------------------------------------------------------
// Shadow DOM helpers
//
// Walking every element on the page to find shadow roots is expensive, so the
// list of open shadow roots is cached and rebuilt at most every
// SHADOW_CACHE_TTL_MS. Queries then only touch the document plus those roots.
// ---------------------------------------------------------------------------
const SHADOW_CACHE_TTL_MS = 2000;
let shadowRootCache = [];
let shadowRootCacheTime = 0;

function collectShadowRoots(root, out) {
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_ELEMENT);
  let node = walker.nextNode();
  while (node) {
    if (node.shadowRoot) {
      out.push(node.shadowRoot);
      collectShadowRoots(node.shadowRoot, out);
    }
    node = walker.nextNode();
  }
  return out;
}

function getShadowRoots() {
  const now = Date.now();
  if (now - shadowRootCacheTime > SHADOW_CACHE_TTL_MS) {
    try {
      shadowRootCache = collectShadowRoots(document.documentElement, []);
    } catch {
      shadowRootCache = [];
    }
    shadowRootCacheTime = now;
  }
  // Drop roots whose host has been removed from the page
  return shadowRootCache.filter(r => r.host && r.host.isConnected);
}

/**
 * Finds the first element matching selector in the document or any open shadow root
 */
function findDeep(root, selector) {
  if (!root) return null;
  try {
    const direct = root.querySelector(selector);
    if (direct) return direct;
  } catch {
    return null;
  }
  if (root !== document) return null;
  for (const shadow of getShadowRoots()) {
    try {
      const found = shadow.querySelector(selector);
      if (found) return found;
    } catch {}
  }
  return null;
}

/**
 * Finds all elements matching selector in the document and all open shadow roots
 */
function findDeepAll(root, selector) {
  if (!root) return [];
  const results = [];
  try {
    results.push(...root.querySelectorAll(selector));
  } catch {
    return results;
  }
  if (root !== document) return results;
  for (const shadow of getShadowRoots()) {
    try {
      results.push(...shadow.querySelectorAll(selector));
    } catch {}
  }
  return results;
}

/**
 * Dispatches a realistic click sequence on a DOM element
 */
function safeClick(element) {
  if (!element) return false;
  try {
    if (typeof element.focus === 'function') {
      try { element.focus(); } catch {}
    }

    const rect = element.getBoundingClientRect();
    const x = rect.left + (rect.width > 0 ? rect.width / 2 : 10);
    const y = rect.top + (rect.height > 0 ? rect.height / 2 : 10);

    const eventOpts = {
      bubbles: true,
      cancelable: true,
      view: window,
      clientX: x,
      clientY: y,
      screenX: x,
      screenY: y,
      buttons: 1
    };

    try { element.dispatchEvent(new PointerEvent('pointerdown', eventOpts)); } catch {}
    try { element.dispatchEvent(new MouseEvent('mousedown', eventOpts)); } catch {}
    try { element.dispatchEvent(new PointerEvent('pointerup', { ...eventOpts, buttons: 0 })); } catch {}
    try { element.dispatchEvent(new MouseEvent('mouseup', { ...eventOpts, buttons: 0 })); } catch {}
    try { element.dispatchEvent(new MouseEvent('click', { ...eventOpts, buttons: 0 })); } catch {}

    if (typeof element.click === 'function') {
      element.click();
    }
    return true;
  } catch (err) {
    console.warn("SitcomShuffle Extension: safeClick error:", err);
    return false;
  }
}

/**
 * Tracks client-side URL changes.
 * Only intercepts if the previous episode was actually played for at least 3 minutes (180s)
 * to strictly prevent prerolls/bumpers from triggering next episode.
 */
function checkUrlChange() {
  if (window.location.href !== currentUrl) {
    const newEpId = extractEpisodeId(window.location.href);
    console.log("[SitcomShuffle Extension] URL changed from:", currentUrl, "to:", window.location.href);

    const mainVideo = getMainEpisodeVideo();
    const playedLongEnough = (mainVideo && mainVideo.currentTime > 180) || (Date.now() - playbackStartTime > 180000);

    // If a legitimate episode was playing and the platform auto-advanced to a different episode:
    if (initialEpisodeId && newEpId && initialEpisodeId !== newEpId && playedLongEnough && !isFinished) {
      console.log("[SitcomShuffle Extension] Platform auto-navigated to next episode after full playback! Advancing shuffle queue...");
      triggerEnd("platform_auto_navigated");
      return;
    }

    currentUrl = window.location.href;
    pendingKnownNone = false;
    observationSent = false;
    controlsNudges = 0;
    initialEpisodeId = newEpId;
    playbackStartTime = Date.now();
    isFinished = false;
    userRequestedPause = false;
    hasAutoStarted = false;
    lastRestartClickTime = 0;
  }
}

window.addEventListener('popstate', checkUrlChange);
window.addEventListener('hashchange', checkUrlChange);

// Netflix manual pause tracking
if (window.location.href.includes("netflix.com")) {
  document.addEventListener('keydown', (e) => {
    if (!e.isTrusted) return;
    if (e.code === 'Space' || e.code === 'KeyK') {
      const video = document.querySelector('video');
      if (video && !video.paused) {
        userRequestedPause = true;
      } else {
        userRequestedPause = false;
      }
    }
  }, true);

  document.addEventListener('pointerdown', (e) => {
    if (!e.isTrusted) return;
    if (e.target.closest('[data-uia="control-play-pause-pause"]')) {
      userRequestedPause = true;
    } else if (e.target.closest('[data-uia="control-play-pause-play"], [data-uia="player-blocked-play"]')) {
      userRequestedPause = false;
    }
  }, true);
}

/**
 * Targets Netflix blocked-autoplay overlay button
 */
function checkNetflixInitialRestart() {
  if (!window.location.href.includes("netflix.com")) return;
  if (userRequestedPause) return;
  if (hasAutoStarted) return;

  const video = document.querySelector('video');
  if (video && !video.paused && video.currentTime > 1) {
    hasAutoStarted = true;
    return;
  }

  const blockedPlayBtn = document.querySelector(
    '[data-uia="player-blocked-play"], .watch-video--autoplay-blocked button, [class*="autoplay-blocked"] button, [data-uia="playback-restart-btn"], .watch-video--playback-restart button, [class*="playback-restart"] button'
  );

  if (blockedPlayBtn && isElementVisible(blockedPlayBtn)) {
    if (Date.now() - lastRestartClickTime < 1000) return;
    lastRestartClickTime = Date.now();
    safeClick(blockedPlayBtn);
    return;
  }

  if (video && video.paused && video.currentTime === 0) {
    const centerPlay = document.querySelector(
      '[data-uia="control-play-pause-play"], .watch-video--player-view button[aria-label="Play"], .watch-video--player-view button[aria-label="Oynat"]'
    );
    if (centerPlay && isElementVisible(centerPlay) && Date.now() - lastRestartClickTime > 1500) {
      lastRestartClickTime = Date.now();
      safeClick(centerPlay);
    }
  }
}

/**
 * Skip Intro / Skip Recap detection
 *
 * 1. Platform-specific selectors (searched inside shadow DOM too), keeping only VISIBLE matches,
 *    because some players keep a hidden skip button in the page at all times.
 * 2. Fallback: match the visible label of any button (text, aria-label or title) in several
 *    languages, also inside shadow DOM (Disney+ renders its player there).
 * Labels are normalized first so Turkish "İntroyu Atla" / "Girişi Atla" match ASCII patterns
 * ("İ".toLowerCase() is "i" + a combining dot, which a plain includes() never matched).
 */
const SKIP_SELECTORS = {
  netflix: '[data-uia="player-skip-intro"], [data-uia="player-skip-recap"], [data-uia="player-skip-preplay"], [data-uia="watch-video--skip-content-button"], .watch-video--skip-content-button',
  max: '[data-testid*="skip-intro" i], [data-testid*="skipintro" i], [data-testid*="skip-recap" i], [data-testid="skip-button"], [data-testid="player-skip-button"]',
  disney: 'button.skip__button, .skip__button, button[class*="skip__button"], button[data-qa*="skip" i], [data-testid*="skip-intro" i], [data-testid*="skip-recap" i], [data-testid="skip-overlay"] button, [data-gv2elementkey*="skip" i], .skip-button',
  prime: '.atvwebplayersdk-skipelement-button, [data-automation-id="skip-intro-button"], [data-automation-id*="skip" i] button, .skipElement'
};

const SKIP_LABEL_PATTERNS = [
  /\bskip\s+(the\s+)?(intro|recap|opening|preview)\b/,          // English
  /\b(intro|giris|jenerik|jenerig|ozet|tekrar)(i|u|yu|yi)?\s+(atla|gec)\b/, // Turkish (after normalization)
  /\b(intro|samenvatting|terugblik)\s+overslaan\b/,              // Dutch
  /\b(intro|vorspann|ruckblick|zusammenfassung)\s+uberspringen\b/, // German
  /\bpasser\s+(l'?\s*)?(intro|generique|recapitulatif)\b/,        // French
  /\b(saltar|omitir|salta)\s+(la\s+)?(intro|introduccion|resumen|riassunto)\b/ // Spanish / Italian
];

function normalizeLabel(text) {
  return String(text || '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '') // strip accents and the dot of "İ"
    .replace(/ı/g, 'i')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim();
}

function hasSkipLabel(el) {
  const raw = [el.getAttribute('aria-label'), el.getAttribute('title'), el.textContent].filter(Boolean).join(' ');
  if (!raw || raw.length > 80) return false; // long text = container, not a button label
  const label = normalizeLabel(raw);
  return SKIP_LABEL_PATTERNS.some(re => re.test(label));
}

function getPlatformKey(url) {
  if (url.includes("netflix.com")) return 'netflix';
  if (url.includes("disneyplus.com")) return 'disney';
  if (url.includes("max.com") || url.includes("hbomax.com")) return 'max';
  if (url.includes("primevideo.com") || url.includes("amazon.com/gp/video/")) return 'prime';
  return null;
}

function findVisibleSkipButton(platform) {
  // 1. Known selectors, first visible match wins
  const selector = SKIP_SELECTORS[platform];
  if (selector) {
    const visible = findDeepAll(document, selector).find(isElementVisible);
    if (visible) return visible;
  }

  // 2. Label fallback (throttled: it looks at every button on the page)
  if (Date.now() - lastGenericSkipScanTime < GENERIC_SKIP_SCAN_INTERVAL_MS) return null;
  lastGenericSkipScanTime = Date.now();
  const candidates = findDeepAll(document, 'button, [role="button"]');
  for (const btn of candidates) {
    if (hasSkipLabel(btn) && isElementVisible(btn)) return btn;
  }
  return null;
}

function checkSkipIntro() {
  if (Date.now() - lastSkipClickTime < 2000) return;

  const platform = getPlatformKey(window.location.href);
  const skipBtn = findVisibleSkipButton(platform);

  if (skipBtn) {
    console.log("[SitcomShuffle Extension] Auto-clicking 'Skip Intro/Recap' button:", skipBtn);
    lastSkipClickTime = Date.now();
    safeClick(skipBtn);
  }
}

/**
 * Finds the primary episode video element (ignoring preroll ads / background teasers under 300 seconds)
 */
function getMainEpisodeVideo() {
  let videos = Array.from(document.querySelectorAll("video"));
  if (videos.length === 0) {
    videos = findDeepAll(document, "video");
  }
  if (videos.length === 0) return null;
  // Return video with longest duration or active playback
  videos.sort((a, b) => (b.duration || 0) - (a.duration || 0));
  return videos[0];
}

/**
 * Specifically inspects Disney+ for the end-card / "Sonraki Bölüm" card.
 * In Disney+, this is rendered inside <end-card-overlay> shadow-root with:
 * <button type="button" class="end-card-overlay__content-tile" data-qa="end-card-overlay.contentTile">
 * and <div class="end-card-overlay__body" data-qa="end-card-overlay.body">
 */
function checkDisneyEndCard() {
  if (!window.location.href.includes("disneyplus.com")) return null;

  // 1. Check all <end-card-overlay> components (light DOM and shadow roots)
  const overlays = findDeepAll(document, 'end-card-overlay');
  for (const overlay of overlays) {
    if (overlay.hasAttribute('hidden') || overlay.getAttribute('aria-hidden') === 'true') {
      continue;
    }

    if (overlay.shadowRoot) {
      const candidates = overlay.shadowRoot.querySelectorAll(
        'button.end-card-overlay__content-tile, [data-qa="end-card-overlay.contentTile"], button[class*="content-tile"], [data-qa*="contentTile"], .end-card-overlay__body, [data-qa="end-card-overlay.body"], .end-card-overlay__container, [data-qa="end-card-overlay.container"] button, button'
      );
      for (const candidate of candidates) {
        if (isElementVisible(candidate)) {
          return candidate;
        }
      }
    } else {
      if (isElementVisible(overlay)) {
        return overlay;
      }
    }
  }

  // 2. Check up-next-lite-v1 when active (not hidden)
  const upNexts = findDeepAll(document, 'up-next-lite-v1:not([hidden])');
  for (const un of upNexts) {
    if (isElementVisible(un)) {
      return un;
    }
  }

  // 3. Fallback deep query across all shadow roots
  const fallbacks = findDeepAll(
    document,
    'button.end-card-overlay__content-tile, [data-qa="end-card-overlay.contentTile"], .end-card-overlay__body'
  );
  for (const f of fallbacks) {
    if (isElementVisible(f)) {
      return f;
    }
  }

  // 4. Generic Next buttons (Hulu merge UI)
  const genericNexts = findDeepAll(
    document,
    '.up-next-countdown__container, [data-testid="up-next-dialog-button"], [data-testid="up-next-button"], [data-testid*="up-next"], .up-next-button, [aria-label*="Next Episode" i], [aria-label*="Sonraki" i]'
  );
  for (const next of genericNexts) {
    if (isElementVisible(next)) {
      return next;
    }
  }

  return null;
}

/**
 * Checks for the end of the episode strictly waiting for the platform's "Next Episode" button / prompt.
 *
 * RULES APPLIED:
 * 1) Disney+: STRICTLY triggers when the "Sonraki Bölüm" (end-card-overlay) card/button appears on screen.
 * 2) Netflix: ONLY triggers when the actual "Next Episode" / "Sonraki Bölüm" button appears on screen.
 * 3) Prime Video: ONLY triggers when the "Next Up" / "Sonraki Bölüm" button appears at the end (never during bumpers).
 * 4) HBO Max: ONLY triggers when the "Next Episode" button appears on screen.
 */
function checkVideoEnd() {
  if (isFinished) return;

  const url = window.location.href;

  // ==========================================
  // 1. DISNEY+: STRICT "SONRAKİ BÖLÜM" CARD CHECK
  // ==========================================
  if (url.includes("disneyplus.com")) {
    // The end card only appears after real playback; skip the expensive shadow DOM search before that
    const disneyVideo = getMainEpisodeVideo();
    const disneyEligible = disneyVideo
      ? disneyVideo.currentTime > 120
      : (Date.now() - playbackStartTime > 120000);
    if (!disneyEligible) return;

    const disneyNext = checkDisneyEndCard();
    if (disneyNext) {
      console.log("[SitcomShuffle Extension] Disney+ 'Sonraki Bölüm' (End Card) visible! Advancing...", disneyNext);
      triggerEnd("disney_next_btn_visible");
      return;
    }
  }

  const mainVid = getMainEpisodeVideo();

  // Safety gate: If video duration is known and very short (e.g. 5-30s preroll ad / MGM bumper), DO NOT check end
  if (mainVid && mainVid.duration && mainVid.duration < 180) {
    return;
  }

  // Safety gate: The user must have reached at least 2 minutes into the video
  // or video must be near the end of a real episode (to prevent false triggers at video start)
  const isEligibleForEnd = mainVid
    ? (mainVid.currentTime > 120 || (mainVid.duration > 300 && mainVid.currentTime > mainVid.duration * 0.7))
    : (Date.now() - playbackStartTime > 120000);

  if (!isEligibleForEnd) {
    return;
  }

  // ==========================================
  // 2. NETFLIX: STRICT "NEXT EPISODE" BUTTON
  // ==========================================
  if (url.includes("netflix.com")) {
    const nextBtn = document.querySelector(
      '[data-uia="next-episode-seamless-button"], [data-uia="next-episode-seamless-button-draining"], button[data-uia="postplay-button"]'
    );

    if (isElementVisible(nextBtn)) {
      console.log("[SitcomShuffle Extension] Netflix 'Next Episode' button visible! Advancing...", nextBtn);
      triggerEnd("netflix_next_btn_visible");
      return;
    }
  }

  // ==========================================
  // 3. PRIME VIDEO: STRICT "NEXT EPISODE" BUTTON
  // ==========================================
  if (url.includes("primevideo.com") || url.includes("amazon.com/gp/video/")) {
    const primeNextBtn = document.querySelector(
      '.atvwebplayersdk-nextupcard-button, [data-automation-id="next-up-card"] button, button.nextUpCard'
    );

    if (isElementVisible(primeNextBtn)) {
      console.log("[SitcomShuffle Extension] Prime Video 'Next Episode' button visible! Advancing...", primeNextBtn);
      triggerEnd("prime_next_btn_visible");
      return;
    }

    // Secondary visible button search for Prime Video
    const nextCardWrapper = document.querySelector('.atvwebplayersdk-nextupcard-wrapper');
    if (isElementVisible(nextCardWrapper)) {
      const innerBtn = nextCardWrapper.querySelector('button, [role="button"]') || nextCardWrapper;
      if (isElementVisible(innerBtn)) {
        console.log("[SitcomShuffle Extension] Prime Video Next Up card active! Advancing...", innerBtn);
        triggerEnd("prime_nextup_card_active");
        return;
      }
    }
  }

  // ==========================================
  // 4. MAX / HBO MAX: STRICT "NEXT EPISODE" BUTTON
  // ==========================================
  if (url.includes("max.com") || url.includes("hbomax.com")) {
    const maxNextBtn = document.querySelector(
      '[data-testid*="up-next"] button, [data-testid*="UpNext"] button, [data-testid*="next-episode"] button, button[data-testid*="UpNext"], button[data-testid*="next-episode"]'
    );

    if (isElementVisible(maxNextBtn)) {
      console.log("[SitcomShuffle Extension] Max 'Next Episode' button visible! Advancing...", maxNextBtn);
      triggerEnd("max_next_btn_visible");
      return;
    }
  }

  // ==========================================
  // 5. NATIVE VIDEO END FALLBACK (Only for real full-length episodes)
  // ==========================================
  if (mainVid && mainVid.duration > 600 && mainVid.currentTime > 500) {
    if (mainVid.ended === true || (mainVid.duration - mainVid.currentTime < 1.5)) {
      console.log("[SitcomShuffle Extension] Full-length episode video ended natively. Advancing...");
      triggerEnd("full_video_ended_natively");
      return;
    }
  }
}

function triggerEnd(reason) {
  if (isFinished) return;
  isFinished = true;
  console.log("%c[SitcomShuffle Extension] Episode finished! Reason: " + reason, "color: #34D399; font-weight: bold; font-size: 14px;");

  // Pause all active video elements
  const videos = document.querySelectorAll("video");
  videos.forEach(v => {
    try { v.pause(); } catch {}
  });

  if (document.fullscreenElement) {
    try { document.exitFullscreen().catch(() => {}); } catch {}
  }

  // Notify background service worker
  chrome.runtime.sendMessage({ type: "EPISODE_FINISHED", reason: reason }, (res) => {
    if (chrome.runtime.lastError) {
      console.warn("[SitcomShuffle Extension] Error sending EPISODE_FINISHED:", chrome.runtime.lastError.message);
    } else {
      console.log("[SitcomShuffle Extension] Background acknowledged EPISODE_FINISHED.", res);
    }
  });
}

// ---------------------------------------------------------------------------
// Netflix "Who's watching?" profile gate
//
// When the extension opens a Netflix episode in a tab that was on another site,
// Netflix sometimes shows the profile picker and moves the tab to the show page
// (/title/<id>). The extension then:
//   1. clicks the default profile chosen in the extension popup (falls back to the profile the
//      user picked by hand last time), and
//   2. sends the tab back to the episode it was supposed to open.
// If a profile was picked, the stale tab is closed and the episode is opened in a fresh tab
// (once per episode). Both only happen right after an auto-advance (background keeps a "pending" URL per tab
// for 3 minutes), so normal manual Netflix browsing is never touched.
// ---------------------------------------------------------------------------
const PROFILE_GATE_HEADINGS = [
  /who'?s watching/, /kim izliyor/, /wie kijkt er/, /wer schaut/, /qui regarde/, /quien esta viendo/, /chi guarda/
];
const PROFILE_ENTRY_SELECTOR =
  'a.profile-link, [data-uia*="profile-link"], [data-uia*="select-profile"], [data-uia^="profile-selector-tile"], [data-uia="profile-selector"] button, li.profile a, li.profile button, .choose-profile a';
const NOT_A_PROFILE = /profil yonetimi|manage profiles|profiel(en)? beheren|profile verwalten|gerer les profils|add profile|profil ekle|profiel toevoegen/;

let lastProfileClickTime = 0;
let lastPendingCheckTime = 0;
let pendingCheckInFlight = false;
let pendingKnownNone = false;

function isNetflix() {
  return window.location.hostname.endsWith('netflix.com');
}

function findNetflixProfileGate() {
  const explicit = document.querySelector('.profile-gate-container, [data-uia="profile-gate"], .list-profiles-container, .choose-profile');
  if (explicit && isElementVisible(explicit)) return explicit;
  for (const h of document.querySelectorAll('h1, h2')) {
    if (PROFILE_GATE_HEADINGS.some(re => re.test(normalizeLabel(h.textContent))) && isElementVisible(h)) {
      return document.body;
    }
  }
  return null;
}

function getProfileName(el) {
  const nameEl = el.querySelector?.('.profile-name, [data-uia*="profile-name"]');
  const raw = nameEl ? nameEl.textContent : (el.getAttribute('aria-label') || el.textContent);
  const name = String(raw || '').trim();
  if (!name || name.length > 40 || NOT_A_PROFILE.test(normalizeLabel(name))) return null;
  return name;
}

function getProfileEntries(gate) {
  return Array.from(gate.querySelectorAll(PROFILE_ENTRY_SELECTOR))
    .filter(isElementVisible)
    .map(el => ({ el, name: getProfileName(el) }))
    .filter(entry => entry.name);
}

function findProfileElementByName(gate, name) {
  const wanted = normalizeLabel(name);
  const entry = getProfileEntries(gate).find(e => normalizeLabel(e.name) === wanted);
  if (entry) return entry.el;
  // Fallback when Netflix changes its markup: any visible element whose own text is the name
  for (const el of gate.querySelectorAll('span, div, p, a, button, li')) {
    if (el.children.length === 0 && normalizeLabel(el.textContent) === wanted && isElementVisible(el)) {
      return el.closest('a, button, [role="link"], [role="button"], li') || el;
    }
  }
  return null;
}

// Remember the profile the user picks by hand (real clicks only)
if (isNetflix()) {
  document.addEventListener('click', (e) => {
    if (!e.isTrusted) return;
    const gate = findNetflixProfileGate();
    if (!gate || !gate.contains(e.target)) return;
    const entryEl = e.target.closest(PROFILE_ENTRY_SELECTOR) || e.target.closest('a, button, [role="link"], [role="button"], li');
    const name = entryEl && getProfileName(entryEl);
    if (name) {
      try { chrome.storage.local.set({ netflixProfileName: name }); } catch {}
      sendToBackground({ type: "PROFILE_PICKED" });
      console.log('[SitcomShuffle Extension] Remembered Netflix profile:', name);
    }
  }, true);
}

// Keep the list of profile names seen on the picker so the popup can offer them as choices
let lastSeenProfilesKey = '';
let lastProfileScan = 0;
function recordSeenProfiles() {
  if (!isNetflix() || Date.now() - lastProfileScan < 1500) return;
  lastProfileScan = Date.now();
  const gate = findNetflixProfileGate();
  if (!gate) return;
  const names = getProfileEntries(gate).map(e => e.name);
  const key = names.join('|');
  if (!names.length || key === lastSeenProfilesKey) return;
  lastSeenProfilesKey = key;
  try { chrome.storage.local.set({ netflixProfilesSeen: names }); } catch {}
}

async function getWantedProfileName() {
  const { netflixDefaultProfile, netflixProfileName } =
    await chrome.storage.local.get(['netflixDefaultProfile', 'netflixProfileName']);
  return (netflixDefaultProfile || netflixProfileName || '').trim();
}

// Log a line to the popup's activity log, only when it differs from the previous one
let lastDbg = '';
function dbgOnce(text) {
  if (text === lastDbg) return;
  lastDbg = text;
  try { chrome.runtime.sendMessage({ type: "DEBUG_LOG", text }); } catch {}
}

function sendToBackground(message) {
  return new Promise(resolve => {
    try {
      chrome.runtime.sendMessage(message, (res) => {
        if (chrome.runtime.lastError) resolve(null); else resolve(res);
      });
    } catch {
      resolve(null);
    }
  });
}

// Netflix draws the profile picker a moment after the page loads. Don't give up on it (and don't
// redirect the tab) before it has had time to appear.
const PICKER_RENDER_WAIT_MS = 6000;
const contentScriptStartedAt = Date.now();

// A real episode is loaded (previews/billboards are shorter than 5 minutes)
function isEpisodeVideoReady() {
  const v = getMainEpisodeVideo();
  return Boolean(v && v.readyState >= 2 && v.duration > 300);
}

async function checkNetflixProfileGateAndReturn() {
  if (!isNetflix() || pendingKnownNone || pendingCheckInFlight) return;
  if (Date.now() - lastPendingCheckTime < 1200) return;
  lastPendingCheckTime = Date.now();
  pendingCheckInFlight = true;
  try {
    const res = await sendToBackground({ type: "GET_PENDING_NAVIGATION" });
    const pendingUrl = res?.pending;
    const onEpisodeUrl = Boolean(pendingUrl) && extractEpisodeId(window.location.href) === extractEpisodeId(pendingUrl);
    if (pendingUrl) {
      dbgOnce(`Pending ${pendingUrl}; now at ${window.location.pathname}; gate=${Boolean(findNetflixProfileGate())}; video=${isEpisodeVideoReady()}`);
    }
    if (!pendingUrl) {
      pendingKnownNone = true; // nothing pending for this page; stop asking until the URL changes
      return;
    }

    // Arrived at the intended episode and it is really playing (a video exists): done.
    // The URL alone is not enough: Netflix can show the profile picker while the URL is still /watch/<id>.
    if (onEpisodeUrl && isEpisodeVideoReady()) {
      await sendToBackground({ type: "CLEAR_PENDING_NAVIGATION" });
      pendingKnownNone = true;
      return;
    }

    const gate = findNetflixProfileGate();
    if (gate) {
      if (Date.now() - lastProfileClickTime < 3000) return;
      const wantedProfile = await getWantedProfileName();
      if (!wantedProfile) {
        console.log('[SitcomShuffle Extension] Netflix profile picker shown. Set a default profile in the extension popup (or pick one by hand once).');
        dbgOnce('Profile picker shown but no default profile is set');
        return;
      }
      const target = findProfileElementByName(gate, wantedProfile);
      if (target) {
        console.log('[SitcomShuffle Extension] Selecting default Netflix profile:', wantedProfile);
        dbgOnce(`Clicking default profile "${wantedProfile}"`);
        lastProfileClickTime = Date.now();
        safeClick(target);
        sendToBackground({ type: "PROFILE_PICKED" });
      } else {
        console.warn('[SitcomShuffle Extension] Default Netflix profile not found on the picker:', wantedProfile);
        dbgOnce(`Default profile "${wantedProfile}" not found on the picker`);
      }
      return;
    }

    // On the episode URL but no video or picker yet: the page is still loading, keep waiting.
    if (onEpisodeUrl) return;

    // Not on the episode and no picker yet: give the picker time to render before doing anything else
    const pickerAlreadyHandled = Date.now() - lastProfileClickTime < 60000;
    if (!pickerAlreadyHandled && Date.now() - contentScriptStartedAt < PICKER_RENDER_WAIT_MS) return;

    // Profile picked (or no picker) but we are not on the episode: go back to it.
    // Wait a moment after a profile click so Netflix can finish switching profiles.
    if (Date.now() - lastProfileClickTime < 1500) return;
    // Netflix sent us to the show page (before or after a profile pick): the background sends a real click, then reopens the episode in this tab
    const reopened = await sendToBackground({ type: "REOPEN_AFTER_PROFILE" });
    if (reopened?.success || reopened?.wait) return;
    const consumed = await sendToBackground({ type: "GET_PENDING_NAVIGATION", consume: true });
    if (consumed?.pending) {
      console.log('[SitcomShuffle Extension] Returning to the queued episode:', consumed.pending);
      dbgOnce(`Fallback: redirecting this tab to ${consumed.pending}`);
      window.location.replace(consumed.pending);
    }
  } finally {
    pendingCheckInFlight = false;
  }
}

// ---------------------------------------------------------------------------
// Episode observation (link learning)
//
// While a real episode plays, read the show name / "S2:E14" / episode title from the player
// and report them with the page URL. The app uses this to learn missing links and to fix
// links that open the wrong episode. Sent once per episode page, after 15s of playback.
// Prime Video is skipped: its URLs don't identify the episode.
// ---------------------------------------------------------------------------
const SEASON_EPISODE_RE = /\b(s|season|sezon|seizoen|staffel|saison|temporada|stagione)\s*\d{1,2}\s*[:,.-]?\s*(e|ep|episode|b|bolum|afl|aflevering|folge|episodio)\.?\s*\d{1,3}\b|\b\d{1,2}\.\s*sezon\s*\d{1,3}\.\s*bolum\b/;
const PLAYER_TITLE_SELECTORS = {
  netflix: '[data-uia="video-title"]',
  disney: '.title-field, .subtitle-field, [data-testid="title-field"], [data-testid="subtitle-field"], [data-testid*="player-title" i], [data-testid*="asset-title" i]',
  max: '[data-testid="player-ux-asset-title"], [data-testid="player-ux-asset-subtitle"], [data-testid*="asset-title" i], [data-testid*="asset-subtitle" i]'
};

let observationSent = false;
let lastObserveScan = 0;
let controlsNudges = 0;
let lastControlsNudge = 0;

function isEpisodePlaybackUrl(platform, url) {
  if (platform === 'netflix') return /netflix\.com\/(?:[a-z]{2}(?:-[a-z]{2})?\/)?watch\/\d+/i.test(url);
  if (platform === 'disney') return /disneyplus\.com\/(?:[a-z]{2}-[a-z]{2}\/)?(?:play|video)\//i.test(url);
  if (platform === 'max') return /max\.com\/(?:[a-z]{2}\/[a-z]{2}\/)?video\/watch\//i.test(url);
  return false;
}

function addLeafTexts(root, out) {
  const push = (t) => {
    const text = String(t || '').replace(/\s+/g, ' ').trim();
    if (text && text.length <= 140) out.add(text);
  };
  push(root.textContent);
  for (const el of root.querySelectorAll('*')) {
    if (el.children.length === 0) push(el.textContent);
  }
}

function collectEpisodeTexts(platform) {
  const out = new Set();
  const selector = PLAYER_TITLE_SELECTORS[platform];
  if (selector) {
    for (const el of findDeepAll(document, selector)) addLeafTexts(el, out);
  }
  // Generic fallback: a short text like "S2:E14" anywhere in the player, plus its neighbours
  if (![...out].some(t => SEASON_EPISODE_RE.test(normalizeLabel(t)))) {
    for (const el of findDeepAll(document, 'span, div, p, h1, h2, h3, h4')) {
      if (el.children.length > 0) continue;
      const text = (el.textContent || '').trim();
      if (text.length > 80 || !SEASON_EPISODE_RE.test(normalizeLabel(text)) || !isElementVisible(el)) continue;
      const container = el.parentElement?.parentElement || el.parentElement || el;
      addLeafTexts(container, out);
      if (out.size > 12) break;
    }
  }
  return [...out].slice(0, 12);
}

// Netflix/Disney only render the title while the controls are visible: wiggle the mouse a few times
function nudgePlayerControls(video) {
  if (controlsNudges >= 4 || Date.now() - lastControlsNudge < 15000) return false;
  controlsNudges++;
  lastControlsNudge = Date.now();
  try {
    const rect = video.getBoundingClientRect();
    const x = rect.left + rect.width / 2;
    const y = rect.top + rect.height / 2;
    const target = document.elementFromPoint(x, y) || video;
    for (const dx of [0, 6, 12]) {
      target.dispatchEvent(new MouseEvent('mousemove', { bubbles: true, clientX: x + dx, clientY: y, view: window }));
    }
  } catch {}
  return true;
}

function checkEpisodeObservation() {
  if (observationSent || Date.now() - lastObserveScan < 3000) return;
  const platform = getPlatformKey(window.location.href);
  if (!platform || platform === 'prime' || !isEpisodePlaybackUrl(platform, window.location.href)) return;

  const video = getMainEpisodeVideo();
  if (!video || video.paused || video.currentTime < 15 || (video.duration && video.duration < 180)) return;
  lastObserveScan = Date.now();

  const texts = collectEpisodeTexts(platform);
  const hasEpisodeInfo = texts.some(t => SEASON_EPISODE_RE.test(normalizeLabel(t))) || (platform === 'netflix' && texts.length >= 3);
  if (!hasEpisodeInfo) {
    // Show the controls, then look again shortly (players hide the title bar after a few seconds)
    if (nudgePlayerControls(video)) lastObserveScan = Date.now() - 2500;
    return;
  }

  observationSent = true;
  console.log('[SitcomShuffle Extension] Reporting playing episode:', texts);
  try {
    chrome.runtime.sendMessage({ type: "EPISODE_OBSERVED", platform, url: window.location.href, texts });
  } catch {}
}

// ---------------------------------------------------------------------------
// Polling loop
//
// Runs every 400ms while a video is on the page (needed to catch skip buttons
// and end cards quickly). On pages without a video (browse, search, profile)
// or after the episode has finished, it only checks for URL changes every 2s.
// ---------------------------------------------------------------------------
const ACTIVE_TICK_MS = 400;
const IDLE_TICK_MS = 2000;

function hasVideoOnPage() {
  return Boolean(document.querySelector('video') || findDeep(document, 'video'));
}

function tick() {
  checkUrlChange();
  recordSeenProfiles();
  checkNetflixProfileGateAndReturn();

  const active = !isFinished && hasVideoOnPage();
  if (active) {
    checkNetflixInitialRestart();
    checkSkipIntro();
    checkVideoEnd();
    checkEpisodeObservation();
  }

  setTimeout(tick, active ? ACTIVE_TICK_MS : IDLE_TICK_MS);
}

tick();

console.log(`[SitcomShuffle Extension v${chrome.runtime.getManifest().version}] Content script loaded on:`, window.location.href);
