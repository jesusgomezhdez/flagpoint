import { ArrowTool } from './arrow/arrow-tool';
import { EllipseTool } from './ellipse/ellipse-tool';
import { PencilTool } from './pencil/pencil-tool';
import { RectangleTool } from './rectangle/rectangle-tool';
import { ToolRegistry } from './registry';
import { SelectTool } from './select/select-tool';
import { StickyNoteTool } from './sticky-note/sticky-note-tool';
import { TextTool } from './text/text-tool';

export type { IconComponent, Tool, ToolContext } from './tool';
export { ToolRegistry } from './registry';

export const DEFAULT_TOOL_ID = 'select';

/** Registro por defecto; el orden define el orden en la barra. */
export function createDefaultToolRegistry(): ToolRegistry {
  return new ToolRegistry()
    .register(new SelectTool())
    .register(new PencilTool())
    .register(new ArrowTool())
    .register(new RectangleTool())
    .register(new EllipseTool())
    .register(new TextTool())
    .register(new StickyNoteTool());
}
