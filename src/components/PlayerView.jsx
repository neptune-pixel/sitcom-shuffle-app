import React, { useState } from 'react';
import { getShowById } from '../services/shuffleEngine';
import { Play, Shuffle, SkipForward, CheckCircle, ExternalLink, Star, Copy, Check, Info, Link2, Search } from 'lucide-react';
import confetti from 'canvas-confetti';

export default function PlayerView({
  currentEpisode,
  onRerollCurrent,
  onPlayNext,
  onMarkWatched,
  onOpenEditLink,
  isWatched
}) {
  const [copiedInfo, setCopiedInfo] = useState(false);

  if (!currentEpisode) {
    return (
      <section className="player-section">
        <div className="tv-screen-container" style={{ justifyContent: 'center', alignItems: 'center', textAlign: 'center', padding: '40px' }}>
          <div style={{ color: 'var(--text-muted)', fontSize: '1.1rem' }}>
            Oynatma listenizde henüz aktif bölüm bulunmuyor. Sol taraftan dizi ekleyin ve "Akışı Karıştır" butonuna basın!
          </div>
        </div>
      </section>
    );
  }

  const show = getShowById(currentEpisode.showId);
  const backdrop = show?.backdropImage || show?.coverImage;
  const shownEpisode = currentEpisode.displayEpisode ?? currentEpisode.episode;
  const shownCode = currentEpisode.displayCode || currentEpisode.episodeCode;
  const episodeInfoText = `${currentEpisode.showTitle} - ${currentEpisode.season}. Sezon ${shownEpisode}. Bölüm (${currentEpisode.title})`;

  const handleCopyInfo = () => {
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(episodeInfoText).catch(() => {});
      } else {
        const textarea = document.createElement('textarea');
        textarea.value = episodeInfoText;
        textarea.style.position = 'fixed';
        textarea.style.opacity = '0';
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
      }
      setCopiedInfo(true);
      setTimeout(() => setCopiedInfo(false), 2500);
    } catch (e) {
      console.warn('Clipboard copy error:', e);
    }
  };

  const handleLaunch = () => {
    // 1. Safe clipboard copy (never crashes on mobile / non-https)
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(episodeInfoText).catch(() => {});
        setCopiedInfo(true);
        setTimeout(() => setCopiedInfo(false), 3000);
      }
    } catch {
      // Ignore clipboard restriction on mobile/HTTP
    }

    // 2. Launch festive confetti
    try {
      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.6 }
      });
    } catch {
      // Ignore
    }
  };

  return (
    <section className="player-section">
      <div className="tv-screen-container">
        {/* Backdrop Image & Overlay */}
        {backdrop && <img src={backdrop} alt={currentEpisode.showTitle} className="tv-backdrop" />}
        <div className="tv-overlay-gradient" />

        {/* Content Box */}
        <div className="tv-content-box">
          <div className="tv-badge-row">
            <span className="episode-code-badge">{shownCode}</span>
            <span className={`show-platform-tag tag-${currentEpisode.platform}`} style={{ fontSize: '0.85rem', padding: '4px 10px' }}>
              {currentEpisode.platformName} Doğrudan Oynatıcı
            </span>
            {show?.imdbRating && (
              <span style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.88rem', color: '#FBBF24', background: 'rgba(0,0,0,0.5)', padding: '4px 10px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)' }}>
                <Star size={14} fill="#FBBF24" color="#FBBF24" /> IMDb {show.imdbRating}
              </span>
            )}
            {isWatched && (
              <span style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.82rem', color: '#34D399', background: 'rgba(52,211,153,0.15)', padding: '4px 10px', borderRadius: '8px', border: '1px solid rgba(52,211,153,0.3)' }}>
                <CheckCircle size={14} /> İzlendi
              </span>
            )}
          </div>

          <div>
            <h2 className="tv-show-title">{currentEpisode.showTitle}</h2>
            <h3 className="tv-episode-title" style={{ fontSize: '1.25rem', fontWeight: 600, color: '#A5B4FC', marginTop: '6px' }}>
              {currentEpisode.season}. Sezon {shownEpisode}. Bölüm
              {currentEpisode.title && !currentEpisode.title.startsWith('Bölüm') ? ` — ${currentEpisode.title}` : ''}
            </h3>
          </div>

          {currentEpisode.description && !currentEpisode.description.includes('. Sezon ') && (
            <p className="tv-synopsis">{currentEpisode.description}</p>
          )}

          {/* Target Episode Helper Banner */}
          <div
            style={{
              padding: '10px 16px',
              borderRadius: 'var(--radius-md)',
              background: 'rgba(0, 0, 0, 0.65)',
              backdropFilter: 'blur(12px)',
              border: '1px solid rgba(99, 102, 241, 0.3)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '12px',
              maxWidth: '800px',
              marginTop: '8px'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
              <Info size={16} color="#A5B4FC" style={{ flexShrink: 0 }} />
              <span>Doğrudan Bölüm Oynatıcı Bağlantısı</span>
            </div>

            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                className="btn btn-glass"
                onClick={() => onOpenEditLink(currentEpisode.showId, currentEpisode.platform, currentEpisode.episodeCode, shownCode)}
                style={{ fontSize: '0.78rem', padding: '6px 12px', flexShrink: 0 }}
                title="Bu spesifik bölüm için kendi direkt watch/ ID linkinizi yapıştırın"
              >
                <Link2 size={14} /> Bölüm Linkini Düzenle
              </button>

              <button
                className="btn btn-glass"
                onClick={handleCopyInfo}
                style={{ fontSize: '0.78rem', padding: '6px 12px', flexShrink: 0 }}
              >
                {copiedInfo ? <Check size={14} color="#34D399" /> : <Copy size={14} />}
                {copiedInfo ? 'Kopyalandı!' : 'Bilgiyi Kopyala'}
              </button>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="tv-actions-bar">
            {currentEpisode.watchUrl ? (
              <a
                href={currentEpisode.watchUrl}
                target="_blank"
                rel="noopener noreferrer"
                className={`btn btn-launch-big ${currentEpisode.platform === 'netflix' ? 'btn-netflix' : 'btn-primary'}`}
                onClick={handleLaunch}
              >
                <Play size={22} fill="currentColor" /> {currentEpisode.platformName}'da Bölümü Başlat
                <ExternalLink size={18} />
              </a>
            ) : (
              <button
                className="btn btn-launch-big"
                style={{ background: 'linear-gradient(135deg, #F59E0B, #D97706)', color: '#FFF' }}
                onClick={() => onOpenEditLink(currentEpisode.showId, currentEpisode.platform, currentEpisode.episodeCode, shownCode)}
              >
                <Link2 size={22} /> ⚠️ Bölüm Linki Yapıştır ({shownCode})
              </button>
            )}

            {/* No direct link yet: open the show page (or the platform) to find this episode.
                The episode info is copied so it can be pasted into the platform's search. */}
            {!currentEpisode.watchUrl && currentEpisode.showPageUrl && (
              <a
                href={currentEpisode.showPageUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-glass"
                onClick={handleCopyInfo}
                title={currentEpisode.showPageIsSpecific
                  ? 'Dizinin sayfasını açar; bölümü bulup linkini buraya yapıştırın. Bölüm bilgisi panoya kopyalanır.'
                  : `${currentEpisode.platformName} açılır; diziyi aratıp bölümü bulun. Bölüm bilgisi panoya kopyalanır.`}
              >
                <Search size={18} />
                {currentEpisode.showPageIsSpecific ? 'Dizi Sayfasını Aç' : `${currentEpisode.platformName}'ı Aç`}
                <ExternalLink size={14} />
              </a>
            )}

            <button className="btn btn-glass" onClick={onRerollCurrent} title="Bu diziden başka rastgele bölüm getir">
              <Shuffle size={18} /> Başka Bölüm Çek
            </button>

            <button className="btn btn-glass" onClick={onPlayNext} title="Kuyruktaki sıradaki bölüme geç">
              <SkipForward size={18} /> Sonraki Bölüm
            </button>

            <button
              className="btn btn-glass"
              onClick={() => onMarkWatched(currentEpisode)}
              style={{ color: isWatched ? '#34D399' : 'var(--text-primary)' }}
              title="İzlendi işaretle"
            >
              <CheckCircle size={18} />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
