import React, { useEffect } from 'react';
import { CloseIcon } from './Icons.jsx';
import { IconButton } from './IconButton.jsx';

/**
 * Modal — Accessible dialog with subtle backdrop blur, restrained radius, and keyboard Escape listener.
 */
export function Modal({
  isOpen,
  onClose,
  title,
  description,
  children,
  footer,
  maxWidth = 'max-w-lg',
  className = '',
}) {
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen && onClose) {
        onClose();
      }
    };
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby={title ? 'modal-title' : undefined}
    >
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs transition-opacity duration-200"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Dialog Surface */}
      <div
        className={`relative w-full ${maxWidth} bg-white rounded-xl sm:rounded-2xl shadow-xl border border-slate-200/80 overflow-hidden my-6 sm:my-8 z-10 transition-all transform duration-200 scale-100 ${className}`}
      >
        {/* Header */}
        {(title || onClose) && (
          <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between gap-4">
            <div>
              {title && (
                <h3 id="modal-title" className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">
                  {title}
                </h3>
              )}
              {description && (
                <p className="text-xs text-slate-500 mt-0.5">{description}</p>
              )}
            </div>

            {onClose && (
              <IconButton
                icon={<CloseIcon className="w-4 h-4" />}
                aria-label="Close dialog"
                size="sm"
                onClick={onClose}
                className="text-slate-400 hover:text-slate-700"
              />
            )}
          </div>
        )}

        {/* Content Body */}
        <div className="p-6 max-h-[calc(85vh-120px)] overflow-y-auto">
          {children}
        </div>

        {/* Optional Footer */}
        {footer && (
          <div className="px-6 py-3.5 bg-slate-50/75 border-t border-slate-100 flex items-center justify-end gap-2.5">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}

export default Modal;
