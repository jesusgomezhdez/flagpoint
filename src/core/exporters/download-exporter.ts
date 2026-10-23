import { Download } from 'lucide-react';
import type { CaptureContext } from '../types';
import type { Exporter } from './exporter';
import { buildFileName } from './file-name';

export class DownloadExporter implements Exporter {
  readonly id = 'download';
  readonly label = 'Descargar PNG';
  readonly icon = Download;
  readonly successMessage = 'Imagen descargada';

  async export(image: Blob, context: CaptureContext): Promise<void> {
    const url = URL.createObjectURL(image);
    try {
      const link = document.createElement('a');
      link.href = url;
      link.download = buildFileName(context, 'png');
      link.click();
    } finally {
      // Dar tiempo al navegador para iniciar la descarga antes de liberar el blob.
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    }
  }
}
