import React, { useState } from 'react';
import Modal from './Modal';
import { getShowById } from '../../services/shuffleEngine';
import { Link2, Check, RefreshCw } from 'lucide-react';

export default function EditLinkModal({ showId, currentPlatform, episodeCode, displayCode, currentCustomUrl, onSaveLink, onClose }) {
  const shownCode = displayCode || episodeCode;
  const show = getShowById(showId);
  // If there's an exact custom URL or exact episode ID, use it as default. Otherwise leave input blank for editing.
  const exactEpWatchId = episodeCode ? show?.episodeWatchIds?.[episodeCode] : null;
  const initialValue = currentCustomUrl || (exactEpWatchId && currentPlatform === 'netflix' ? `https://www.netflix.com/watch/${exactEpWatchId}` : '');

  const [urlInput, setUrlInput] = useState(initialValue);

  if (!show) return null;

  const handleSave = (e) => {
    e.preventDefault();
    onSaveLink(showId, currentPlatform, episodeCode, urlInput.trim());
    onClose();
  };

  const handleResetDefault = () => {
    setUrlInput('');
    onSaveLink(showId, currentPlatform, episodeCode, null);
  };

  return (
    <Modal
      title={episodeCode ? `${show.title} (${shownCode}) - Bölüm Linki` : `${show.title} - Dizi Sayfası`}
      subtitle={episodeCode
        ? `Bu özel bölüm (${shownCode}) için bulunduğunuz ülkedeki doğrudan /watch/ oynatıcı linkini yapıştırın.`
        : `Dizinin ${currentPlatform.toUpperCase()} sayfasının linki. Linki olmayan bölümlerde "Dizi Sayfasını Aç" butonu bu sayfayı açar; bölümü orada bulup linkini kopyalayabilirsiniz. Oynatma için kullanılmaz.`}
      onClose={onClose}
    >

      <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div>
          <label style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-secondary)', display: 'block', marginBottom: '8px' }}>
            {episodeCode ? `Doğrudan ${currentPlatform.toUpperCase()} Oynatıcı Linki:` : `${currentPlatform.toUpperCase()} Dizi Sayfası Linki:`}
          </label>
          <div style={{ position: 'relative' }}>
            <Link2 size={18} style={{ position: 'absolute', left: 14, top: 14, color: 'var(--text-muted)' }} />
            <input
              type="url"
              required
              placeholder={episodeCode ? `Örn: https://www.netflix.com/watch/<${shownCode}-bölüm-id>` : 'Örn: https://www.netflix.com/title/70136120'}
              value={urlInput}
              onChange={e => setUrlInput(e.target.value)}
              style={{
                width: '100%',
                padding: '12px 14px 12px 42px',
                borderRadius: 'var(--radius-md)',
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid var(--border-glass-bright)',
                color: 'var(--text-primary)',
                fontSize: '0.92rem',
                outline: 'none'
              }}
            />
          </div>
        </div>

        <div style={{ padding: '12px', borderRadius: 'var(--radius-md)', background: 'rgba(255, 255, 255, 0.03)', border: '1px solid var(--border-glass)', fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
          💡 <strong>İpucu:</strong> {episodeCode ? <>Netflix'te bu bölümü açtığınızda adres çubuğunda çıkan linki (örneğin <code>https://www.netflix.com/watch/80028068</code>) buraya yapıştırın. Yapıştırdığınız link saklanır ve "Bölümü Başlat" butonuna bastığınızda tam ekranda doğrudan bu bölüm başlar!</> : <>Platformda dizinin sayfasını açın ve adres çubuğundaki linki (örneğin <code>https://www.netflix.com/title/70136120</code>) buraya yapıştırın. Bu link yalnızca eksik bölüm linklerini bulmanız için açılır; oynatma için kullanılmaz.</>}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '10px' }}>
          <button
            type="button"
            className="btn btn-glass"
            onClick={handleResetDefault}
            style={{ fontSize: '0.82rem' }}
          >
            <RefreshCw size={14} /> Varsayılana Dön
          </button>

          <div style={{ display: 'flex', gap: '10px' }}>
            <button type="button" className="btn btn-glass" onClick={onClose}>
              İptal
            </button>
            <button type="submit" className="btn btn-primary">
              <Check size={16} /> Bağlantıyı Kaydet
            </button>
          </div>
        </div>
      </form>
    </Modal>
  );
}
