// SitcomShuffle background service worker
//
// Security: only streaming tabs may report EPISODE_FINISHED, only the local
// SitcomShuffle app may ask to open a tab, and only URLs on the supported
// streaming sites are ever opened.
//
// Reliability: MV3 service workers are shut down when idle, so the reusable
// video tab id is kept in chrome.storage.session instead of a plain variable.

const APP_URL_PATTERNS = [
  "http://localhost:3000/*",
  "http://127.0.0.1:3000/*",
  "http://localhost:5173/*",
  "http://127.0.0.1:5173/*",
  "https://sitcom-shuffle-app.vercel.app/*"
];

const APP_ORIGINS = new Set([
  "http://localhost:3000",
  "http://127.0.0.1:3000",
  "http://localhost:5173",
  "http://127.0.0.1:5173",
  "https://sitcom-shuffle-app.vercel.app"
]);

// Hosts we are allowed to open. A host matches if it equals an entry or is a subdomain of it.
const STREAMING_HOSTS = [
  "netflix.com",
  "disneyplus.com",
  "max.com",
  "hbomax.com",
  "primevideo.com",
  "amazon.com" // only /gp/video/ paths, checked below
];

function hostMatches(hostname, base) {
  return hostname === base || hostname.endsWith("." + base);
}

function isAllowedStreamingUrl(rawUrl) {
  let url;
  try {
    url = new URL(rawUrl);
  } catch {
    return false;
  }
  if (url.protocol !== "https:") return false;
  const host = url.hostname.toLowerCase();
  const base = STREAMING_HOSTS.find(h => hostMatches(host, h));
  if (!base) return false;
  if (base === "amazon.com" && !url.pathname.startsWith("/gp/video/")) return false;
  return true;
}

function isFromStreamingTab(sender) {
  return Boolean(sender?.tab?.url && isAllowedStreamingUrl(sender.tab.url));
}

function isFromAppTab(sender) {
  try {
    return Boolean(sender?.tab?.url && APP_ORIGINS.has(new URL(sender.tab.url).origin));
  } catch {
    return false;
  }
}

async function getReusableTabId() {
  try {
    const { reusableTabId } = await chrome.storage.session.get("reusableTabId");
    return typeof reusableTabId === "number" ? reusableTabId : null;
  } catch {
    return null;
  }
}

async function setReusableTabId(tabId) {
  try {
    if (typeof tabId === "number") {
      await chrome.storage.session.set({ reusableTabId: tabId });
    } else {
      await chrome.storage.session.remove("reusableTabId");
    }
  } catch (e) {
    console.warn("[SitcomShuffle Background] Could not store reusable tab id:", e);
  }
}

// ---------------------------------------------------------------------------
// Pending navigation: remembers which episode URL we opened in which tab, so the
// content script can return to it if the site detours (e.g. Netflix "Who's watching?"
// redirecting /watch/<id> to /title/<id>).
// ---------------------------------------------------------------------------
const PENDING_MAX_AGE_MS = 3 * 60 * 1000;

async function setPendingNavigation(tabId, url, extra = {}) {
  try {
    await chrome.storage.session.set({ [`pending_${tabId}`]: { url, at: Date.now(), attempts: 0, ...extra } });
  } catch {}
}

async function takePendingNavigation(tabId, { consume }) {
  const key = `pending_${tabId}`;
  try {
    const { [key]: pending } = await chrome.storage.session.get(key);
    if (!pending || Date.now() - pending.at > PENDING_MAX_AGE_MS || pending.attempts >= 2) {
      if (pending) await chrome.storage.session.remove(key);
      return null;
    }
    if (consume) {
      pending.attempts += 1;
      await chrome.storage.session.set({ [key]: pending });
    }
    return pending;
  } catch {
    return null;
  }
}

async function clearPendingNavigation(tabId) {
  try { await chrome.storage.session.remove(`pending_${tabId}`); } catch {}
}

// A Netflix profile was picked in this tab (by the extension or by hand) while an episode was pending
async function markProfilePicked(tabId) {
  const key = `pending_${tabId}`;
  try {
    const { [key]: pending } = await chrome.storage.session.get(key);
    if (pending) {
      await chrome.storage.session.set({ [key]: { ...pending, profilePicked: true, profilePickedAt: Date.now() } });
      await dbg(`Profile picked in tab ${tabId}; will reopen ${pending.url} shortly`);
    } else {
      await dbg(`Profile picked in tab ${tabId} but no pending episode`);
    }
  } catch {}
}

