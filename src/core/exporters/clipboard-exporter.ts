import { Copy } from 'lucide-react';
import type { Exporter } from './exporter';

export class ClipboardExporter implements Exporter {
  readonly id = 'clipboard';
  readonly label = 'Copiar al portapapeles';
  readonly icon = Copy;
  readonly successMessage = 'Imagen copiada al portapapeles';

  async export(image: Blob): Promise<void> {
    await navigator.clipboard.write([new ClipboardItem({ 'image/png': image })]);
  }
}
