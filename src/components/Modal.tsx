import { useEffect, useState, type ReactNode } from 'react';
import { AnimatePresence, motion, useDragControls, useReducedMotion, type PanInfo } from 'motion/react';
import { project, SPRING, SPRING_MOMENTUM } from '../lib/motion';

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
}

/** האם המסך רחב (מודאל ממורכז) או מובייל (גיליון תחתון שנגרר) */
function useIsDesktop() {
  const [wide, setWide] = useState(() => typeof window !== 'undefined' && window.matchMedia('(min-width: 640px)').matches);
  useEffect(() => {
    const mq = window.matchMedia('(min-width: 640px)');
    const on = () => setWide(mq.matches);
    mq.addEventListener('change', on);
    return () => mq.removeEventListener('change', on);
  }, []);
  return wide;
}

/**
 * גיליון תחתון (bottom sheet) במובייל, מודאל ממורכז במסך גדול.
 * בגיליון: גרירה 1:1 מהידית/הכותרת, הקרנת תנופה לפי מהירות השחרור, התנגדות (rubber-band) כלפי מעלה,
 * כניסה ויציאה באותו מסלול, ואפשר לתפוס אותו באמצע התנועה (קפיץ שמתחיל מהערך הנוכחי).
 */
export function Modal({ open, onClose, title, children }: ModalProps) {
  const reduce = useReducedMotion();
  const desktop = useIsDesktop();
  const controls = useDragControls();

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

  const onDragEnd = (_: PointerEvent, info: PanInfo) => {
    // מחליטים לפי היעד המוקרן (מיקום + תנופה), לא לפי נקודת השחרור
    const projected = info.offset.y + project(info.velocity.y, 0.99);
    if (projected > 140 || info.velocity.y > 900) onClose();
  };

  const sheetMotion = reduce
    ? { initial: { opacity: 0 }, animate: { opacity: 1 }, exit: { opacity: 0 }, transition: { duration: 0.18 } }
    : desktop
      ? {
          initial: { opacity: 0, scale: 0.96 },
          animate: { opacity: 1, scale: 1 },
          exit: { opacity: 0, scale: 0.96 },
          transition: SPRING,
        }
      : {
          initial: { y: '100%' },
          animate: { y: 0 },
          exit: { y: '100%' },
          transition: SPRING_MOMENTUM,
        };

  const draggable = !desktop && !reduce;

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[70] flex items-end justify-center sm:items-center" role="dialog" aria-modal="true" aria-label={title}>
          <motion.div
            className="absolute inset-0 bg-black/45"
            style={{ WebkitBackdropFilter: 'blur(3px)', backdropFilter: 'blur(3px)' }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: reduce ? 0.15 : 0.25 }}
            onClick={onClose}
          />
          <motion.div
            {...sheetMotion}
            drag={draggable ? 'y' : false}
            dragControls={controls}
            dragListener={false}
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={{ top: 0.12, bottom: 0.9 }}
            dragSnapToOrigin
            onDragEnd={onDragEnd}
            className="glass relative z-10 flex max-h-[88dvh] w-full flex-col rounded-t-3xl shadow-sheet sm:max-w-md sm:rounded-3xl"
          >
            {/* ידית + כותרת: מכאן גוררים; התוכן עצמו נגלל בנפרד */}
            <div
              onPointerDown={(e) => draggable && controls.start(e)}
              className="shrink-0 touch-none px-5 pt-3"
              style={{ cursor: draggable ? 'grab' : undefined }}
            >
              <div className="mx-auto mb-3 h-1.5 w-10 rounded-full bg-gray-300 sm:hidden" />
              {title && <h2 className="mb-3 text-lg font-bold text-ink">{title}</h2>}
            </div>
            <div className="overflow-y-auto overscroll-contain px-5 pb-8 sm:pb-5">{children}</div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
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
