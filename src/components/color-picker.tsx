import { COLOR_PRESETS } from '@/core/editor/style';

interface ColorPickerProps {
  value: string;
  onChange(color: string): void;
}

const ringClass = 'ring-2 ring-accent/70 ring-offset-2 ring-offset-white/80';

export function ColorPicker({ value, onChange }: ColorPickerProps) {
  const isCustom = !COLOR_PRESETS.some((preset) => preset === value);
  return (
    <div className="flex items-center gap-2" role="radiogroup" aria-label="Color">
      {COLOR_PRESETS.map((color) => (
        <button
          key={color}
          type="button"
          role="radio"
          aria-checked={value === color}
          aria-label={color}
          title={color}
          onClick={() => onChange(color)}
          className={`h-6 w-6 rounded-full shadow-[inset_0_0_0_1px_rgb(15_23_42/0.12),inset_0_1px_1px_rgb(255_255_255/0.5)] outline-none transition-transform hover:scale-110 focus-visible:ring-2 focus-visible:ring-accent/40 ${
            value === color ? ringClass : ''
          }`}
          style={{ backgroundColor: color }}
        />
      ))}
      <label
        title="Color personalizado"
        className={`relative h-6 w-6 cursor-pointer rounded-full bg-[conic-gradient(#f87171,#facc15,#4ade80,#22d3ee,#818cf8,#e879f9,#f87171)] shadow-[inset_0_0_0_1px_rgb(15_23_42/0.12)] transition-transform hover:scale-110 ${
          isCustom ? ringClass : ''
        }`}
      >
        <input
          type="color"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="absolute inset-0 cursor-pointer opacity-0"
          aria-label="Color personalizado"
        />
      </label>
    </div>
  );
}
