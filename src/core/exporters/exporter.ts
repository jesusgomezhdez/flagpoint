import type { IconComponent } from '../tools/tool';
import type { CaptureContext } from '../types';

/**
 * Destino de la imagen anotada. Hoy: descarga y portapapeles.
 * Mañana: Jira, GitHub Issues, Slack… cada uno es un Exporter más.
 */
export interface Exporter {
  readonly id: string;
  readonly label: string;
  readonly icon: IconComponent;
  /** Mensaje para el toast de éxito. */
  readonly successMessage: string;
  export(image: Blob, context: CaptureContext): Promise<void>;
}

export class ExporterRegistry {
  private readonly exporters = new Map<string, Exporter>();

  register(exporter: Exporter): this {
    if (this.exporters.has(exporter.id)) throw new Error(`Exporter "${exporter.id}" ya está registrado`);
    this.exporters.set(exporter.id, exporter);
    return this;
  }

  get(id: string): Exporter | undefined {
    return this.exporters.get(id);
  }

  list(): Exporter[] {
    return [...this.exporters.values()];
  }
}
