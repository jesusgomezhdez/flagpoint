/** `flagpoint_<host>_<fecha>.<ext>`, con la fecha y la página de origen. */
export function buildFileName(source: { url: string; timestamp: number }, extension: string): string {
  const date = new Date(source.timestamp);
  const pad = (n: number) => String(n).padStart(2, '0');
  const stamp = `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}_${pad(date.getHours())}-${pad(date.getMinutes())}-${pad(date.getSeconds())}`;

  let host = '';
  try {
    host = new URL(source.url).hostname.replace(/[^a-z0-9.-]/gi, '');
  } catch {
    // URL vacía o inválida: se omite el host.
  }
  return `flagpoint_${host ? `${host}_` : ''}${stamp}.${extension}`;
}
