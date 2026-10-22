import { IText, type FabricObject } from 'fabric';

export const FONT_SIZE_PRESETS = {
  s: { label: 'S', screenSize: 16 },
  m: { label: 'M', screenSize: 22 },
  l: { label: 'L', screenSize: 30 },
  xl: { label: 'XL', screenSize: 42 },
} as const;

export type FontSizeId = keyof typeof FONT_SIZE_PRESETS;

export interface ToolStyle {
  color: string;
  strokeWidth: number;
  /** Tamaño de texto como preset; se convierte a px de la imagen según el zoom de vista. */
  fontSize: FontSizeId;
}

export type StyleProp = keyof ToolStyle;

export const DEFAULT_STYLE: ToolStyle = {
  color: '#ef4444',
  strokeWidth: 4,
  fontSize: 'm',
};

export const COLOR_PRESETS = [
  '#ef4444',
  '#f97316',
  '#facc15',
  '#22c55e',
  '#3b82f6',
  '#a855f7',
  '#111827',
  '#ffffff',
] as const;

export const STROKE_PRESETS = [2, 4, 8, 12] as const;

/**
 * Fuente de las anotaciones de texto: Excalifont (OFL-1.1, de Excalidraw),
 * empaquetada en la extensión y declarada en el CSS del editor.
 *
 * Los respaldos deben ser fuentes sin tamaño óptico: Fabric mide los
 * caracteres a 400px y los dibuja al tamaño real, y fuentes como SF Pro
 * (system-ui en macOS) cambian de ancho según el tamaño, lo que desfasa el
 * cursor respecto al texto mientras se escribe.
 */
export const ANNOTATION_FONT_NAME = 'Excalifont';
export const ANNOTATION_FONT_FAMILY = `${ANNOTATION_FONT_NAME}, 'Helvetica Neue', Helvetica, Arial, sans-serif`;
/** Interlineado de las anotaciones (el mismo que usa Excalidraw con esta fuente). */
export const ANNOTATION_LINE_HEIGHT = 1.25;

/** Tamaño de fuente en px de la imagen para que se vea con el tamaño del preset en pantalla. */
export function fontSizeToScene(id: FontSizeId, zoom: number): number {
  return FONT_SIZE_PRESETS[id].screenSize / zoom;
}

/** Preset más cercano al tamaño con el que se ve un texto en pantalla. */
export function closestFontSize(obj: IText, zoom: number): FontSizeId {
  const onScreen = obj.fontSize * obj.scaleY * zoom;
  let best: FontSizeId = 'm';
  for (const id of Object.keys(FONT_SIZE_PRESETS) as FontSizeId[]) {
    const diff = Math.abs(FONT_SIZE_PRESETS[id].screenSize - onScreen);
    if (diff < Math.abs(FONT_SIZE_PRESETS[best].screenSize - onScreen)) best = id;
  }
  return best;
}

/** Qué controles de estilo tienen efecto sobre un objeto. */
export function styleTargetsOf(obj: FabricObject): StyleProp[] {
  return obj instanceof IText ? ['color', 'fontSize'] : ['color', 'strokeWidth'];
}

/** Objetos propios que saben cómo aplicar un cambio de estilo a sí mismos. */
export interface Stylable {
  applyToolStyle(patch: Partial<ToolStyle>, zoom: number): void;
}

function isStylable(obj: unknown): obj is Stylable {
  return typeof (obj as Partial<Stylable>).applyToolStyle === 'function';
}

/**
 * Aplica a un objeto existente solo las propiedades que cambiaron (p. ej. al
 * elegir otro color con algo seleccionado, el tamaño del texto no se toca).
 */
export function applyStyleToObject(obj: FabricObject, patch: Partial<ToolStyle>, zoom: number): void {
  if (isStylable(obj)) {
    obj.applyToolStyle(patch, zoom);
    return;
  }
  if (obj instanceof IText) {
    if (patch.color !== undefined) obj.set({ fill: patch.color });
    if (patch.fontSize !== undefined) obj.set({ fontSize: fontSizeToScene(patch.fontSize, zoom) / obj.scaleY });
    return;
  }
  if (patch.color !== undefined) obj.set({ stroke: patch.color });
  if (patch.strokeWidth !== undefined) obj.set({ strokeWidth: patch.strokeWidth });
}
