import React, { useState } from 'react';
import { getShowById } from '../services/shuffleEngine';
import { List, LayoutGrid, Play, ChevronRight } from 'lucide-react';

export default function QueueList({ queue, currentIndex, onSelectQueueItem }) {
  const [viewMode, setViewMode] = useState('list'); // 'list' | 'grid'
  const [showLimit, setShowLimit] = useState('all'); // 'all' | '5'

  if (!queue || queue.length === 0) return null;

  const upcomingQueue = queue.slice(currentIndex);
  const displayedItems = showLimit === '5' ? upcomingQueue.slice(0, 5) : upcomingQueue;

  return (
    <div className="queue-panel card-panel">
      <div className="queue-controls-bar">
        <h3 className="panel-title" style={{ fontSize: '1.1rem', margin: 0 }}>
          <List size={18} color="#6366F1" /> Sıradaki Oynatma Akışı ({upcomingQueue.length} Bölüm)
        </h3>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {/* Filter Limit Toggle */}
          <div className="view-mode-toggle">
            <button
              className={`btn-toggle-mode ${showLimit === 'all' ? 'active' : ''}`}
              onClick={() => setShowLimit('all')}
            >
              Tüm Akış
            </button>
            <button
              className={`btn-toggle-mode ${showLimit === '5' ? 'active' : ''}`}
              onClick={() => setShowLimit('5')}
            >
              Sıradaki 5
            </button>
          </div>

          {/* View Mode Toggle */}
          <div className="view-mode-toggle">
            <button
              className={`btn-toggle-mode ${viewMode === 'list' ? 'active' : ''}`}
              onClick={() => setViewMode('list')}
              title="Liste Görünümü"
            >
              <List size={14} /> Liste
            </button>
            <button
              className={`btn-toggle-mode ${viewMode === 'grid' ? 'active' : ''}`}
              onClick={() => setViewMode('grid')}
              title="Izgara Görünümü"
            >
              <LayoutGrid size={14} /> Izgara
            </button>
          </div>
        </div>
      </div>

      <div className="queue-container-scroll">
        {viewMode === 'list' ? (
          /* COMPACT LIST VIEW */
          <div className="queue-list-view">
            {displayedItems.map((item, index) => {
              const actualIndex = currentIndex + index;
              const isCurrent = actualIndex === currentIndex;
              const show = getShowById(item.showId);

              return (
                <div
                  key={item.queueId || index}
                  className={`queue-list-row ${isCurrent ? 'is-active' : ''}`}
                  onClick={() => onSelectQueueItem(actualIndex)}
                >
                  <div className="queue-row-left">
                    <div className="queue-number-badge">
                      {isCurrent ? <Play size={14} fill="currentColor" /> : `#${index + 1}`}
                    </div>

                    <img
                      src={show?.coverImage || ''}
                      alt={item.showTitle}
                      style={{ width: '36px', height: '36px', borderRadius: '6px', objectFit: 'cover' }}
                    />

                    <div className="queue-row-details">
                      <div className="queue-row-title">
                        {item.showTitle} — <span style={{ fontWeight: 600, color: '#A5B4FC' }}>{item.title}</span>
                      </div>
                      <div className="queue-row-sub">
                        <span className={`show-platform-tag tag-${item.platform}`}>
                          {item.platformName}
                        </span>
                        <span>{item.season}. Sezon {item.displayEpisode ?? item.episode}. Bölüm</span>
                        <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>({item.displayCode || item.episodeCode})</span>
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    {isCurrent ? (
                      <span style={{ fontSize: '0.78rem', fontWeight: 800, color: '#A5B4FC', background: 'rgba(99, 102, 241, 0.2)', padding: '4px 10px', borderRadius: '6px' }}>
                        ▶ ŞİMDİ İZLENİYOR
                      </span>
                    ) : (
                      <button className="btn btn-glass" style={{ fontSize: '0.75rem', padding: '4px 10px' }}>
                        Atla <ChevronRight size={12} />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          /* GRID VIEW */
          <div className="queue-grid-view">
            {displayedItems.map((item, index) => {
              const actualIndex = currentIndex + index;
              const isCurrent = actualIndex === currentIndex;

              return (
                <div
                  key={item.queueId || index}
                  className={`queue-grid-card ${isCurrent ? 'is-active' : ''}`}
                  onClick={() => onSelectQueueItem(actualIndex)}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span className={`show-platform-tag tag-${item.platform}`}>
                      {item.platformName}
                    </span>
                    <span style={{ fontSize: '0.75rem', fontWeight: 800, color: isCurrent ? '#A5B4FC' : 'var(--text-muted)' }}>
                      {isCurrent ? '▶ ŞİMDİ' : `#${index + 1}`}
                    </span>
                  </div>

                  <div style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {item.showTitle}
                  </div>

                  <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                    {item.displayCode || item.episodeCode} • {item.title}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
