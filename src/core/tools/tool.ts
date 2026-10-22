import type { Canvas } from 'fabric';
import type { ComponentType } from 'react';
import type { StyleProp, ToolStyle } from '../editor/style';

export type IconComponent = ComponentType<{ size?: number; className?: string }>;

/** Lo que el editor expone a cada herramienta. */
export interface ToolContext {
  readonly canvas: Canvas;
  getStyle(): ToolStyle;
  /** Registra un punto en el historial de deshacer/rehacer. */
  commit(): void;
  /** Cambia la herramienta activa (p. ej. volver a "seleccionar" tras crear un texto). */
  setTool(id: string): void;
}

export interface Tool {
  readonly id: string;
  readonly label: string;
  readonly icon: IconComponent;
  /** Tecla (sin modificadores) para activar la herramienta. */
  readonly shortcut?: string;
  /** Controles de estilo que usa la herramienta; la barra de estilo muestra solo estos. */
  readonly styleProps?: StyleProp[];
  activate(ctx: ToolContext): void;
  deactivate(ctx: ToolContext): void;
  /** Se llama cuando cambia el color/grosor mientras la herramienta está activa. */
  onStyleChange?(ctx: ToolContext, style: ToolStyle): void;
}
