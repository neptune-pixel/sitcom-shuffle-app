import React, { useState } from 'react';
import { getShowById } from '../services/shuffleEngine';
import SeasonFilterModal from './modals/SeasonFilterModal';
import AddShowModal from './modals/AddShowModal';
import {
  Sliders,
  Plus,
  Link2,
  Filter,
  Trash2,
  Shuffle,
  GripVertical,
  ChevronUp,
  ChevronDown
} from 'lucide-react';

export default function PlaylistBuilder({
  rules,
  customLinks,
  onUpdateCount,
  onRemoveShow,
  onAddShow,
  onUpdateAllowedSeasons,
  onUpdatePlatform,
  onOpenEditLink,
  onRebuildQueue,
  onReorderRules
}) {
  const [filteringShowId, setFilteringShowId] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);

  // Active rule dynamically derived from latest rules
  const activeFilteringRule = rules.find(r => r.showId === filteringShowId);

  // Drag-and-drop state
  const [draggedIndex, setDraggedIndex] = useState(null);
  const [dragOverIndex, setDragOverIndex] = useState(null);

  const activeShowIds = rules.map(r => r.showId);

  const handleDragStart = (e, index) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', String(index));
  };

  const handleDragOver = (e, index) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (dragOverIndex !== index) {
      setDragOverIndex(index);
    }
  };

  const handleDragLeave = (e, index) => {
    if (dragOverIndex === index) {
      setDragOverIndex(null);
    }
  };

  const handleDrop = (e, dropIndex) => {
    e.preventDefault();
    if (draggedIndex !== null && draggedIndex !== dropIndex && onReorderRules) {
      onReorderRules(draggedIndex, dropIndex);
    }
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  const handleMoveUp = (index) => {
    if (index > 0 && onReorderRules) {
      onReorderRules(index, index - 1);
    }
  };

  const handleMoveDown = (index) => {
    if (index < rules.length - 1 && onReorderRules) {
      onReorderRules(index, index + 1);
    }
  };

  return (
    <aside className="sidebar-panel">
      {/* Main Playlist Builder Panel */}
      <div className="card-panel">
        <div className="panel-header">
          <h2 className="panel-title">
            <Sliders size={20} color="#6366F1" /> Karıştırma & Platformlar
          </h2>
          <button
            className="btn btn-glass"
            onClick={() => setShowAddModal(true)}
            style={{ fontSize: '0.82rem', padding: '6px 12px' }}
          >
            <Plus size={16} /> Dizi Ekle
          </button>
        </div>

        <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginBottom: '16px' }}>
          Dizileri sürükleyip bırakarak veya oklara tıklayarak sırayı değiştirebilir, oran ve platform seçebilirsiniz:
        </p>

        <div className="shows-rules-list">
          {rules.length === 0 ? (
            <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', textAlign: 'center', padding: '20px' }}>
              Oynatma listenizde dizi bulunmuyor. "Dizi Ekle" butonuna tıklayarak ekleyin.
            </p>
          ) : (
            rules.map((rule, index) => {
              const show = getShowById(rule.showId);
              if (!show) return null;

              const currentPlatform = rule.platform || show.platform;
              const hasCustomLink = Boolean(customLinks[`${show.id}_${currentPlatform}`] || customLinks[show.id]);
              const seasonText = rule.allowedSeasons && rule.allowedSeasons.length > 0
                ? `${rule.allowedSeasons.length} Sezon Seçili`
                : 'Tüm Sezonlar';

              const isDragging = draggedIndex === index;
              const isDragOver = dragOverIndex === index;

              return (
                <div
                  key={rule.showId}
                  className={`show-rule-item ${isDragging ? 'is-dragging' : ''} ${isDragOver ? 'drag-over' : ''}`}
                  draggable
                  onDragStart={(e) => handleDragStart(e, index)}
                  onDragOver={(e) => handleDragOver(e, index)}
                  onDragLeave={(e) => handleDragLeave(e, index)}
                  onDrop={(e) => handleDrop(e, index)}
                  onDragEnd={handleDragEnd}
                >
                  <div className="show-info">
                    {/* Reorder grip & arrow controls */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <div
                        className="drag-handle"
                        title="Sıralamayı değiştirmek için sürükleyin"
                      >
                        <GripVertical size={18} />
                      </div>

                      <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleMoveUp(index);
                          }}
                          disabled={index === 0}
                          className="reorder-arrow-btn"
                          title="Yukarı taşı"
                        >
                          <ChevronUp size={13} />
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleMoveDown(index);
                          }}
                          disabled={index === rules.length - 1}
                          className="reorder-arrow-btn"
                          title="Aşağı taşı"
                        >
                          <ChevronDown size={13} />
                        </button>
                      </div>
                    </div>

                    <img src={show.coverImage} alt={show.title} className="show-thumb" />
                    <div>
                      <div className="show-title-text">{show.title}</div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap', marginTop: '3px' }}>
                        <select
                          value={currentPlatform}
                          onChange={e => onUpdatePlatform(rule.showId, e.target.value)}
                          className={`show-platform-tag tag-${currentPlatform}`}
                          style={{ cursor: 'pointer', outline: 'none', appearance: 'auto', padding: '2px 4px' }}
                          title="Bu diziyi izlediğiniz platformu değiştirin"
                        >
                          <option value="netflix" style={{ background: '#121621', color: '#FFF' }}>Netflix</option>
                          <option value="disney" style={{ background: '#121621', color: '#FFF' }}>Disney+</option>
                          <option value="max" style={{ background: '#121621', color: '#FFF' }}>HBO Max</option>
                          <option value="prime" style={{ background: '#121621', color: '#FFF' }}>Prime Video</option>
                        </select>

                        <button
                          onClick={() => onOpenEditLink(show.id, currentPlatform)}
                          style={{ fontSize: '0.72rem', color: hasCustomLink ? '#34D399' : 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '3px', cursor: 'pointer' }}
                          title="Dizi sayfası linki: linki olmayan bölümleri bulmak için açılır"
                        >
                          <Link2 size={11} /> {hasCustomLink ? 'Dizi Sayfası ✓' : 'Dizi Sayfası'}
                        </button>

                        <button
                          onClick={() => setFilteringShowId(rule.showId)}
                          style={{ fontSize: '0.72rem', color: rule.allowedSeasons?.length > 0 ? '#A5B4FC' : 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '3px', cursor: 'pointer' }}
                          title="Sezonları Filtrele"
                        >
                          <Filter size={11} /> {seasonText}
                        </button>
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div className="ratio-counter">
                      <button
                        className="btn-counter"
                        onClick={() => onUpdateCount(rule.showId, rule.count - 1)}
                        title="Oranı Azalt"
                      >
                        -
                      </button>
                      <span className="counter-value">{rule.count}</span>
                      <button
                        className="btn-counter"
                        onClick={() => onUpdateCount(rule.showId, rule.count + 1)}
                        title="Oranı Artır"
                      >
                        +
                      </button>
                    </div>

                    <button
                      onClick={() => onRemoveShow(rule.showId)}
                      style={{ color: 'var(--text-muted)', padding: '4px', cursor: 'pointer' }}
                      title="Listeden Çıkar"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        <div style={{ marginTop: '20px' }}>
          <button
            className="btn btn-primary"
            onClick={onRebuildQueue}
            style={{ width: '100%', justifyContent: 'center', padding: '14px' }}
          >
            <Shuffle size={18} /> Oynatma Akışını Yeniden Karıştır
          </button>
        </div>
      </div>

      {activeFilteringRule && (
        <SeasonFilterModal
          rule={activeFilteringRule}
          onUpdateAllowedSeasons={onUpdateAllowedSeasons}
          onClose={() => setFilteringShowId(null)}
        />
      )}

      {showAddModal && (
        <AddShowModal
          activeShowIds={activeShowIds}
          onAddShow={onAddShow}
          onClose={() => setShowAddModal(false)}
        />
      )}
    </aside>
  );
}