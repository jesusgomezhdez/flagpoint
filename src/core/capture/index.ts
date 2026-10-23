import type { CaptureStrategy } from './capture-strategy';
import { VisibleTabStrategy } from './visible-tab-strategy';

export { CaptureError, type CaptureStrategy } from './capture-strategy';
export { isRestrictedUrl } from './restricted-urls';
export { VisibleTabStrategy } from './visible-tab-strategy';

export const captureStrategies: Record<string, CaptureStrategy> = {
  'visible-tab': new VisibleTabStrategy(),
};

export const DEFAULT_CAPTURE_STRATEGY = 'visible-tab';