// Netflix sends /watch/<id> to the show page (/title/<id>) when the tab has had no real user click
// (autoplay policy: the same link works when you click it yourself, and a tab that was clicked once
// can navigate to episodes freely). Extension-made clicks don't count, so we send one genuine
// mouse click through the debugger API (shows Chrome's "debugging this browser" bar for a moment),
// then navigate the same tab to the episode again.
// After a profile pick, wait a few seconds first so Netflix can finish switching profiles.
// Retries up to MAX_REOPENS times per queued episode.
const REOPEN_WAIT_MS = 5000;
const MAX_REOPENS = 3;

async function grantUserActivation(tabId) {
  const target = { tabId };
  try {
    await chrome.debugger.attach(target, "1.3");
  } catch (e) {
    await dbg(`Could not attach debugger to tab ${tabId}: ${e?.message || e}`);
    return false;
  }
  try {
    const send = (method, params) => chrome.debugger.sendCommand(target, method, params);
    // Click an empty corner of the page (outside any control)
    await send("Input.dispatchMouseEvent", { type: "mouseMoved", x: 3, y: 3 });
    await send("Input.dispatchMouseEvent", { type: "mousePressed", x: 3, y: 3, button: "left", clickCount: 1 });
    await send("Input.dispatchMouseEvent", { type: "mouseReleased", x: 3, y: 3, button: "left", clickCount: 1 });
    return true;
  } catch (e) {
    await dbg(`Real click failed in tab ${tabId}: ${e?.message || e}`);
    return false;
  } finally {
    try { await chrome.debugger.detach(target); } catch {}
  }
}

async function reopenTabAfterProfile(tab) {
  const pending = await takePendingNavigation(tab.id, { consume: false });
  if (!pending || !isAllowedStreamingUrl(pending.url)) return { success: false };

  const reopens = pending.reopens || 0;
  if (reopens >= MAX_REOPENS) {
    await dbg(`Giving up on ${pending.url} after ${reopens} tries`);
    return { success: false };
  }
  if (pending.profilePicked && Date.now() - (pending.profilePickedAt || 0) < REOPEN_WAIT_MS) {
    return { success: false, wait: true };
  }

  const clicked = await grantUserActivation(tab.id);
  await setPendingNavigation(tab.id, pending.url, { reopens: reopens + 1 });
  await chrome.tabs.update(tab.id, { url: pending.url, active: true });
  await dbg(`Tab ${tab.id} was on the show page; real click ${clicked ? "sent" : "NOT sent"}, reopening ${pending.url} (try ${reopens + 1}/${MAX_REOPENS})`);
  return { success: true };
}

// Small activity log shown in the extension popup (helps diagnose Netflix detours)
async function dbg(text) {
  console.log("[SitcomShuffle Background]", text);
  try {
    const { debugLog } = await chrome.storage.local.get("debugLog");
    const log = Array.isArray(debugLog) ? debugLog : [];
    log.push(`${new Date().toLocaleTimeString()} ${String(text).slice(0, 200)}`);
    await chrome.storage.local.set({ debugLog: log.slice(-60) });
  } catch {}
}

async function handleEpisodeFinished(message, sender) {
  const videoTabId = sender.tab.id;
  await setReusableTabId(videoTabId);

  const shuffleTabs = await chrome.tabs.query({ url: APP_URL_PATTERNS });
  if (shuffleTabs.length === 0) {
    console.warn("[SitcomShuffle Background] No SitcomShuffle app tab found!");
    return { success: false, reason: "No app tab found" };
  }

  console.log(`[SitcomShuffle Background] Notifying ${shuffleTabs.length} shuffle tab(s)...`);
  await Promise.all(shuffleTabs.map(tab =>
    chrome.tabs.sendMessage(tab.id, {
      type: "PLAY_NEXT_EPISODE",
      videoTabId,
      reason: String(message.reason || "")
    }).catch(err => {
      console.warn("[SitcomShuffle Background] Failed to message tab:", tab.id, err);
    })
  ));
  return { success: true, targetsNotified: shuffleTabs.length };
}

