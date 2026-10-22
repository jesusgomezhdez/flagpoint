import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { Check, X } from 'lucide-react';
import type { ToastMessage } from '@/hooks/use-toast';
import { labelSpring } from './motion';

export function Toast({ toast }: { toast: ToastMessage | null }) {
  const reduceMotion = useReducedMotion();
  const hidden = reduceMotion ? { opacity: 0 } : { opacity: 0, y: 12, scale: 0.96, filter: 'blur(4px)' };

  return (
    <div aria-live="polite" className="pointer-events-none fixed inset-x-0 bottom-24 z-20 flex justify-center">
      <AnimatePresence>
        {toast && (
          <motion.div
            key={toast.id}
            initial={hidden}
            animate={{ opacity: 1, y: 0, scale: 1, filter: 'blur(0px)' }}
            exit={hidden}
            transition={labelSpring}
            className="glass flex items-center gap-2.5 rounded-full py-2 pr-4 pl-2 text-sm font-medium text-slate-800"
          >
            <span
              className={`flex h-6 w-6 items-center justify-center rounded-full text-white ${
                toast.variant === 'success'
                  ? 'bg-linear-to-br from-emerald-400 to-teal-500'
                  : 'bg-linear-to-br from-rose-400 to-red-500'
              }`}
            >
              {toast.variant === 'success' ? <Check size={14} strokeWidth={3} /> : <X size={14} strokeWidth={3} />}
            </span>
            {toast.text}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
