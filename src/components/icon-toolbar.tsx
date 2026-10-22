import type { IconComponent } from '@/core/tools';

export interface ToolbarItem {
  id: string;
  label: string;
  icon: IconComponent;
  shortcut?: string;
  disabled?: boolean;
}

interface IconToolbarProps {
  ariaLabel: string;
  items: ToolbarItem[];
  /** Elemento marcado como activo (p. ej. la herramienta actual). */
  activeId?: string | null;
  onAction(id: string): void;
}

/**
 * Barra flotante de vidrio: ícono + atajo de teclado visible. El elemento
 * activo y el que está bajo el mouse se resaltan con una pastilla de vidrio.
 */
export function IconToolbar({ ariaLabel, items, activeId = null, onAction }: IconToolbarProps) {
  return (
    <div role="toolbar" aria-label={ariaLabel} className="glass flex items-center gap-0.5 rounded-full p-1.5">
      {items.map(({ id, label, icon: Icon, shortcut, disabled }) => {
        const active = id === activeId;
        return (
          <button
            key={id}
            type="button"
            aria-label={label}
            aria-pressed={activeId === null ? undefined : active}
            title={shortcut ? `${label} (${shortcut})` : label}
            disabled={disabled}
            onClick={() => onAction(id)}
            className={`flex h-9 items-center gap-1.5 rounded-full px-2.5 outline-none transition-[background-color,box-shadow,color] duration-150 focus-visible:ring-2 focus-visible:ring-accent/40 disabled:cursor-not-allowed disabled:opacity-35 ${
              active
                ? 'bg-white/90 text-slate-900 shadow-[0_1px_2px_rgb(15_23_42/0.08),0_4px_12px_-4px_rgb(15_23_42/0.12)]'
                : 'text-slate-500 enabled:hover:bg-white/60 enabled:hover:text-slate-900'
            }`}
          >
            <Icon size={18} className={`shrink-0 ${active ? 'text-accent' : ''}`} />
            {shortcut && (
              <kbd
                className={`font-sans text-[10px] leading-none font-medium ${active ? 'text-accent/80' : 'text-slate-400'}`}
              >
                {shortcut}
              </kbd>
            )}
          </button>
        );
      })}
    </div>
  );
}
