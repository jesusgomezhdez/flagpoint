import type { Tool } from './tool';

/**
 * Registro de herramientas. El editor y la barra de herramientas solo
 * conocen este registro, así que agregar una herramienta es registrar un
 * módulo nuevo (ver ./index.ts) sin tocar el núcleo.
 */
export class ToolRegistry {
  private readonly tools = new Map<string, Tool>();

  register(tool: Tool): this {
    if (this.tools.has(tool.id)) throw new Error(`Tool "${tool.id}" ya está registrada`);
    this.tools.set(tool.id, tool);
    return this;
  }

  get(id: string): Tool | undefined {
    return this.tools.get(id);
  }

  list(): Tool[] {
    return [...this.tools.values()];
  }
}
