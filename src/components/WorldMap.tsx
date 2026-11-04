import { Component, lazy, Suspense, useCallback, useEffect, useState, type ReactNode } from "react";
import { Button } from "@/components/ui/button";

const WorldScene = lazy(() => import("./world/WorldScene"));

function hasWebGL() {
  try {
    const c = document.createElement("canvas");
    return !!(c.getContext("webgl2") || c.getContext("webgl"));
  } catch {
    return false;
  }
}

class SceneBoundary extends Component<{ children: ReactNode; fallback: ReactNode }, { failed: boolean }> {
  override state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  override render() {
    return this.state.failed ? this.props.fallback : this.props.children;
  }
}

function Fallback() {
  return (
    <div className="absolute inset-0 grid place-items-center px-6 text-center">
      <div className="glass-panel max-w-sm p-6">
        <p className="font-display text-4xl text-foreground">Jenia's World</p>
        <p className="mt-3 text-sm text-muted-foreground">
          The island map needs WebGL, which this browser or device doesn't seem to support. Try a recent version of Chrome, Safari, Firefox or Edge.
        </p>
      </div>
    </div>
  );
}

export function WorldMap({ onHome }: { onHome: () => void }) {
  const [supported, setSupported] = useState<boolean | null>(null);
  const [reducedMotion, setReducedMotion] = useState(false);
  const [ready, setReady] = useState(false);
  const [aboutOpen, setAboutOpen] = useState(false);
  const openAbout = useCallback(() => setAboutOpen(true), []);
  const markReady = useCallback(() => setReady(true), []);

  useEffect(() => {
    setSupported(hasWebGL());
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReducedMotion(mq.matches);
    const on = (e: MediaQueryListEvent) => setReducedMotion(e.matches);
    mq.addEventListener("change", on);
    return () => mq.removeEventListener("change", on);
  }, []);

  useEffect(() => {
    if (!aboutOpen) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setAboutOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [aboutOpen]);

  return (
    <div className="world-backdrop fixed inset-0 overflow-hidden">
      <div className={`absolute inset-0 transition-opacity duration-1000 ${ready ? "opacity-100" : "opacity-0"}`} data-scene-ready={ready ? "" : undefined}>
        {supported && (
          <SceneBoundary fallback={<Fallback />}>
            <Suspense fallback={null}>
              <WorldScene reducedMotion={reducedMotion} onOpenAbout={openAbout} onReady={markReady} />
            </Suspense>
          </SceneBoundary>
        )}
      </div>

      {supported === false && <Fallback />}

      {supported !== false && !ready && (
        <div className="absolute inset-0 grid place-items-center" role="status" aria-live="polite">
          <div className="flex flex-col items-center gap-3">
            <span className="loader-orb" aria-hidden />
            <p className="text-xs tracking-[0.25em] uppercase text-muted-foreground">Gathering the islands</p>
          </div>
        </div>
      )}

      <header className="pointer-events-none absolute inset-x-0 top-0 flex items-center justify-between p-4 sm:p-6">
        <Button variant="glass" size="sm" className="pointer-events-auto" onClick={onHome}>
          <span aria-hidden>←</span> Home
        </Button>
        <span className="font-display text-3xl text-foreground/80 sm:text-4xl">Jenia's World</span>
      </header>

      {ready && !aboutOpen && (
        <p className="pointer-events-none absolute inset-x-0 bottom-5 text-center text-xs text-muted-foreground">
          Drag to look around · scroll or pinch to zoom · tap “About Me” to visit
        </p>
      )}

      {aboutOpen && (
        <div className="pointer-events-none absolute inset-0 flex items-end justify-center p-4 sm:items-center sm:justify-end sm:p-8">
          <section role="dialog" aria-modal="false" aria-labelledby="about-title" className="glass-panel panel-enter pointer-events-auto w-full max-w-sm p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-[0.68rem] tracking-[0.25em] uppercase text-accent-foreground">Region · open</p>
                <h2 id="about-title" className="mt-1 font-display text-5xl leading-none text-foreground">About Me</h2>
              </div>
              <Button variant="ghost" size="icon" onClick={() => setAboutOpen(false)} aria-label="Close panel">
                ✕
              </Button>
            </div>
            <div className="mt-4 space-y-3 text-sm leading-relaxed text-muted-foreground">
              <p>[Placeholder] A short introduction from Jenia will live here.</p>
              <p>[Placeholder] A few lines about interests, projects, and what this little world is for.</p>
            </div>
            <div className="mt-6 flex gap-2">
              <Button variant="soft" size="sm" onClick={() => setAboutOpen(false)}>Back to map</Button>
              <Button variant="ghost" size="sm" onClick={onHome}>Home</Button>
            </div>
          </section>
        </div>
      )}
    </div>
  );
}
