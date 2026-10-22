import { ClipboardExporter } from './clipboard-exporter';
import { DownloadExporter } from './download-exporter';
import { ExporterRegistry } from './exporter';

export { ExporterRegistry, type Exporter } from './exporter';

export const CLIPBOARD_EXPORTER_ID = 'clipboard';

/** Registro por defecto; la barra de acciones se genera a partir de él. */
export function createDefaultExporterRegistry(): ExporterRegistry {
  return new ExporterRegistry().register(new ClipboardExporter()).register(new DownloadExporter());
}
