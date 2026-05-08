'use client';

import { useEffect, useRef, useState } from 'react';
import { RefreshCw, Crosshair } from 'lucide-react';
import { useTokensStore } from '@/components/playground/store/useTokensStore';
import { themeToCssVars } from '@/components/playground/lib/applyTokens';

export type DeviceSize = 'mobile' | 'tablet' | 'desktop';

const DEVICE_WIDTHS: Record<DeviceSize, number | null> = {
  mobile:  390,
  tablet:  768,
  desktop: null,
};

const DEVICE_LABELS: Record<DeviceSize, string> = {
  mobile:  '390px',
  tablet:  '768px',
  desktop: 'Full',
};

const DEFAULT_URL = '/es';

interface PreviewFrameProps {
  device: DeviceSize;
  onDeviceChange: (d: DeviceSize) => void;
  onInspect?: (category: string, label: string) => void;
}

export default function PreviewFrame({ device, onDeviceChange, onInspect }: PreviewFrameProps) {
  const mode  = useTokensStore((s) => s.mode);
  const theme = useTokensStore((s) => s.tokens[mode]);

  const iframeRef  = useRef<HTMLIFrameElement>(null);
  const themeRef   = useRef(theme);           // always-current snapshot for onLoad callbacks
  const retryRef   = useRef<ReturnType<typeof setTimeout>[]>([]);

  const [url, setUrl]         = useState(DEFAULT_URL);
  const [inputUrl, setInputUrl] = useState(DEFAULT_URL);
  const [loading, setLoading]       = useState(true);
  const [synced, setSynced]         = useState(false);
  const [inspecting, setInspecting] = useState(false);

  // Keep ref in sync via effect (avoids react-hooks/refs "update during render" rule).
  useEffect(() => {
    themeRef.current = theme;
  }, [theme]);

  // ── Inspector mode ───────────────────────────────────────────────────────
  function sendInspectorMsg(on: boolean) {
    iframeRef.current?.contentWindow?.postMessage(
      { type: on ? 'PROPYTE_INSPECTOR_ON' : 'PROPYTE_INSPECTOR_OFF' },
      '*',
    );
  }

  function toggleInspector() {
    const next = !inspecting;
    setInspecting(next);
    sendInspectorMsg(next);
  }

  // Listen for element-click events from the iframe inspector.
  useEffect(() => {
    const handler = (e: MessageEvent) => {
      if (e.data?.type !== 'PROPYTE_ELEMENT_CLICK') return;
      setInspecting(false);
      sendInspectorMsg(false);
      onInspect?.(e.data.category as string, e.data.label as string);
    };
    window.addEventListener('message', handler);
    return () => window.removeEventListener('message', handler);
  }, [onInspect]);

  // Turn off inspector when navigating to a new URL — uses the React docs
  // pattern "Adjusting state when a prop changes": setState during render,
  // gated by tracking the previous url value (avoids cascading effect renders).
  const [prevUrl, setPrevUrl] = useState(url);
  if (url !== prevUrl) {
    setPrevUrl(url);
    if (inspecting) setInspecting(false);
  }

  // ── Push vars to iframe ──────────────────────────────────────────────────
  function pushTokens(iframe: HTMLIFrameElement | null = iframeRef.current) {
    if (!iframe?.contentWindow) return;
    const vars = themeToCssVars(themeRef.current);
    iframe.contentWindow.postMessage({ type: 'PROPYTE_TOKENS', vars }, '*');
    setSynced(true);
  }

  // Re-push on every token change (real-time slider/color edits).
  useEffect(() => {
    pushTokens();
  }, [theme]);

  // Clean up retry timers on unmount.
  useEffect(() => {
    return () => { retryRef.current.forEach(clearTimeout); };
  }, []);

  function handleLoad(e: React.SyntheticEvent<HTMLIFrameElement>) {
    const iframe = e.currentTarget;
    setLoading(false);
    setSynced(false);

    // Clear any previous retries from a prior load.
    retryRef.current.forEach(clearTimeout);

    // Push immediately + retry to cover React hydration delay in the iframe.
    pushTokens(iframe);
    retryRef.current = [
      setTimeout(() => { pushTokens(iframe); setSynced(true); }, 400),
      setTimeout(() => { pushTokens(iframe); setSynced(true); }, 1000),
    ];
  }

  function navigate(path: string) {
    const clean = path.startsWith('/') ? path : `/${path}`;
    setUrl(clean);
    setInputUrl(clean);
    setLoading(true);
    setSynced(false);
  }

  const width = DEVICE_WIDTHS[device];

  return (
    <div className="flex flex-col h-full">
      {/* ── Toolbar ── */}
      <div className="flex items-center gap-2 px-3 py-2 border-b border-neutral-200 bg-neutral-50 shrink-0">
        {/* Device buttons */}
        <div className="flex rounded-md border border-neutral-200 overflow-hidden shrink-0">
          {(Object.keys(DEVICE_WIDTHS) as DeviceSize[]).map((d) => (
            <button
              key={d}
              type="button"
              onClick={() => onDeviceChange(d)}
              className={`text-xs px-2.5 py-1 transition-colors border-r border-neutral-200 last:border-r-0 ${
                device === d
                  ? 'bg-neutral-800 text-white'
                  : 'bg-white text-neutral-600 hover:bg-neutral-100'
              }`}
              title={`Vista ${DEVICE_LABELS[d]}`}
            >
              {DEVICE_LABELS[d]}
            </button>
          ))}
        </div>

        {/* Inspector toggle */}
        <button
          type="button"
          onClick={toggleInspector}
          title={inspecting ? 'Desactivar inspector (click en elemento → sección)' : 'Inspector: click en elemento → saltar a sección'}
          className={`flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-md border transition-colors shrink-0 ${
            inspecting
              ? 'bg-[#5CE0D2] border-[#4BCEC0] text-[#0F1923] font-medium'
              : 'bg-white border-neutral-200 text-neutral-600 hover:bg-neutral-100'
          }`}
          aria-pressed={inspecting}
        >
          <Crosshair size={13} />
          {inspecting ? 'Inspecting…' : 'Inspector'}
        </button>

        {/* URL bar */}
        <form
          className="flex-1 flex items-center gap-1.5"
          onSubmit={(e) => { e.preventDefault(); navigate(inputUrl); }}
        >
          <input
            type="text"
            value={inputUrl}
            onChange={(e) => setInputUrl(e.target.value)}
            className="flex-1 text-xs font-mono px-2.5 py-1.5 border border-neutral-200 rounded-md bg-white focus:outline-none focus:border-neutral-400"
            placeholder="/es, /es/desarrollos, /es/rentas…"
            spellCheck={false}
          />
          <button
            type="submit"
            className="p-1.5 rounded-md border border-neutral-200 bg-white hover:bg-neutral-100 transition-colors"
            aria-label="Navegar"
          >
            <RefreshCw size={13} className={loading ? 'animate-spin text-neutral-400' : 'text-neutral-600'} />
          </button>
        </form>

        {/* Sync indicator */}
        <span
          className={`text-2xs font-medium shrink-0 transition-colors ${synced ? 'text-green-600' : 'text-neutral-400'}`}
          title={synced ? 'Tokens aplicados' : 'Sincronizando…'}
        >
          {synced ? '● Live' : '○ …'}
        </span>
      </div>

      {/* ── Iframe ── */}
      <div className="flex-1 overflow-auto bg-[#e5e7eb] flex justify-center items-start py-4 px-4">
        <div
          className="bg-white shadow-xl rounded-lg overflow-hidden transition-all duration-300"
          style={{ width: width ? `${width}px` : '100%', minHeight: '100%' }}
        >
          <iframe
            ref={iframeRef}
            src={url}
            title="Design Playground Preview"
            className="w-full border-0"
            style={{ height: 'calc(100vh - 112px)' }}
            onLoad={handleLoad}
          />
        </div>
      </div>
    </div>
  );
}
