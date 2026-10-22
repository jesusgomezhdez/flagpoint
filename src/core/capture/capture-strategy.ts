import type { CaptureResult } from '../types';

export interface CaptureStrategy {
  readonly id: string;
  capture(tabId: number): Promise<CaptureResult>;
}

/** Error con un mensaje apto para mostrarse al usuario. */
export class CaptureError extends Error {
  override name = 'CaptureError';
}
