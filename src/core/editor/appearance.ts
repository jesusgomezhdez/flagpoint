import { InteractiveFabricObject, type Canvas } from 'fabric';

export const ACCENT_COLOR = '#6366f1';

/** Controles de selección: esquinas circulares blancas con borde de acento. */
InteractiveFabricObject.ownDefaults = {
  ...InteractiveFabricObject.ownDefaults,
  borderColor: ACCENT_COLOR,
  borderScaleFactor: 1.5,
  cornerColor: '#ffffff',
  cornerStrokeColor: ACCENT_COLOR,
  cornerStyle: 'circle',
  cornerSize: 11,
  transparentCorners: false,
};

export function applyCanvasAppearance(canvas: Canvas): void {
  canvas.selectionColor = 'rgba(99, 102, 241, 0.08)';
  canvas.selectionBorderColor = 'rgba(99, 102, 241, 0.6)';
  canvas.selectionLineWidth = 1;
}
