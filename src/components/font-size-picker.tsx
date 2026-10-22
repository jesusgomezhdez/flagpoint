import { FONT_SIZE_PRESETS, type FontSizeId } from '@/core/editor/style';

interface FontSizePickerProps {
  value: FontSizeId;
  onChange(size: FontSizeId): void;
}

const SIZES = Object.entries(FONT_SIZE_PRESETS) as [FontSizeId, (typeof FONT_SIZE_PRESETS)[FontSizeId]][];

export function FontSizePicker({ value, onChange }: FontSizePickerProps) {
  return (
    <div className="flex items-center gap-1" role="radiogroup" aria-label="Tamaño de la fuente">
      {SIZES.map(([id, { label }]) => {
        const selected = value === id;
        return (
          <button
            key={id}
            type="button"
            role="radio"
            aria-checked={selected}
            title={`Tamaño de la fuente: ${label}`}
            onClick={() => onChange(id)}
            className={`flex h-8 min-w-8 items-center justify-center rounded-lg px-1.5 text-xs font-semibold outline-none transition-colors duration-150 focus-visible:ring-2 focus-visible:ring-accent/40 ${
              selected
                ? 'bg-indigo-100 text-indigo-700 shadow-[inset_0_0_0_1px_rgb(99_102_241/0.25)]'
                : 'bg-white/50 text-slate-500 hover:bg-white/90 hover:text-slate-800'
            }`}
          >
            {label}
          </button>
        );
      })}
    </div>
  );
}
