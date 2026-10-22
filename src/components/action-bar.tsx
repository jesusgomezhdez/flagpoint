import { motion, useReducedMotion } from 'motion/react';
import type { Exporter } from '@/core/exporters';
import { itemSpring } from './motion';

interface ActionBarProps {
  exporters: Exporter[];
  busyId: string | null;
  onExport(id: string): void;
}

/** Se genera a partir del registro de exporters: el primero es la acción principal. */
export function ActionBar({ exporters, busyId, onExport }: ActionBarProps) {
  const reduceMotion = useReducedMotion();
  return (
    <div className="glass flex items-center gap-1 rounded-full p-1.5">
      {exporters.map(({ id, label, icon: Icon }, index) => (
        <motion.button
          key={id}
          type="button"
          disabled={busyId !== null}
          onClick={() => onExport(id)}
          whileTap={reduceMotion ? undefined : { scale: 0.96 }}
          transition={itemSpring}
          className={`flex h-9 items-center gap-2 rounded-full px-4 text-sm font-medium whitespace-nowrap outline-none transition-[background-color,box-shadow,opacity] focus-visible:ring-2 focus-visible:ring-accent/40 disabled:opacity-60 ${
            index === 0
              ? 'bg-[linear-gradient(135deg,#334155,#0f172a)] text-white shadow-[inset_0_1px_0_rgb(255_255_255/0.18),0_6px_16px_-6px_rgb(15_23_42/0.6)] hover:bg-[linear-gradient(135deg,#475569,#1e293b)]'
              : 'text-slate-600 hover:bg-white/80 hover:text-slate-900'
          }`}
        >
          <Icon size={16} />
          {busyId === id ? 'Procesando…' : label}
        </motion.button>
      ))}
    </div>
  );
}
