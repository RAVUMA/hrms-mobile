import { motion, AnimatePresence } from 'motion/react';
import type { ReactNode } from 'react';

interface DialogProps {
  open: boolean;
  title: string;
  message: ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  danger?: boolean;
  onConfirm: () => void;
  onCancel?: () => void;
}

/** Styled replacement for native confirm()/alert() - pass no cancelLabel for a single-button alert. */
export default function Dialog({
  open,
  title,
  message,
  confirmLabel = 'OK',
  cancelLabel,
  danger,
  onConfirm,
  onCancel,
}: DialogProps) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 px-6"
          onClick={cancelLabel ? onCancel : onConfirm}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.92, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: 8 }}
            transition={{ type: 'spring', stiffness: 380, damping: 30 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-xs rounded-2xl bg-white p-5 shadow-2xl"
          >
            <h2 className="text-base font-bold text-brand-teal">{title}</h2>
            <div className="mt-1.5 text-sm leading-relaxed text-gray-600">{message}</div>
            <div className="mt-5 flex gap-2.5">
              {cancelLabel && (
                <motion.button
                  whileTap={{ scale: 0.97 }}
                  onClick={onCancel}
                  className="flex-1 rounded-xl bg-brand-surface py-2.5 text-sm font-semibold text-brand-teal"
                >
                  {cancelLabel}
                </motion.button>
              )}
              <motion.button
                whileTap={{ scale: 0.97 }}
                onClick={onConfirm}
                className={`flex-1 rounded-xl py-2.5 text-sm font-semibold text-white ${
                  danger ? 'bg-red-600' : 'bg-brand-teal'
                }`}
              >
                {confirmLabel}
              </motion.button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
