import { Download } from 'lucide-react';
import type { CaptureContext } from '../types';
import type { Exporter } from './exporter';

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
      link.download = buildFileName(context);
      link.click();
    } finally {
      // Dar tiempo al navegador para iniciar la descarga antes de liberar el blob.
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    }
  }
}

function buildFileName(context: CaptureContext): string {
  const date = new Date(context.timestamp);
  const pad = (n: number) => String(n).padStart(2, '0');
  const stamp = `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}_${pad(date.getHours())}-${pad(date.getMinutes())}-${pad(date.getSeconds())}`;

  let host = '';
  try {
    host = new URL(context.url).hostname.replace(/[^a-z0-9.-]/gi, '');
  } catch {
    // URL vacía o inválida: se omite el host.
  }
  return `flagpoint_${host ? `${host}_` : ''}${stamp}.png`;
}
