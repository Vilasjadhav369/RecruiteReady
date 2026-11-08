import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { Toast } from './Toast.jsx';
import { Modal } from './Modal.jsx';
import { Button } from './Button.jsx';

const FeedbackContext = createContext(null);

/**
 * FeedbackProvider — app-wide toasts and promise-based confirm dialogs.
 *   const { notify, confirm } = useFeedback();
 *   notify({ variant: 'success', message: 'Saved.' });
 *   if (await confirm({ title: 'Reset code?', confirmLabel: 'Reset' })) { ... }
 */
export function FeedbackProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const [dialog, setDialog] = useState(null);
  const idRef = useRef(0);

  const dismiss = useCallback((id) => setToasts((t) => t.filter((x) => x.id !== id)), []);

  const notify = useCallback(
    ({ variant = 'info', title, message, requestId, duration = 4500 }) => {
      const id = ++idRef.current;
      setToasts((t) => [...t.slice(-3), { id, variant, title, message, requestId }]);
      if (duration) setTimeout(() => dismiss(id), duration);
      return id;
    },
    [dismiss]
  );

  useEffect(() => {
    try {
      if (sessionStorage.getItem('rr_session_expired')) {
        sessionStorage.removeItem('rr_session_expired');
        notify({
          variant: 'warning',
          message: 'Your session expired. Please log in again.',
        });
      }
    } catch {
      /* ignore storage errors */
    }

    const handleGlobalToast = (event) => {
      const { variant = 'info', title, message, requestId } = event.detail || {};
      if (message) {
        notify({ variant, title, message, requestId });
      }
    };

    window.addEventListener('app:toast', handleGlobalToast);
    return () => window.removeEventListener('app:toast', handleGlobalToast);
  }, [notify]);

  const confirm = useCallback(
    (opts) => new Promise((resolve) => setDialog({ ...opts, resolve })),
    []
  );

  const close = (result) => {
    dialog?.resolve(result);
    setDialog(null);
  };

  const value = useMemo(() => ({ notify, confirm }), [notify, confirm]);

  return (
    <FeedbackContext.Provider value={value}>
      {children}
      <div
        className="fixed bottom-4 right-4 left-4 sm:left-auto z-[60] flex flex-col gap-2 sm:w-96 pointer-events-none"
        role="status"
        aria-live="polite"
      >
        {toasts.map((t) => (
          <div key={t.id} className="pointer-events-auto animate-toast shadow-lg rounded-lg">
            <Toast
              variant={t.variant}
              title={t.title}
              message={t.message}
              requestId={t.requestId}
              onClose={() => dismiss(t.id)}
            />
          </div>
        ))}
      </div>
      <Modal
        isOpen={Boolean(dialog)}
        onClose={() => close(false)}
        title={dialog?.title || 'Are you sure?'}
        description={dialog?.description}
        maxWidth="max-w-md"
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => close(false)}>
              {dialog?.cancelLabel || 'Cancel'}
            </Button>
            <Button variant={dialog?.danger ? 'danger' : 'primary'} onClick={() => close(true)}>
              {dialog?.confirmLabel || 'Confirm'}
            </Button>
          </div>
        }
      >
        {dialog?.body ? <p className="text-sm text-ink-2">{dialog.body}</p> : null}
      </Modal>
    </FeedbackContext.Provider>
  );
}

export function useFeedback() {
  const ctx = useContext(FeedbackContext);
  if (!ctx) throw new Error('useFeedback must be used inside <FeedbackProvider>');
  return ctx;
}
