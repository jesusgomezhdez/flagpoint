type RGB = [number, number, number];

function parseHex(hex: string): RGB | null {
  const value = hex.trim().replace('#', '');
  const full = value.length === 3 ? [...value].map((c) => c + c).join('') : value;
  if (!/^[0-9a-f]{6}$/i.test(full)) return null;
  return [0, 2, 4].map((i) => parseInt(full.slice(i, i + 2), 16)) as RGB;
}

function toHex([r, g, b]: RGB): string {
  return `#${[r, g, b].map((c) => Math.round(c).toString(16).padStart(2, '0')).join('')}`;
}

/** Mezcla `color` con `target`; `amount` = 0 devuelve `color`, 1 devuelve `target`. */
export function mixColors(color: string, target: string, amount: number): string {
  const a = parseHex(color);
  const b = parseHex(target);
  if (!a || !b) return color;
  return toHex(a.map((c, i) => c + (b[i]! - c) * amount) as RGB);
}

/** Texto oscuro sobre fondos claros y claro sobre fondos oscuros. */
export function readableTextColor(background: string): string {
  const rgb = parseHex(background);
  if (!rgb) return '#1e293b';
  const [r, g, b] = rgb;
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.6 ? '#1e293b' : '#ffffff';
}
