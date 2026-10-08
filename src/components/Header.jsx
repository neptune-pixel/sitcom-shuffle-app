import React from 'react';
import {
  Tv,
  HelpCircle,
  RefreshCw,
  ToggleLeft,
  ToggleRight,
  CheckCircle2,
  AlertCircle,
  Palette
} from 'lucide-react';

export default function Header({ onOpenGuide, onResetAll, autoPlayEnabled, onToggleAutoPlay, extensionConnected, theme, setTheme }) {
  return (
    <header className="app-header">
      <div className="brand">
        <div className="brand-icon-wrapper">
          <Tv size={26} />
        </div>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <h1 className="brand-title">SitcomShuffle</h1>
            <span className="brand-badge">PRO SHUFFLE</span>
          </div>
          <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
            Netflix • Disney+ • Prime Video • HBO Max Sit-Com Karıştırıcı
          </p>
        </div>
      </div>

      <div className="header-actions">
        {/* Extension Connection Status Badge */}
        <button
          className="btn btn-glass"
          onClick={onOpenGuide}
          style={{
            fontSize: '0.78rem',
            padding: '6px 12px',
            color: extensionConnected ? '#34D399' : '#FBBF24',
            borderColor: extensionConnected ? 'rgba(52, 211, 153, 0.4)' : 'rgba(251, 191, 36, 0.4)',
            background: extensionConnected ? 'rgba(52, 211, 153, 0.08)' : 'rgba(251, 191, 36, 0.08)'
          }}
          title={extensionConnected ? "Eklenti bağlı ve aktif çalışıyor" : "Eklenti algılanamadı. Kurulum veya yenileme için tıklayın"}
        >
          {extensionConnected ? <CheckCircle2 size={15} color="#34D399" /> : <AlertCircle size={15} color="#FBBF24" />}
          <span>{extensionConnected ? "Eklenti Aktif" : "Eklenti Bekleniyor"}</span>
        </button>

        {/* Auto-play toggle */}
        <button 
          className="btn btn-glass" 
          onClick={onToggleAutoPlay}
          style={{ 
            color: autoPlayEnabled ? '#34D399' : 'var(--text-secondary)',
            borderColor: autoPlayEnabled ? 'rgba(52,211,153,0.3)' : 'var(--border)'
          }}
          title={autoPlayEnabled ? "Otomatik Oynatma Açık" : "Otomatik Oynatma Kapalı"}
        >
          {autoPlayEnabled ? <ToggleRight size={20} /> : <ToggleLeft size={20} />}
          <span>Oto-Geçiş {autoPlayEnabled ? "Açık" : "Kapalı"}</span>
        </button>

        {/* Theme Selector */}
        <div className="btn btn-glass" style={{ padding: '6px 12px', gap: '6px' }} title="Tema Seçimi">
          <Palette size={16} color="var(--text-secondary)" />
          <select 
            value={theme || 'default'} 
            onChange={(e) => setTheme(e.target.value)}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--text-primary)',
              fontFamily: 'inherit',
              fontSize: '0.85rem',
              outline: 'none',
              cursor: 'pointer'
            }}
          >
            <option value="default" style={{background: '#0F131E'}}>Koyu Galaksi</option>
            <option value="central-perk" style={{background: '#140d1e'}}>Central Perk (Friends)</option>
            <option value="maclarens" style={{background: '#17110C'}}>MacLaren's (HIMYM)</option>
            <option value="greendale" style={{background: '#0A1612'}}>Greendale (Community)</option>
          </select>
        </div>

        <button className="btn btn-glass" onClick={onOpenGuide} title="Otomatik Oynatma & Sekme Uzantısı Rehberi">
          <HelpCircle size={18} />
          <span>Rehber</span>
        </button>

        <button className="btn btn-glass" onClick={onResetAll} title="Tüm Listeyi ve İzleme Geçmişini Sıfırla">
          <RefreshCw size={16} />
        </button>
      </div>
    </header>
  );
}
