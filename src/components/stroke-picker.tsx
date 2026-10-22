import { STROKE_PRESETS } from '@/core/editor/style';

interface StrokePickerProps {
  value: number;
  color: string;
  onChange(width: number): void;
}

export function StrokePicker({ value, color, onChange }: StrokePickerProps) {
  return (
    <div className="flex items-center gap-0.5" role="radiogroup" aria-label="Grosor">
      {STROKE_PRESETS.map((width) => (
        <button
          key={width}
          type="button"
          role="radio"
          aria-checked={value === width}
          title={`Grosor ${width}px`}
          onClick={() => onChange(width)}
          className={`flex h-8 w-8 items-center justify-center rounded-full outline-none transition-[background-color,box-shadow] duration-150 focus-visible:ring-2 focus-visible:ring-accent/40 ${
            value === width
              ? 'bg-white/90 shadow-[0_1px_2px_rgb(15_23_42/0.08),0_4px_12px_-4px_rgb(15_23_42/0.12)]'
              : 'hover:bg-white/60'
          }`}
        >
          <span
            className="rounded-full shadow-[inset_0_0_0_1px_rgb(15_23_42/0.12)]"
            style={{ width: width + 3, height: width + 3, backgroundColor: color }}
          />
        </button>
      ))}
    </div>
  );
}
