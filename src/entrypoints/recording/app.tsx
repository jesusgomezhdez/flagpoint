import { useEffect, useState, type SyntheticEvent } from 'react';
import { Download } from 'lucide-react';
import { MessageScreen } from '@/components/message-screen';
import { PageChip } from '@/components/page-chip';
import { Toast } from '@/components/toast';
import { buildFileName } from '@/core/exporters/file-name';
import type { RecordingResult } from '@/core/recording';
import { useRecordingHandoff } from '@/hooks/use-recording-handoff';
import { useToast } from '@/hooks/use-toast';

export default function App() {
  const recording = useRecordingHandoff();

  if (recording.status === 'loading') return <MessageScreen variant="loading" message="Cargando grabación…" />;
  if (recording.status === 'error') {
    return <MessageScreen variant="error" title="No se pudo grabar la pestaña" message={recording.message} />;
  }
  return <Preview recording={recording.recording} />;
}

function Preview({ recording }: { recording: RecordingResult }) {
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const { toast, show } = useToast();

  useEffect(() => {
    const url = URL.createObjectURL(recording.blob);
    setVideoUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [recording.blob]);

  const download = () => {
    if (!videoUrl) return;
    const link = document.createElement('a');
    link.href = videoUrl;
    link.download = buildFileName({ url: recording.url, timestamp: recording.startedAt }, 'webm');
    link.click();
    show('Video descargado');
  };

  return (
    <div className="relative h-full overflow-hidden">
      <div className="app-backdrop" />

      <main className="absolute inset-x-6 top-[84px] bottom-[88px] flex items-center justify-center">
        {videoUrl && (
          <video
            src={videoUrl}
            controls
            onLoadedMetadata={fixUnknownDuration}
            className="max-h-full max-w-full rounded-[14px] bg-slate-900 shadow-[0_0_0_1px_rgb(255_255_255/0.9),0_0_0_6px_rgb(255_255_255/0.35),0_40px_80px_-32px_rgb(15_23_42/0.4),0_12px_24px_-12px_rgb(15_23_42/0.18)]"
          />
        )}
      </main>

      <header className="pointer-events-none absolute inset-x-0 top-0 grid grid-cols-[1fr_auto] items-start gap-3 p-4 [&>*]:pointer-events-auto">
        <PageChip title={recording.title} url={recording.url} />
        <div className="glass flex items-center gap-1 rounded-full p-1.5">
          <button
            type="button"
            disabled={!videoUrl}
            onClick={download}
            className="flex h-9 items-center gap-2 rounded-full bg-[linear-gradient(135deg,#334155,#0f172a)] px-4 text-sm font-medium whitespace-nowrap text-white shadow-[inset_0_1px_0_rgb(255_255_255/0.18),0_6px_16px_-6px_rgb(15_23_42/0.6)] outline-none transition-[background-color,box-shadow,opacity] hover:bg-[linear-gradient(135deg,#475569,#1e293b)] focus-visible:ring-2 focus-visible:ring-accent/40 disabled:opacity-60"
          >
            <Download size={16} />
            Descargar video
          </button>
        </div>
      </header>

      <footer className="pointer-events-none absolute inset-x-0 bottom-0 flex justify-end p-4">
        <span className="glass pointer-events-auto rounded-full px-3 py-1.5 text-xs font-medium text-slate-500 tabular-nums">
          {formatDuration(recording.durationMs)} · {formatSize(recording.blob.size)} · WebM
        </span>
      </footer>

      <Toast toast={toast} />
    </div>
  );
}

/**
 * Respaldo por si no se pudo escribir la duración al grabar: Chrome la reporta
 * como `Infinity` y la barra de progreso no funciona. Saltar al final obliga al
 * navegador a recorrer el archivo y calcularla.
 */
function fixUnknownDuration(event: SyntheticEvent<HTMLVideoElement>) {
  const video = event.currentTarget;
  if (Number.isFinite(video.duration)) return;
  video.addEventListener(
    'durationchange',
    () => {
      video.currentTime = 0;
    },
    { once: true },
  );
  video.currentTime = Number.MAX_SAFE_INTEGER;
}

function formatDuration(ms: number): string {
  const totalSeconds = Math.round(ms / 1000);
  return `${Math.floor(totalSeconds / 60)}:${String(totalSeconds % 60).padStart(2, '0')}`;
}

function formatSize(bytes: number): string {
  const mb = bytes / (1024 * 1024);
  return mb >= 1 ? `${mb.toFixed(1)} MB` : `${Math.max(1, Math.round(bytes / 1024))} KB`;
}