async function handleOpenTab(message) {
  if (!isAllowedStreamingUrl(message.url)) {
    console.warn("[SitcomShuffle Background] Refusing to open non-streaming URL:", message.url);
    return { success: false, reason: "URL not allowed" };
  }

  const storedTabId = await getReusableTabId();
  const targetTabId = typeof message.tabId === "number" ? message.tabId : storedTabId;
  await setReusableTabId(null);

  if (typeof targetTabId === "number") {
    try {
      // Only reuse the tab if it is still showing a streaming site
      const existing = await chrome.tabs.get(targetTabId);
      if (existing?.url && isAllowedStreamingUrl(existing.url)) {
        await chrome.tabs.update(targetTabId, { url: message.url, active: true });
        await setPendingNavigation(targetTabId, message.url);
        dbg(`Opening ${message.url} in reused tab ${targetTabId}`);
        return { success: true, reused: true };
      }
    } catch {
      console.log("[SitcomShuffle Background] Reusable tab not found, creating new tab.");
    }
  }

  const created = await chrome.tabs.create({ url: message.url, active: true });
  if (created?.id !== undefined) await setPendingNavigation(created.id, message.url);
  dbg(`Opening ${message.url} in new tab ${created?.id}`);
  return { success: true, reused: false };
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (!message || typeof message !== "object") return false;

  if (message.type === "EPISODE_FINISHED") {
    if (!isFromStreamingTab(sender)) {
      console.warn("[SitcomShuffle Background] Ignoring EPISODE_FINISHED from unexpected sender:", sender?.tab?.url);
      return false;
    }
    handleEpisodeFinished(message, sender)
      .then(sendResponse)
      .catch(err => sendResponse({ success: false, reason: String(err) }));
    return true; // async sendResponse
  }

  if (message.type === "OPEN_NEW_TAB") {
    if (!isFromAppTab(sender)) {
      console.warn("[SitcomShuffle Background] Ignoring OPEN_NEW_TAB from unexpected sender:", sender?.tab?.url);
      return false;
    }
    handleOpenTab(message)
      .then(sendResponse)
      .catch(err => sendResponse({ success: false, reason: String(err) }));
    return true;
  }

  // Content script saw which episode is playing: pass it on to the app (it decides what to learn)
  if (message.type === "EPISODE_OBSERVED") {
    if (!isFromStreamingTab(sender) || !isAllowedStreamingUrl(message.url)) return false;
    const payload = {
      type: "EPISODE_OBSERVED",
      platform: String(message.platform || ""),
      url: String(message.url),
      texts: (Array.isArray(message.texts) ? message.texts : [])
        .filter(t => typeof t === "string").map(t => t.slice(0, 160)).slice(0, 16)
    };
    chrome.tabs.query({ url: APP_URL_PATTERNS }).then(tabs => {
      tabs.forEach(tab => chrome.tabs.sendMessage(tab.id, payload).catch(() => {}));
    });
    return false;
  }

  // Content script on a streaming tab asks where it was supposed to go / says it arrived
  if (message.type === "GET_PENDING_NAVIGATION" || message.type === "CLEAR_PENDING_NAVIGATION") {
    if (!isFromStreamingTab(sender)) return false;
    const tabId = sender.tab.id;
    const work = message.type === "CLEAR_PENDING_NAVIGATION"
      ? clearPendingNavigation(tabId).then(() => ({ success: true }))
      : takePendingNavigation(tabId, { consume: Boolean(message.consume) }).then(p => ({ pending: p ? p.url : null }));
    work.then(sendResponse).catch(() => sendResponse({ pending: null }));
    return true;
  }

  if (message.type === "DEBUG_LOG") {
    if (isFromStreamingTab(sender)) dbg(`[tab ${sender.tab.id}] ${message.text}`);
    return false;
  }

  if (message.type === "PROFILE_PICKED" || message.type === "REOPEN_AFTER_PROFILE") {
    if (!isFromStreamingTab(sender)) return false;
    const work = message.type === "PROFILE_PICKED"
      ? markProfilePicked(sender.tab.id).then(() => ({ success: true }))
      : reopenTabAfterProfile(sender.tab);
    work.then(sendResponse).catch(() => sendResponse({ success: false }));
    return true;
  }

  return false;
});
