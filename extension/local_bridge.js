// Local bridge between SitcomShuffle web app and Chrome extension background script

const EXTENSION_VERSION = chrome.runtime.getManifest().version;

chrome.runtime.onMessage.addListener((message) => {
  if (message.type === "EPISODE_OBSERVED") {
    window.postMessage({
      type: "SITCOM_SHUFFLE_EPISODE_OBSERVED",
      platform: message.platform,
      url: message.url,
      texts: message.texts
    }, window.location.origin);
    return;
  }
  if (message.type === "PLAY_NEXT_EPISODE") {
    console.log("[SitcomShuffle Bridge] Received PLAY_NEXT_EPISODE from background, relaying to web app window...");
    window.postMessage({ 
      type: "SITCOM_SHUFFLE_PLAY_NEXT",
      videoTabId: message.videoTabId,
      reason: message.reason
    }, window.location.origin);
  }
});

window.addEventListener("message", (event) => {
  if (event.source !== window || event.origin !== window.location.origin) return;
  if (!event.data || typeof event.data !== "object") return;

  if (event.data.type === "SITCOM_SHUFFLE_OPEN_TAB") {
    console.log("[SitcomShuffle Bridge] Web app requested OPEN_TAB for:", event.data.url);
    chrome.runtime.sendMessage({ 
      type: "OPEN_NEW_TAB", 
      url: event.data.url,
      tabId: event.data.videoTabId 
    });
  } else if (event.data.type === "SITCOM_SHUFFLE_PING") {
    // Respond to web app ping
    window.postMessage({ type: "SITCOM_SHUFFLE_EXTENSION_CONNECTED", version: EXTENSION_VERSION }, window.location.origin);
  }
});

// Announce presence immediately upon injection
window.postMessage({ type: "SITCOM_SHUFFLE_EXTENSION_CONNECTED", version: EXTENSION_VERSION }, window.location.origin);
console.log(`[SitcomShuffle Bridge v${EXTENSION_VERSION}] local_bridge.js initialized and announced to window.`);
