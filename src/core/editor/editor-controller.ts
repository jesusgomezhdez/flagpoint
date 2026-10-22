import { Canvas, FabricImage, IText, util, type FabricObject } from 'fabric';
import type { ExporterRegistry } from '../exporters';
import { StickyNote } from '../tools/sticky-note/sticky-note';
import type { Tool, ToolContext, ToolRegistry } from '../tools';
import type { CaptureContext } from '../types';
import { applyCanvasAppearance } from './appearance';
import { loadAnnotationFont } from './fonts';
import { History } from './history';
import {
  applyStyleToObject,
  closestFontSize,
  DEFAULT_STYLE,
  styleTargetsOf,
  type StyleProp,
  type ToolStyle,
} from './style';

const STYLE_PROP_ORDER: StyleProp[] = ['color', 'strokeWidth', 'fontSize'];
const DEFAULT_STYLE_TARGETS: StyleProp[] = ['color', 'strokeWidth'];

export interface EditorState {
  activeToolId: string;
  style: ToolStyle;
  /** Controles de estilo relevantes para la herramienta activa y la selección. */
  styleTargets: StyleProp[];
  canUndo: boolean;
  canRedo: boolean;
  /** Zoom de vista (no afecta la resolución de exportación). */
  zoom: number;
  hasSelection: boolean;
  isEditingText: boolean;
}

export interface EditorControllerOptions {
  tools: ToolRegistry;
  exporters: ExporterRegistry;
  initialToolId: string;
}

/**
 * Núcleo del editor, independiente de React: canvas de Fabric, herramienta
 * activa, estilo, historial, zoom de vista y exportación.
 */
export class EditorController {
  readonly canvas: Canvas;
  readonly tools: ToolRegistry;
  readonly exporters: ExporterRegistry;

  private state: EditorState;
  private readonly listeners = new Set<() => void>();
  private readonly history = new History();
  private readonly toolContext: ToolContext;
  private readonly disposers: VoidFunction[] = [];
  private imageSize = { width: 0, height: 0 };
  private restoring = false;

  constructor(element: HTMLCanvasElement, options: EditorControllerOptions) {
    this.tools = options.tools;
    this.exporters = options.exporters;
    this.canvas = new Canvas(element, {
      preserveObjectStacking: true,
      uniformScaling: false,
    });
    applyCanvasAppearance(this.canvas);
    this.state = {
      activeToolId: options.initialToolId,
      style: DEFAULT_STYLE,
      styleTargets: DEFAULT_STYLE_TARGETS,
      canUndo: false,
      canRedo: false,
      zoom: 1,
      hasSelection: false,
      isEditingText: false,
    };
    this.toolContext = {
      canvas: this.canvas,
      getStyle: () => this.state.style,
      commit: () => this.commit(),
      setTool: (id) => this.setTool(id),
    };
    this.bindCanvasEvents();
    this.getTool(this.state.activeToolId)?.activate(this.toolContext);
    this.syncStyleTargets();
  }

  // ---- Suscripción (compatible con useSyncExternalStore) ----

  subscribe = (listener: () => void): (() => void) => {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  };

  getState = (): EditorState => this.state;

  private setState(patch: Partial<EditorState>): void {
    this.state = { ...this.state, ...patch };
    this.listeners.forEach((listener) => listener());
  }

  // ---- Imagen ----

  async loadImage(dataUrl: string): Promise<void> {
    const [image] = await Promise.all([FabricImage.fromURL(dataUrl), loadAnnotationFont()]);
    this.imageSize = { width: image.width, height: image.height };
    // Origen centrado (default de Fabric v7): posicionamos por el centro.
    image.set({ left: image.width / 2, top: image.height / 2, selectable: false, evented: false });
    this.canvas.backgroundImage = image;
    this.history.push(this.serialize());
    this.syncHistoryState();
    this.canvas.requestRenderAll();
  }

  /** Ajusta el zoom de vista para que la imagen quepa en el contenedor. */
  fitTo(containerWidth: number, containerHeight: number): void {
    const { width, height } = this.imageSize;
    if (!width || !height || containerWidth <= 0 || containerHeight <= 0) return;
    const zoom = Math.min(1, containerWidth / width, containerHeight / height);
    this.canvas.setDimensions({ width: Math.floor(width * zoom), height: Math.floor(height * zoom) });
    this.canvas.setZoom(zoom);
    this.setState({ zoom });
  }

  // ---- Herramientas y estilo ----

  setTool(id: string): void {
    if (id === this.state.activeToolId) return;
    const next = this.getTool(id);
    if (!next) return;
    this.getTool(this.state.activeToolId)?.deactivate(this.toolContext);
    this.setState({ activeToolId: id });
    next.activate(this.toolContext);
    this.syncStyleTargets();
  }

