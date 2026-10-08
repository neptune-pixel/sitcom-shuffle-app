import React, { useState, useEffect, useLayoutEffect, useMemo } from 'react';
import Header from './components/Header';
import PlaylistBuilder from './components/PlaylistBuilder';
import PlayerView from './components/PlayerView';
import QueueList from './components/QueueList';
import ExtensionGuideModal from './components/modals/ExtensionGuideModal';
import EditLinkModal from './components/modals/EditLinkModal';
import { generatePlaylistQueue, pickRandomEpisodeForShow, refreshQueueLinks, getShowById } from './services/shuffleEngine';
import { DEFAULT_PRESETS } from './data/sitcomsData';
import { learnFromObservation, describeLearning } from './services/linkLearner';

const INITIAL_RULES = DEFAULT_PRESETS[0].rules; // "Varsayılan Akış (8 Dizi)"
const QUEUE_LENGTH = 25;

// Read JSON from localStorage without crashing on missing/corrupt data
function loadJSON(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch (e) {
    console.warn(`[SitcomShuffle App] Could not read "${key}" from storage, using default.`, e);
    return fallback;
  }
}

function saveJSON(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    console.warn(`[SitcomShuffle App] Could not save "${key}" to storage.`, e);
  }
}

const isSameEpisode = (a, b) => a.showId === b.showId && a.season === b.season && a.episode === b.episode;

