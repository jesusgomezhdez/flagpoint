import type { CaptureStrategy } from './capture-strategy';
import { VisibleTabStrategy } from './visible-tab-strategy';

export { CaptureError, type CaptureStrategy } from './capture-strategy';
export { VisibleTabStrategy } from './visible-tab-strategy';

/** Estrategias disponibles. Mañana: AreaStrategy, FullPageStrategy. */
export const captureStrategies: Record<string, CaptureStrategy> = {
  'visible-tab': new VisibleTabStrategy(),
};

export const DEFAULT_CAPTURE_STRATEGY = 'visible-tab';
