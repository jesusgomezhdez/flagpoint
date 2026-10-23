/** Páginas que Chrome no deja capturar ni grabar a ninguna extensión. */
const RESTRICTED_URL_PATTERNS: RegExp[] = [
  /^chrome:\/\//,
  /^chrome-extension:\/\//,
  /^chrome-untrusted:\/\//,
  /^devtools:\/\//,
  /^edge:\/\//,
  /^about:/,
  /^view-source:/,
  /^https:\/\/chromewebstore\.google\.com\//,
  /^https:\/\/chrome\.google\.com\/webstore/,
];

export function isRestrictedUrl(url: string | undefined): boolean {
  if (!url) return false;
  return RESTRICTED_URL_PATTERNS.some((pattern) => pattern.test(url));
}
