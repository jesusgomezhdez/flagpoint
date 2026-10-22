import { CircleAlert, LoaderCircle } from 'lucide-react';

interface MessageScreenProps {
  variant: 'loading' | 'error';
  message: string;
}

export function MessageScreen({ variant, message }: MessageScreenProps) {
  return (
    <div className="relative flex h-full items-center justify-center p-8">
      <div className="app-backdrop" />
      <div className="glass relative flex max-w-md flex-col items-center gap-4 rounded-3xl px-10 py-9 text-center">
        {variant === 'loading' ? (
          <LoaderCircle className="animate-spin text-slate-400" size={28} />
        ) : (
          <span className="flex h-12 w-12 items-center justify-center rounded-full bg-linear-to-br from-rose-100 to-orange-100 text-rose-500 shadow-[inset_0_0_0_1px_rgb(255_255_255/0.8)]">
            <CircleAlert size={24} />
          </span>
        )}
        {variant === 'error' && <h1 className="text-base font-semibold text-slate-900">No se pudo capturar la página</h1>}
        <p className="text-sm leading-relaxed text-slate-500">{message}</p>
      </div>
    </div>
  );
}
