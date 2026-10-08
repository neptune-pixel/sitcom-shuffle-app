import React, { useState } from 'react';
import Modal from './Modal';
import { SITCOMS_DATABASE } from '../../data/sitcomsData';
import { Plus, Search, Star } from 'lucide-react';

export default function AddShowModal({ activeShowIds, onAddShow, onClose }) {
  const [searchTerm, setSearchTerm] = useState('');

  // Filter shows not yet in active playlist
  const availableShows = SITCOMS_DATABASE.filter(show => {
    const isAlreadyAdded = activeShowIds.includes(show.id);
    const matchesSearch = show.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          show.platformName.toLowerCase().includes(searchTerm.toLowerCase());
    return !isAlreadyAdded && matchesSearch;
  });

  return (
    <Modal title="Listene Dizi Ekle" onClose={onClose}>

      {/* Search input */}
      <div style={{ position: 'relative' }}>
        <Search size={18} style={{ position: 'absolute', left: 14, top: 14, color: 'var(--text-muted)' }} />
        <input
          type="text"
          placeholder="Dizi veya platform ara (örn: The Office, Netflix, Max)..."
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          style={{
            width: '100%',
            padding: '12px 14px 12px 42px',
            borderRadius: 'var(--radius-md)',
            background: 'rgba(255, 255, 255, 0.05)',
            border: '1px solid var(--border-glass)',
            color: 'var(--text-primary)',
            outline: 'none',
            fontSize: '0.95rem'
          }}
        />
      </div>

      {/* Shows grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '14px', maxHeight: '450px', overflowY: 'auto' }}>
        {availableShows.length === 0 ? (
          <p style={{ color: 'var(--text-muted)', textAlign: 'center', gridColumn: '1 / -1', padding: '30px' }}>
            Ekleyebileceğiniz başka dizi kalmadı veya arama sonucu bulunamadı.
          </p>
        ) : (
          availableShows.map(show => (
            <div
              key={show.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '12px',
                borderRadius: 'var(--radius-md)',
                background: 'rgba(255, 255, 255, 0.03)',
                border: '1px solid var(--border-glass)',
                gap: '12px'
              }}
            >
              <img
                src={show.coverImage}
                alt={show.title}
                style={{ width: '48px', height: '48px', borderRadius: '8px', objectFit: 'cover' }}
              />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 700, fontSize: '0.92rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {show.title}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '4px' }}>
                  <span className={`show-platform-tag tag-${show.platform}`}>{show.platformName}</span>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '2px' }}>
                    <Star size={12} fill="#F59E0B" color="#F59E0B" /> {show.imdbRating}
                  </span>
                </div>
              </div>
              <button
                className="btn btn-primary"
                onClick={() => {
                  onAddShow(show.id);
                  onClose();
                }}
                style={{ padding: '8px 12px', fontSize: '0.85rem' }}
              >
                <Plus size={16} /> Ekle
              </button>
            </div>
          ))
        )}
      </div>
    </Modal>
  );
}
