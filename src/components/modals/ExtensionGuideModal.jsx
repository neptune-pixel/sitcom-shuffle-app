import React from 'react';
import Modal from './Modal';
import extensionManifest from '../../../extension/manifest.json';
import { Download, FolderArchive, Play, CheckCircle2, AlertCircle } from 'lucide-react';

const EXTENSION_PACKAGE_VERSION = extensionManifest.version;

export default function ExtensionGuideModal({ onClose, extensionConnected, extensionVersion, onSimulateNext, learnLog = [], learnedCount = 0, onResetLearned }) {
  return (
    <Modal
      title="SitcomShuffle Eklenti & Otomatik Geçiş"
      subtitle="Otomatik İntro Atlama, sekme senkronizasyonu ve kesintisiz bölüm geçişi yardımcısı."
      onClose={onClose}
      maxWidth="640px"
    >

      {/* Live Status Card */}
      <div
        style={{
          background: extensionConnected ? 'rgba(52, 211, 153, 0.1)' : 'rgba(251, 191, 36, 0.1)',
          border: extensionConnected ? '1px solid rgba(52, 211, 153, 0.4)' : '1px solid rgba(251, 191, 36, 0.4)',
          padding: '14px 18px',
          borderRadius: '12px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '14px',
          marginBottom: '16px'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {extensionConnected ? (
            <CheckCircle2 size={24} color="#34D399" style={{ flexShrink: 0 }} />
          ) : (
            <AlertCircle size={24} color="#FBBF24" style={{ flexShrink: 0 }} />
          )}
          <div>
            <div style={{ fontWeight: 700, fontSize: '0.95rem', color: extensionConnected ? '#34D399' : '#FBBF24' }}>
              {extensionConnected ? `Eklenti Bağlı ve Aktif!${extensionVersion ? ` (v${extensionVersion})` : ''}` : "Eklenti Henüz Algılanmadı"}
            </div>
            <p style={{ margin: '2px 0 0 0', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
              {extensionConnected
                ? "Bölüm sonları (jenerik, sayaç veya bitiş) algılandığında akış otomatik devam eder."
                : "Eklentiyi yüklediyseniz chrome://extensions sayfasında 'Yenile (🔄)' butonuna basıp sayfayı tazeleyin."}
            </p>
          </div>
        </div>

        {onSimulateNext && (
          <button
            type="button"
            className="btn btn-glass"
            onClick={onSimulateNext}
            style={{ fontSize: '0.78rem', padding: '6px 12px', flexShrink: 0, gap: '6px' }}
            title="Sıradaki bölüme geçişi hemen test edin"
          >
            <Play size={14} fill="currentColor" /> Geçişi Test Et
          </button>
        )}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', fontSize: '0.92rem', lineHeight: 1.5 }}>
        
        {/* Links learned while watching */}
        <div className="learned-links-card">
          <div className="learned-links-header">
            <div>
              <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>Öğrenilen Bölüm Linkleri ({learnedCount})</div>
              <p style={{ margin: '2px 0 0 0', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                Eklenti, izlediğiniz bölümün adını ve linkini okuyup eksik veya hatalı linkleri kendiliğinden düzeltir
                (Netflix, Disney+, HBO Max). Sizin yapıştırdığınız linklere dokunmaz.
              </p>
            </div>
            {onResetLearned && learnedCount + learnLog.length > 0 && (
              <button type="button" className="btn btn-glass" onClick={onResetLearned} style={{ fontSize: '0.78rem', padding: '6px 12px', flexShrink: 0 }}>
                Sıfırla
              </button>
            )}
          </div>
          {learnLog.length > 0 && (
            <ul className="learned-links-list">
              {learnLog.slice(0, 8).map((e, i) => (
                <li key={`${e.at}-${i}`}>
                  <span className={`learned-kind learned-kind-${e.wrongCodes?.length ? 'fixed' : e.kind}`}>
                    {e.wrongCodes?.length ? 'Düzeltildi' : e.kind === 'new' ? 'Yeni' : 'Güncellendi'}
                  </span>
                  <span>{e.showTitle} {e.displayCode}</span>
                  {e.wrongCodes?.length > 0 && <span style={{ color: 'var(--text-muted)' }}>({e.wrongCodes.join(', ')} linki yanlıştı)</span>}
                  <span style={{ color: 'var(--text-muted)', marginLeft: 'auto' }}>{e.method === 'title' ? 'bölüm adından' : 'bölüm numarasından'}</span>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Direct Download Card */}
        <div
          style={{
            background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.2) 0%, rgba(147, 51, 234, 0.15) 100%)',
            border: '1px solid rgba(99, 102, 241, 0.4)',
            padding: '16px',
            borderRadius: '12px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '16px'
          }}
        >
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 700, fontSize: '1rem', color: '#FFF' }}>
              <FolderArchive size={18} color="#818CF8" />
              <span>En Güncel Eklenti Paketi (v{EXTENSION_PACKAGE_VERSION})</span>
            </div>
            <p style={{ margin: '3px 0 0 0', fontSize: '0.8rem', color: '#C7D2FE' }}>
              Gelişmiş jenerik algılama ve çoklu platform desteği ile güncellendi.
            </p>
          </div>

          <a
            href="/sitcom-shuffle-extension.zip"
            download="sitcom-shuffle-extension.zip"
            className="btn btn-primary"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '9px 16px',
              fontSize: '0.88rem',
              fontWeight: 700,
              flexShrink: 0,
              textDecoration: 'none'
            }}
          >
            <Download size={16} /> .ZIP İndir
          </a>
        </div>

        <h3 style={{ fontSize: '1rem', marginTop: '4px', marginBottom: '2px', color: '#FFF' }}>
          Kurulum & Güncelleme Adımları:
        </h3>

        <ol style={{ paddingLeft: '20px', color: 'var(--text-primary)', margin: 0, display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.88rem' }}>
          <li>
            İndirdiğiniz <code>sitcom-shuffle-extension.zip</code> dosyasını masaüstünüze bir klasöre çıkartın (veya projedeki <code>extension</code> klasörünü kullanın).
          </li>
          <li>
            Tarayıcınızda adres çubuğuna <code style={{ background: 'rgba(255,255,255,0.1)', padding: '2px 6px', borderRadius: '4px', userSelect: 'all' }}>chrome://extensions/</code> yazın.
          </li>
          <li>
            Sağ üstteki <strong>Geliştirici modu (Developer mode)</strong> anahtarını açık konuma getirin.
          </li>
          <li>
            <strong>Eğer eklenti zaten yüklüyse:</strong> Eklenti kartındaki <strong>Yenile (🔄)</strong> simgesine tıklayın.<br/>
            <strong>İlk kez yüklüyorsanız:</strong> Sol üstteki <strong>"Paketlenmemiş öğe yükle"</strong> butonuna basıp <code>extension</code> klasörünü seçin.
          </li>
          <li>
            SitcomShuffle sayfasını ve açık olan yayın sekmelerini (Netflix/Disney+) bir kez <strong>F5 ile yenileyin</strong>.
          </li>
        </ol>
      </div>

      <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '18px' }}>
        <button className="btn btn-primary" onClick={onClose} style={{ padding: '8px 20px' }}>
          Kapat
        </button>
      </div>
    </Modal>
  );
}
