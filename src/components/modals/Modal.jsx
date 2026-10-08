import React, { useEffect } from 'react';
import { X } from 'lucide-react';

// Shared modal shell: dimmed overlay, title bar with close button, Escape to close.
export default function Modal({ title, subtitle, onClose, maxWidth, children }) {
  useEffect(() => {
    const handleKey = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [onClose]);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-content"
        role="dialog"
        aria-modal="true"
        onClick={e => e.stopPropagation()}
        style={maxWidth ? { maxWidth } : undefined}
      >
        <div className="modal-header">
          <div>
            <h2 className="modal-title">{title}</h2>
            {subtitle && <p className="modal-subtitle">{subtitle}</p>}
          </div>
          <button type="button" className="btn btn-glass modal-close" onClick={onClose} aria-label="Kapat">
            <X size={20} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
