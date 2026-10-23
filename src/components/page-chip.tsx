import { Flag } from 'lucide-react';

/** Chip con el logo y la página de origen de la captura o grabación. */
export function PageChip({ title, url }: { title: string; url: string }) {
  let host = url;
  try {
    host = new URL(url).hostname;
  } catch {
    // URL vacía o inválida: se muestra tal cual.
  }
  return (
    <div className="glass flex min-w-0 items-center gap-2.5 justify-self-start rounded-full py-1.5 pr-4 pl-1.5" title={url}>
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-linear-to-br from-indigo-400 via-fuchsia-400 to-orange-300 text-white shadow-[inset_0_1px_0_rgb(255_255_255/0.4)]">
        <Flag size={15} strokeWidth={2.5} />
      </span>
      <div className="flex min-w-0 flex-col leading-tight">
        <span className="max-w-[28ch] truncate text-sm font-semibold text-slate-900">{title || host}</span>
        <span className="max-w-[28ch] truncate text-[11px] text-slate-500">{host}</span>
      </div>
    </div>
  );
}