export default function App() {
  const [rules, setRules] = useState(() => {
    let isMigrated = false;
    try { isMigrated = Boolean(localStorage.getItem('sitcom_shuffle_rules_v2')); } catch { /* storage unavailable */ }
    if (isMigrated) {
      const saved = loadJSON('sitcom_shuffle_rules', INITIAL_RULES);
      return Array.isArray(saved) ? saved : INITIAL_RULES;
    }
    // Automatically initialize with the new 8-show default sequence
    try { localStorage.setItem('sitcom_shuffle_rules_v2', 'true'); } catch { /* storage unavailable */ }
    saveJSON('sitcom_shuffle_rules', INITIAL_RULES);
    return INITIAL_RULES;
  });

  const [autoPlayEnabled, setAutoPlayEnabled] = useState(() => loadJSON('sitcom_shuffle_autoplay', true) !== false);

  const [watchedList, setWatchedList] = useState(() => {
    const saved = loadJSON('sitcom_shuffle_watched', []);
    return Array.isArray(saved) ? saved : [];
  });

  const [customLinks, setCustomLinks] = useState(() => {
    const saved = loadJSON('sitcom_shuffle_custom_links', {});
    return saved && typeof saved === 'object' && !Array.isArray(saved) ? saved : {};
  });

  // Links learned by the extension from real playback ("learned:..." / "bad:..." keys) and a log of changes
  const [learnedLinks, setLearnedLinks] = useState(() => {
    const saved = loadJSON('sitcom_shuffle_learned_links', {});
    return saved && typeof saved === 'object' && !Array.isArray(saved) ? saved : {};
  });
  const [learnLog, setLearnLog] = useState(() => {
    const saved = loadJSON('sitcom_shuffle_learn_log', []);
    return Array.isArray(saved) ? saved : [];
  });
  const [toasts, setToasts] = useState([]);

  // Everything the engine uses to find links: pasted links win over learned ones
  const allLinks = useMemo(() => ({ ...learnedLinks, ...customLinks }), [learnedLinks, customLinks]);

  const [queue, setQueue] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showGuideModal, setShowGuideModal] = useState(false);
  const [editingLinkTarget, setEditingLinkTarget] = useState(null); // { showId, platform, episodeCode }
  const [extensionConnected, setExtensionConnected] = useState(false);
  const [extensionVersion, setExtensionVersion] = useState(null);

  // Always-current snapshot of state for the extension message listener,
  // which is registered once and would otherwise see stale values.
  // Synced in a layout effect (not during render); layout effects run before the effects below.
  const latestRef = React.useRef({});
  useLayoutEffect(() => {
    latestRef.current = { queue, currentIndex, autoPlayEnabled, rules, watchedList, customLinks, allLinks };
  });

  // Save state to localStorage
  useEffect(() => { saveJSON('sitcom_shuffle_rules', rules); }, [rules]);
  useEffect(() => { saveJSON('sitcom_shuffle_autoplay', autoPlayEnabled); }, [autoPlayEnabled]);
  useEffect(() => { saveJSON('sitcom_shuffle_watched', watchedList); }, [watchedList]);
  useEffect(() => { saveJSON('sitcom_shuffle_custom_links', customLinks); }, [customLinks]);
  useEffect(() => { saveJSON('sitcom_shuffle_learned_links', learnedLinks); }, [learnedLinks]);
  useEffect(() => { saveJSON('sitcom_shuffle_learn_log', learnLog); }, [learnLog]);

  // Rules changed (count, seasons, platform, order, show added/removed):
  // keep the episode currently on screen and reshuffle only what comes after it.
  useEffect(() => {
    const { queue: prevQueue, currentIndex: prevIndex, watchedList: watched, allLinks: links } = latestRef.current;
    const current = prevQueue[prevIndex];
    const currentStillValid = current && rules.some(r => r.showId === current.showId && r.count > 0);

    if (!currentStillValid) {
      setQueue(generatePlaylistQueue(rules, watched, QUEUE_LENGTH, links));
      setCurrentIndex(0);
      return;
    }

    const [refreshedCurrent] = refreshQueueLinks([current], rules, links);
    const upcoming = generatePlaylistQueue(rules, [...watched, current], QUEUE_LENGTH - 1, links);
    setQueue([refreshedCurrent, ...upcoming]);
    setCurrentIndex(0);
  }, [rules]);

  // Links changed: update URLs in place, never reshuffle or move the position.
  const isFirstLinksRun = React.useRef(true);
  useEffect(() => {
    if (isFirstLinksRun.current) {
      isFirstLinksRun.current = false;
      return;
    }
    setQueue(prev => refreshQueueLinks(prev, latestRef.current.rules, allLinks));
  }, [allLinks]);

  // Build a fresh queue from the latest state (safe to call from the extension listener)
  const buildFreshQueue = (extraWatched = []) => {
    const { rules: r, watchedList: w, allLinks: l } = latestRef.current;
    return generatePlaylistQueue(r, [...w, ...extraWatched], QUEUE_LENGTH, l);
  };

  const handleRebuildQueue = () => {
    setQueue(buildFreshQueue());
    setCurrentIndex(0);
  };

  const handleUpdateCount = (showId, newCount) => {
    if (newCount < 0) return;
    setRules(prev => prev.map(r => r.showId === showId ? { ...r, count: newCount } : r));
  };

  const handleRemoveShow = (showId) => {
    setRules(prev => prev.filter(r => r.showId !== showId));
  };

  const handleAddShow = (showId) => {
    const defaultPlatform = getShowById(showId)?.platform || 'netflix';
    setRules(prev => [...prev, { showId, count: 1, allowedSeasons: [], platform: defaultPlatform }]);
  };

  const handleUpdateAllowedSeasons = (showId, allowedSeasons) => {
    setRules(prev => prev.map(r => r.showId === showId ? { ...r, allowedSeasons } : r));
  };

  const handleUpdatePlatform = (showId, platform) => {
    setRules(prev => prev.map(r => r.showId === showId ? { ...r, platform } : r));
  };

  const handleSaveLink = (showId, platform, episodeCode, url) => {
    setCustomLinks(prev => {
      const copy = { ...prev };
      const key = episodeCode ? `${showId}_${platform}_${episodeCode}` : `${showId}_${platform}`;
      if (url) {
        copy[key] = url;
      } else {
        delete copy[key];
        if (!episodeCode) delete copy[showId];
      }
      return copy;
    });
  };

  const currentEpisode = queue[currentIndex] || null;

  const handleRerollCurrent = () => {
    if (!currentEpisode) return;
    const rule = rules.find(r => r.showId === currentEpisode.showId);
    const allowedSeasons = rule?.allowedSeasons || [];
    const customPlatform = rule?.platform || null;
    const newEp = pickRandomEpisodeForShow(currentEpisode.showId, allowedSeasons, watchedList, customPlatform, allLinks);

    if (newEp) {
      setQueue(prev => {
        const copy = [...prev];
        copy[currentIndex] = {
          ...newEp,
          queueId: `${newEp.showId}-${newEp.season}-${newEp.episode}-${Math.random().toString(36).substr(2, 9)}`
        };
        return copy;
      });
    }
  };

  const addToWatched = (episode) => {
    if (!episode) return;
    setWatchedList(prev => (prev.some(w => isSameEpisode(w, episode)) ? prev : [...prev, episode]));
  };

  const handlePlayNext = (justWatched = null) => {
    if (currentIndex + 1 < queue.length) {
      setCurrentIndex(prev => prev + 1);
    } else {
      setQueue(buildFreshQueue(justWatched ? [justWatched] : []));
      setCurrentIndex(0);
    }
  };

  const handleMarkWatched = (episode) => {
    if (!episode) return;
    addToWatched(episode);
    handlePlayNext(episode);
  };

  const pushToast = (text) => {
    const id = Math.random().toString(36).slice(2);
    setToasts(prev => [...prev.slice(-3), { id, text }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 7000);
  };

  // The extension saw which episode is really playing at which URL: learn / fix links
  const handleEpisodeObserved = (observation) => {
    const result = learnFromObservation(observation, latestRef.current.allLinks);
    if (!result) {
      console.log('[SitcomShuffle App] Could not identify the playing episode from:', observation.texts);
      return;
    }
    if (result.kind === 'confirmed' || result.kind === 'custom') {
      console.log(`[SitcomShuffle App] Link ${result.kind}:`, result.entry.showTitle, result.entry.displayCode);
      return;
    }
    console.log('[SitcomShuffle App] Learned link:', result);
    setLearnedLinks(prev => {
      const next = { ...prev, ...result.set };
      result.remove.forEach(key => delete next[key]);
      return next;
    });
    setLearnLog(prev => [result.entry, ...prev].slice(0, 50));
    const message = describeLearning(result);
    if (message) pushToast(message);
  };

  const handleResetLearned = () => {
    if (window.confirm('Eklentinin izlerken öğrendiği tüm bölüm linkleri silinsin mi?')) {
      setLearnedLinks({});
      setLearnLog([]);
    }
  };

  // Handle auto-play from Extension
  useEffect(() => {
    const handleMessage = (event) => {
      if (event.source !== window) return;

      if (!event.data || typeof event.data !== 'object') return;

      if (event.data.type === "SITCOM_SHUFFLE_EXTENSION_CONNECTED") {
        setExtensionConnected(true);
        if (event.data.version) setExtensionVersion(String(event.data.version));
      } else if (event.data.type === "SITCOM_SHUFFLE_EPISODE_OBSERVED") {
        handleEpisodeObserved(event.data);
      } else if (event.data.type === "SITCOM_SHUFFLE_PLAY_NEXT") {
        const { queue: currentQueue, currentIndex: currentIdx, autoPlayEnabled: autoPlayOn } = latestRef.current;
        if (!autoPlayOn) {
          console.log("[SitcomShuffle App] AutoPlay is disabled in settings, ignoring trigger.");
          return;
        }

        console.log("[SitcomShuffle App] Extension signaled EPISODE_FINISHED! Advancing queue...", event.data);

        // 1. Mark current episode as watched
        const current = currentQueue[currentIdx];
        addToWatched(current);

        // 2. Advance to next episode (rebuild from latest state at the end of the queue)
        let nextEp;
        if (currentIdx + 1 < currentQueue.length) {
          nextEp = currentQueue[currentIdx + 1];
          setCurrentIndex(currentIdx + 1);
        } else {
          console.log("[SitcomShuffle App] End of queue reached. Rebuilding queue...");
          const freshQueue = buildFreshQueue(current ? [current] : []);
          setQueue(freshQueue);
          setCurrentIndex(0);
          nextEp = freshQueue[0];
        }

        // 3. Open the next episode in the video tab
        if (nextEp && nextEp.watchUrl) {
          console.log("[SitcomShuffle App] Triggering OPEN_TAB for next episode:", nextEp.watchUrl);
          window.postMessage({
            type: "SITCOM_SHUFFLE_OPEN_TAB",
            url: nextEp.watchUrl,
            videoTabId: event.data.videoTabId
          }, window.location.origin);
        } else if (nextEp) {
          console.warn("[SitcomShuffle App] Next episode has no direct link yet, waiting for the user:", nextEp.episodeCode);
        }
      }
    };

    window.addEventListener("message", handleMessage);

    // Initial ping & recurring keep-alive
    window.postMessage({ type: "SITCOM_SHUFFLE_PING" }, window.location.origin);
    const pingId = setInterval(() => {
      window.postMessage({ type: "SITCOM_SHUFFLE_PING" }, window.location.origin);
    }, 2500);

    return () => {
      window.removeEventListener("message", handleMessage);
      clearInterval(pingId);
    };
  }, []);

  const isCurrentWatched = Boolean(
    currentEpisode && watchedList.some(w => isSameEpisode(w, currentEpisode))
  );

  const handleResetAll = () => {
    if (window.confirm('Tüm kuralları, özel linkleri ve izleme geçmişinizi sıfırlamak istediğinize emin misiniz?')) {
      localStorage.removeItem('sitcom_shuffle_rules');
      localStorage.removeItem('sitcom_shuffle_watched');
      localStorage.removeItem('sitcom_shuffle_custom_links');
      setWatchedList([]);
      setCustomLinks({});
      setRules(INITIAL_RULES);
    }
  };

  const handleReorderRules = (startIndex, endIndex) => {
    setRules(prev => {
      const result = Array.from(prev);
      const [removed] = result.splice(startIndex, 1);
      result.splice(endIndex, 0, removed);
      return result;
    });
  };

  return (
    <div className="app-container">
      <Header
        onOpenGuide={() => setShowGuideModal(true)}
        onResetAll={handleResetAll}
        autoPlayEnabled={autoPlayEnabled}
        onToggleAutoPlay={() => setAutoPlayEnabled(!autoPlayEnabled)}
        extensionConnected={extensionConnected}
      />

      <div className="main-grid">
        <PlaylistBuilder
          rules={rules}
          customLinks={customLinks}
          onUpdateCount={handleUpdateCount}
          onRemoveShow={handleRemoveShow}
          onAddShow={handleAddShow}
          onUpdateAllowedSeasons={handleUpdateAllowedSeasons}
          onUpdatePlatform={handleUpdatePlatform}
          onOpenEditLink={(showId, platform) => setEditingLinkTarget({ showId, platform, episodeCode: null })}
          onRebuildQueue={handleRebuildQueue}
          onReorderRules={handleReorderRules}
        />

        <div className="right-column">
          <PlayerView
            currentEpisode={currentEpisode}
            onRerollCurrent={handleRerollCurrent}
            onPlayNext={() => handlePlayNext()}
            onMarkWatched={handleMarkWatched}
            onOpenEditLink={(showId, platform, episodeCode, displayCode) => setEditingLinkTarget({ showId, platform, episodeCode, displayCode })}
            isWatched={isCurrentWatched}
          />

          <QueueList
            queue={queue}
            currentIndex={currentIndex}
            onSelectQueueItem={index => setCurrentIndex(index)}
          />
        </div>
      </div>

      {showGuideModal && (
        <ExtensionGuideModal
          onClose={() => setShowGuideModal(false)}
          extensionConnected={extensionConnected}
          extensionVersion={extensionVersion}
          learnLog={learnLog}
          learnedCount={Object.keys(learnedLinks).filter(k => k.startsWith('learned:')).length}
          onResetLearned={handleResetLearned}
          onSimulateNext={() => window.postMessage({ type: "SITCOM_SHUFFLE_PLAY_NEXT" }, window.location.origin)}
        />
      )}

      {editingLinkTarget && (
        <EditLinkModal
          showId={editingLinkTarget.showId}
          currentPlatform={editingLinkTarget.platform}
          episodeCode={editingLinkTarget.episodeCode}
          displayCode={editingLinkTarget.displayCode}
          currentCustomUrl={
            editingLinkTarget.episodeCode
              ? (customLinks[`${editingLinkTarget.showId}_${editingLinkTarget.platform}_${editingLinkTarget.episodeCode}`] ||
                 customLinks[`${editingLinkTarget.showId}_${editingLinkTarget.episodeCode}`] || '')
              : (customLinks[`${editingLinkTarget.showId}_${editingLinkTarget.platform}`] ||
                 customLinks[editingLinkTarget.showId] || '')
          }
          onSaveLink={handleSaveLink}
          onClose={() => setEditingLinkTarget(null)}
        />
      )}
      {toasts.length > 0 && (
        <div className="toast-stack" role="status" aria-live="polite">
          {toasts.map(t => (
            <div key={t.id} className="toast">{t.text}</div>
          ))}
        </div>
      )}
    </div>
  );
}
