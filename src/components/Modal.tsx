import { useEffect, type ReactNode } from 'react';

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
}

/** גיליון תחתון (bottom sheet) במובייל, מודאל ממורכז במסך גדול */
export function Modal({ open, onClose, title, children }: ModalProps) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-[2px]" onClick={onClose} />
      <div className="relative z-10 max-h-[88dvh] w-full overflow-y-auto rounded-t-3xl bg-card p-5 pb-8 shadow-sheet sm:max-w-md sm:rounded-3xl sm:pb-5">
        <div className="mx-auto mb-3 h-1.5 w-10 rounded-full bg-gray-200 sm:hidden" />
        {title && <h2 className="mb-4 text-lg font-bold text-ink">{title}</h2>}
        {children}
      </div>
    </div>
  );
}

interface ConfirmProps {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmDialog({ open, title, message, confirmLabel = 'מחיקה', onConfirm, onCancel }: ConfirmProps) {
  return (
    <Modal open={open} onClose={onCancel} title={title}>
      <p className="mb-5 text-sm text-gray-600">{message}</p>
      <div className="flex gap-3">
        <button
          onClick={onConfirm}
          className="flex-1 rounded-2xl bg-rose-500 py-3 font-semibold text-white active:scale-[0.98]"
        >
          {confirmLabel}
        </button>
        <button
          onClick={onCancel}
          className="flex-1 rounded-2xl bg-gray-100 py-3 font-semibold text-ink active:scale-[0.98]"
        >
          ביטול
        </button>
      </div>
    </Modal>
  );
}
