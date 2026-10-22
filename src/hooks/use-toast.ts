import { useCallback, useEffect, useRef, useState } from 'react';

export interface ToastMessage {
  id: number;
  text: string;
  variant: 'success' | 'error';
}

const TOAST_DURATION_MS = 2500;

export function useToast() {
  const [toast, setToast] = useState<ToastMessage | null>(null);
  const timer = useRef<number | undefined>(undefined);

  const show = useCallback((text: string, variant: ToastMessage['variant'] = 'success') => {
    window.clearTimeout(timer.current);
    setToast({ id: Date.now(), text, variant });
    timer.current = window.setTimeout(() => setToast(null), TOAST_DURATION_MS);
  }, []);

  useEffect(() => () => window.clearTimeout(timer.current), []);

  return { toast, show };
}
