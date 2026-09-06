import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import CloseIcon from '@mui/icons-material/Close';
import './AppModal.scss';

export default function AppModal({
  open,
  onClose,
  title,
  subtitle,
  children,
  actions,
  maxWidth = 'md',
  className = '',
  bodyClassName = '',
}) {
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);

  if (!open) return null;

  const modalContent = (
    <div
      className="app-modal-backdrop"
      onClick={(e) => {
        if (e.target === e.currentTarget && onClose) {
          onClose();
        }
      }}
    >
      <div
        className={`app-modal-container app-modal-container--${maxWidth} ${className}`.trim()}
        role="dialog"
        aria-modal="true"
      >
        {(title || onClose) && (
          <div className="app-modal-header">
            <div className="app-modal-title-wrap">
              {title && <h3 className="app-modal-title">{title}</h3>}
              {subtitle && <p className="app-modal-subtitle">{subtitle}</p>}
            </div>
            {onClose && (
              <button
                type="button"
                className="app-modal-close"
                onClick={onClose}
                aria-label="Close"
              >
                <CloseIcon fontSize="small" />
              </button>
            )}
          </div>
        )}

        <div className={`app-modal-body ${bodyClassName}`.trim()}>
          {children}
        </div>

        {actions && <div className="app-modal-footer">{actions}</div>}
      </div>
    </div>
  );

  return typeof document !== 'undefined'
    ? createPortal(modalContent, document.body)
    : modalContent;
}
