import React, { useState } from 'react';
import Modal from './Modal';
import { getShowById } from '../../services/shuffleEngine';
import { Check, CheckSquare } from 'lucide-react';

export default function SeasonFilterModal({ rule, onUpdateAllowedSeasons, onClose }) {
  const show = getShowById(rule.showId);
  const allSeasonNums = (show?.seasons || []).map(s => s.season);

  // Initialize selected seasons: if empty or unset in rule, all seasons are active
  const [selectedSeasons, setSelectedSeasons] = useState(() => {
    if (!rule.allowedSeasons || rule.allowedSeasons.length === 0) {
      return [...allSeasonNums];
    }
    return [...rule.allowedSeasons];
  });

  if (!show) return null;

  const isAllSelected = selectedSeasons.length === allSeasonNums.length;

  const toggleSeason = (seasonNum) => {
    let next;
    if (selectedSeasons.includes(seasonNum)) {
      // Keep at least 1 season selected so the show always has playable episodes
      if (selectedSeasons.length === 1) {
        return;
      }
      next = selectedSeasons.filter(s => s !== seasonNum);
    } else {
      next = [...selectedSeasons, seasonNum].sort((a, b) => a - b);
    }

    setSelectedSeasons(next);
    // If all are selected, persist as empty array [] (engine convention for "all seasons")
    const persisted = next.length === allSeasonNums.length ? [] : next;
    onUpdateAllowedSeasons(rule.showId, persisted);
  };

  const handleSelectAll = () => {
    setSelectedSeasons([...allSeasonNums]);
    onUpdateAllowedSeasons(rule.showId, []);
  };

  return (
    <Modal
      title={`${show.title} — Sezon Filtresi`}
      subtitle="Yalnızca işaretlediğiniz sezonlardan rastgele bölüm getirilir."
      onClose={onClose}
    >

      {/* Toolbar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '16px', marginBottom: '8px' }}>
        <span style={{ fontSize: '0.84rem', color: isAllSelected ? '#34D399' : '#A5B4FC', fontWeight: 600 }}>
          {isAllSelected
            ? `Tüm Sezonlar Aktif (${allSeasonNums.length} Sezon)`
            : `${selectedSeasons.length} / ${allSeasonNums.length} Sezon Seçili`}
        </span>

        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            type="button"
            className="btn btn-glass"
            onClick={handleSelectAll}
            disabled={isAllSelected}
            style={{ fontSize: '0.8rem', padding: '6px 12px', opacity: isAllSelected ? 0.5 : 1 }}
          >
            <CheckSquare size={14} /> Tümünü Seç
          </button>
        </div>
      </div>

      {/* Seasons Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: '12px', padding: '6px 0' }}>
        {show.seasons.map(s => {
          const isChecked = selectedSeasons.includes(s.season);
          return (
            <div
              key={s.season}
              onClick={() => toggleSeason(s.season)}
              role="checkbox"
              aria-checked={isChecked}
              style={{
                padding: '14px',
                borderRadius: 'var(--radius-md)',
                background: isChecked ? 'rgba(99, 102, 241, 0.18)' : 'rgba(255, 255, 255, 0.03)',
                border: isChecked ? '1px solid rgba(99, 102, 241, 0.6)' : '1px solid var(--border-glass)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                transition: 'all var(--transition-fast)',
                userSelect: 'none'
              }}
            >
              <div>
                <div style={{ fontWeight: 700, fontSize: '0.95rem', color: isChecked ? '#FFF' : 'var(--text-muted)' }}>
                  {s.season}. Sezon
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                  {s.episodeCount - (show.unavailableEpisodes?.[rule.platform || show.platform] || []).filter(c => c.startsWith(`S${String(s.season).padStart(2, '0')}E`)).length} Bölüm
                </div>
              </div>

              <div
                style={{
                  width: '22px',
                  height: '22px',
                  borderRadius: '6px',
                  background: isChecked ? 'var(--accent-primary)' : 'rgba(255, 255, 255, 0.1)',
                  border: isChecked ? 'none' : '1px solid rgba(255, 255, 255, 0.2)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'white',
                  transition: 'all var(--transition-fast)'
                }}
              >
                {isChecked && <Check size={14} strokeWidth={3} />}
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '16px' }}>
        <button className="btn btn-primary" onClick={onClose} style={{ padding: '10px 20px' }}>
          Kaydet & Kapat
        </button>
      </div>
    </Modal>
  );
}
