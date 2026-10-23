import { useEffect, useState, type ComponentType } from 'react';
import { Camera, CircleAlert, Flag, LoaderCircle, Square, Video } from 'lucide-react';
import type { BackgroundMessage, CommandResult } from '@/core/messages';
import { formatClock, getRecordingState, MAX_RECORDING_MS, watchRecordingState, type RecordingState } from '@/core/recording';

type Busy = 'screenshot' | 'recording' | 'stop' | null;

export default function App() {
  // `undefined` = aún cargando; `null` = sin grabación en curso.
  const [recording, setRecording] = useState<RecordingState | null | undefined>(undefined);
  const [busy, setBusy] = useState<Busy>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void getRecordingState().then((state) => setRecording(state ?? null));
    return watchRecordingState((state) => setRecording(state ?? null));
  }, []);

  async function run(action: Exclude<Busy, null>, message: BackgroundMessage) {
    setBusy(action);
    setError(null);
    const result = (await browser.runtime.sendMessage(message).catch(() => undefined)) as CommandResult | undefined;
    setBusy(null);
    if (result?.ok) window.close();
    else setError(result?.error ?? 'Ocurrió un error inesperado. Intenta de nuevo.');
  }

  async function runOnActiveTab(action: 'screenshot' | 'recording') {
    const [tab] = await browser.tabs.query({ active: true, currentWindow: true });
    if (tab?.id === undefined) {
      setError('No se encontró la pestaña activa.');
      return;
    }
    const type = action === 'screenshot' ? 'take-screenshot' : 'start-recording';
    await run(action, { target: 'background', type, tabId: tab.id });
  }

  return (
    <div className="relative w-72 overflow-hidden">
      <div className="app-backdrop" />
      <div className="relative flex flex-col gap-3 p-3">
        <header className="flex items-center gap-2.5 px-1 pt-1">
          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-linear-to-br from-indigo-400 via-fuchsia-400 to-orange-300 text-white shadow-[inset_0_1px_0_rgb(255_255_255/0.4)]">
            <Flag size={13} strokeWidth={2.5} />
          </span>
          <span className="text-sm font-semibold text-slate-900">Flagpoint</span>
        </header>

        {recording === undefined ? null : recording ? (
          <RecordingPanel
            recording={recording}
            stopping={busy === 'stop'}
            onStop={() => void run('stop', { target: 'background', type: 'stop-recording' })}
          />
        ) : (
          <div className="glass flex flex-col gap-1 rounded-2xl p-1.5">
            <ModeButton
              icon={Camera}
              label="Capturar pantalla"
              hint="Área visible de la pestaña"
              busy={busy === 'screenshot'}
              disabled={busy !== null}
              onClick={() => void runOnActiveTab('screenshot')}
            />
            <ModeButton
              icon={Video}
              label="Grabar video"
              hint={`Hasta ${MAX_RECORDING_MS / 60_000} min · sin audio`}
              busy={busy === 'recording'}
              disabled={busy !== null}
              onClick={() => void runOnActiveTab('recording')}
            />
          </div>
        )}

        {error && (
          <p role="alert" className="flex items-start gap-2 px-1 text-xs leading-relaxed text-rose-600">
            <CircleAlert size={14} className="mt-0.5 shrink-0" />
            {error}
          </p>
        )}
      </div>
    </div>
  );
}

interface ModeButtonProps {
  icon: ComponentType<{ size?: number }>;
  label: string;
  hint: string;
  busy: boolean;
  disabled: boolean;
  onClick(): void;
}

function ModeButton({ icon: Icon, label, hint, busy, disabled, onClick }: ModeButtonProps) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className="flex items-center gap-3 rounded-xl p-2 text-left outline-none transition-[background-color,opacity] hover:bg-white/80 focus-visible:ring-2 focus-visible:ring-accent/40 disabled:opacity-60"
    >
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white/80 text-slate-700 shadow-[inset_0_0_0_1px_rgb(15_23_42/0.06)]">
        {busy ? <LoaderCircle size={17} className="animate-spin" /> : <Icon size={17} />}
      </span>
      <span className="flex flex-col leading-tight">
        <span className="text-sm font-medium text-slate-900">{label}</span>
        <span className="text-[11px] text-slate-500">{hint}</span>
      </span>
    </button>
  );
}

function RecordingPanel({
  recording,
  stopping,
  onStop,
}: {
  recording: RecordingState;
  stopping: boolean;
  onStop(): void;
}) {
  const [now, setNow] = useState(Date.now);
  const [shortcut, setShortcut] = useState<string | null>(null);

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 500);
    return () => window.clearInterval(timer);
  }, []);

  // El usuario puede cambiar o quitar el atajo en chrome://extensions/shortcuts.
  useEffect(() => {
    void browser.commands.getAll().then((commands) => {
      setShortcut(commands.find((command) => command.name === 'stop-recording')?.shortcut || null);
    });
  }, []);

  const elapsed = Math.min(Math.max(0, now - recording.startedAt), MAX_RECORDING_MS);

  return (
    <div className="glass flex flex-col gap-3 rounded-2xl p-3">
      <div className="flex items-center justify-between">
        <span className="flex items-center gap-2 text-sm font-medium text-slate-900">
          <span className="h-2.5 w-2.5 animate-pulse rounded-full bg-rose-500" />
          Grabando pestaña
        </span>
        <span className="text-xs font-medium text-slate-500 tabular-nums">
          {formatClock(elapsed)} / {formatClock(MAX_RECORDING_MS)}
        </span>
      </div>
      <button
        type="button"
        disabled={stopping}
        onClick={onStop}
        className="flex h-9 items-center justify-center gap-2 rounded-full bg-[linear-gradient(135deg,#334155,#0f172a)] px-4 text-sm font-medium text-white shadow-[inset_0_1px_0_rgb(255_255_255/0.18),0_6px_16px_-6px_rgb(15_23_42/0.6)] outline-none transition-[background-color,opacity] hover:bg-[linear-gradient(135deg,#475569,#1e293b)] focus-visible:ring-2 focus-visible:ring-accent/40 disabled:opacity-60"
      >
        {stopping ? <LoaderCircle size={15} className="animate-spin" /> : <Square size={13} fill="currentColor" />}
        Detener y ver video
      </button>
      <p className="text-center text-[11px] leading-snug text-slate-500">
        También puedes detenerla desde la pestaña{shortcut ? ` o con ${shortcut}` : ''}.
      </p>
    </div>
  );
}