  setStyle(patch: Partial<ToolStyle>): void {
    const style = { ...this.state.style, ...patch };
    this.setState({ style });
    this.getTool(this.state.activeToolId)?.onStyleChange?.(this.toolContext, style);

    const selected = this.canvas.getActiveObjects();
    if (selected.length === 0) return;
    const zoom = this.canvas.getZoom();
    selected.forEach((obj) => applyStyleToObject(obj, patch, zoom));
    this.canvas.requestRenderAll();
    this.commit();
  }

  private getTool(id: string): Tool | undefined {
    return this.tools.get(id);
  }

  /**
   * Calcula qué controles de estilo mostrar (los de la herramienta activa más
   * los de los objetos seleccionados) y refleja el tamaño de un texto seleccionado.
   */
  private syncStyleTargets(): void {
    const selected = this.canvas.getActiveObjects();
    const targets = new Set(this.getTool(this.state.activeToolId)?.styleProps ?? []);
    selected.forEach((obj) => styleTargetsOf(obj).forEach((prop) => targets.add(prop)));

    const styleTargets = targets.size > 0 ? STYLE_PROP_ORDER.filter((prop) => targets.has(prop)) : DEFAULT_STYLE_TARGETS;
    const [only] = selected;
    const style =
      selected.length === 1 && only instanceof IText
        ? { ...this.state.style, fontSize: closestFontSize(only, this.canvas.getZoom()) }
        : this.state.style;
    this.setState({ styleTargets, style });
  }

  // ---- Edición ----

  deleteSelection(): void {
    const selected = this.canvas.getActiveObjects();
    if (selected.length === 0) return;
    this.canvas.discardActiveObject();
    this.canvas.remove(...selected);
    this.canvas.requestRenderAll();
    this.commit();
  }

  /** Sale de la edición de texto o limpia la selección. */
  cancelInteraction(): void {
    const active = this.canvas.getActiveObject();
    if (active instanceof IText && active.isEditing) {
      active.exitEditing();
    } else {
      this.canvas.discardActiveObject();
    }
    this.canvas.requestRenderAll();
  }

  async undo(): Promise<void> {
    const snapshot = this.history.undo();
    if (snapshot !== undefined) await this.restore(snapshot);
  }

  async redo(): Promise<void> {
    const snapshot = this.history.redo();
    if (snapshot !== undefined) await this.restore(snapshot);
  }

  private commit(): void {
    if (this.restoring) return;
    this.history.push(this.serialize());
    this.syncHistoryState();
  }

  private serialize(): string {
    // Solo las anotaciones: la captura vive en backgroundImage y no entra al historial.
    return JSON.stringify(this.canvas.getObjects().map((obj) => obj.toObject()));
  }

  private async restore(snapshot: string): Promise<void> {
    this.restoring = true;
    try {
      const objects = await util.enlivenObjects<FabricObject>(JSON.parse(snapshot) as object[]);
      this.canvas.discardActiveObject();
      this.canvas.remove(...this.canvas.getObjects());
      this.canvas.add(...objects);
      this.canvas.requestRenderAll();
    } finally {
      this.restoring = false;
      this.syncHistoryState();
    }
  }

  private syncHistoryState(): void {
    this.setState({ canUndo: this.history.canUndo, canRedo: this.history.canRedo });
  }

  // ---- Exportación ----

  /** PNG con la captura + anotaciones a la resolución real de la captura. */
  async exportImage(): Promise<Blob> {
    const { zoom } = this.state;
    const blob = await this.canvas.toBlob({
      format: 'png',
      multiplier: 1 / zoom,
      left: 0,
      top: 0,
      width: this.imageSize.width * zoom,
      height: this.imageSize.height * zoom,
    });
    if (!blob) throw new Error('No se pudo generar la imagen');
    return blob;
  }

  async runExporter(id: string, context: CaptureContext): Promise<void> {
    const exporter = this.exporters.get(id);
    if (!exporter) throw new Error(`Exporter "${id}" no registrado`);
    await exporter.export(await this.exportImage(), context);
  }

  // ---- Eventos del canvas ----

  private bindCanvasEvents(): void {
    const { canvas } = this;
    const syncSelection = () => {
      this.setState({ hasSelection: canvas.getActiveObjects().length > 0 });
      this.syncStyleTargets();
    };

    this.disposers.push(
      canvas.on('selection:created', syncSelection),
      canvas.on('selection:updated', syncSelection),
      canvas.on('selection:cleared', syncSelection),
      // Mover/escalar/rotar y cambios de texto.
      canvas.on('object:modified', () => this.commit()),
      canvas.on('text:editing:entered', () => this.setState({ isEditingText: true })),
      canvas.on('text:editing:exited', ({ target }) => {
        this.setState({ isEditingText: false });
        // Un texto que quedó vacío se descarta; un post-it vacío se conserva.
        if (!(target instanceof StickyNote) && target.text.trim() === '') {
          canvas.remove(target);
        }
        this.commit();
      }),
    );
  }

  async dispose(): Promise<void> {
    this.disposers.forEach((dispose) => dispose());
    this.listeners.clear();
    await this.canvas.dispose();
  }
}
