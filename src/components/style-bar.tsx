import type { ReactNode } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import type { StyleProp, ToolStyle } from '@/core/editor/style';
import { ColorPicker } from './color-picker';
import { FontSizePicker } from './font-size-picker';
import { labelSpring } from './motion';
import { StrokePicker } from './stroke-picker';

interface StyleBarProps {
  style: ToolStyle;
  /** Controles visibles, según la herramienta activa y la selección. */
  targets: StyleProp[];
  onChange(patch: Partial<ToolStyle>): void;
}

/** Panel flotante de estilo: solo muestra los controles que aplican. */
export function StyleBar({ style, targets, onChange }: StyleBarProps) {
  const reduceMotion = useReducedMotion();

  const sections: Record<StyleProp, ReactNode> = {
    color: <ColorPicker value={style.color} onChange={(color) => onChange({ color })} />,
    strokeWidth: (
      <StrokePicker value={style.strokeWidth} color={style.color} onChange={(strokeWidth) => onChange({ strokeWidth })} />
    ),
    fontSize: <FontSizePicker value={style.fontSize} onChange={(fontSize) => onChange({ fontSize })} />,
  };

  const hidden = reduceMotion ? { opacity: 0 } : { opacity: 0, width: 0, filter: 'blur(3px)' };

  return (
    <div className="glass flex items-center rounded-full px-1.5 py-0.5">
      <AnimatePresence initial={false}>
        {targets.map((prop, index) => (
            <motion.div
              key={prop}
              initial={hidden}
              animate={{ opacity: 1, width: 'auto', filter: 'blur(0px)' }}
              exit={hidden}
              transition={labelSpring}
              className="flex items-center overflow-hidden py-1"
            >
              {index > 0 && <span className="mx-2.5 h-5 w-px shrink-0 bg-slate-900/10" />}
              <div className={prop === 'color' ? 'px-2' : ''}>{sections[prop]}</div>
            </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
