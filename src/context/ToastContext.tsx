import { createContext, useCallback, useContext, useRef, useState, type ReactNode } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { SPRING_SNAPPY } from '../lib/motion';

interface ToastAction { label: string; onClick: () => void }
interface ToastState { id: number; message: string; action?: ToastAction }
type ShowToast = (message: string, action?: ToastAction) => void;

const ToastContext = createContext<ShowToast>(() => {});
export const useToast = () => useContext(ToastContext);

/** הודעה קצרה שצפה מעל שורת הלשוניות; אפשר לצרף "ביטול" (סלחנות: מבטלים טעות בלחיצה) */
export function ToastProvider({ children }: { children: ReactNode }) {
  const [toast, setToast] = useState<ToastState | null>(null);
  const timer = useRef(0);
  const counter = useRef(0);

  const show = useCallback<ShowToast>((message, action) => {
    window.clearTimeout(timer.current);
    setToast({ id: ++counter.current, message, action });
    timer.current = window.setTimeout(() => setToast(null), action ? 5000 : 2400);
  }, []);

  return (
    <ToastContext.Provider value={show}>
      {children}
      <div className="pointer-events-none fixed inset-x-0 bottom-[calc(5.75rem+env(safe-area-inset-bottom))] z-[80] flex justify-center px-4">
        <AnimatePresence>
          {toast && (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, y: 24, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 16, scale: 0.97 }}
              transition={SPRING_SNAPPY}
              role="status"
              className="pointer-events-auto flex items-center gap-4 rounded-2xl bg-[rgb(30_30_32/0.94)] px-4 py-3 text-[0.9375rem] font-semibold text-white shadow-sheet"
            >
              <span>{toast.message}</span>
              {toast.action && (
                <button
                  onClick={() => { toast.action?.onClick(); setToast(null); }}
                  className="font-bold text-amber-400 transition-opacity active:opacity-60"
                >
                  {toast.action.label}
                </button>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}
