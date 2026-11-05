import { Component, lazy, Suspense, useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { REGIONS, isUnlocked, regionById } from "@/lib/world/regions";
import { pick, t, useLang, type Lang } from "@/lib/i18n";
import { visitedKey, type Session } from "@/lib/user";
import { LangSwitch } from "./LangSwitch";
import { WorldPage } from "./WorldPage";

const WorldScene = lazy(() => import("./world/WorldScene"));

type Phase = "loading" | "ready" | "slow";

/**
 * Probe once and release the probe context immediately. Every probe canvas that
 * keeps its context alive counts against the browser's WebGL context budget.
 */
let webglSupport: boolean | null = null;
function hasWebGL() {
  if (webglSupport !== null) return webglSupport;
  try {
    const c = document.createElement("canvas");
    const gl = (c.getContext("webgl2") || c.getContext("webgl")) as WebGLRenderingContext | null;
    webglSupport = !!gl;
    gl?.getExtension("WEBGL_lose_context")?.loseContext();
  } catch {
    webglSupport = false;
  }
  return webglSupport;
}

class SceneBoundary extends Component<{ children: ReactNode; fallback: ReactNode }, { failed: boolean }> {
  override state = { failed: false };
  static getDerivedStateFromError(error: unknown) {
    // Runs before the fallback renders, so the message is readable there.
    const msg = error instanceof Error ? `${error.name}: ${error.message}` : String(error);
    if (typeof document !== "undefined") document.documentElement.dataset["sceneError"] = msg;
    return { failed: true };
  }
  override componentDidCatch(error: unknown) {
    console.error("[scene]", error);
  }
  override render() {
    return this.state.failed ? this.props.fallback : this.props.children;
  }
}

function readVisited(key: string): string[] {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    const known = new Set(REGIONS.map((r) => r.id));
    return parsed.filter((x): x is string => typeof x === "string" && known.has(x));
  } catch {
    return [];
  }
}

/** Flat list of places so the content stays reachable when the 3D map is unavailable. */
function FlatMap({
  lang,
  visited,
  reason,
  onOpen,
  onRetry,
  canRetry,
}: {
  lang: Lang;
  visited: string[];
  reason: "webgl" | "failed";
  onOpen: (id: string) => void;
  onRetry: () => void;
  canRetry: boolean;
}) {
  const ui = t(lang);
  return (
    <div className="absolute inset-0 z-10 grid place-items-center overflow-y-auto px-6 py-20">
      <div className="w-full max-w-sm text-center">
        <p className="text-sm leading-relaxed text-muted-foreground">
          {reason === "webgl" ? ui.webgl : ui.loadFailed}
        </p>
        <div className="mt-7 space-y-2">
          {REGIONS.map((r) => {
            const open = isUnlocked(r.id, visited);
            return (
              <button
                key={r.id}
                type="button"
                disabled={!open}
                onClick={() => onOpen(r.id)}
                className="flex w-full items-center justify-between rounded-2xl border border-border/60 bg-background/70 px-4 py-3 text-left text-sm text-foreground transition hover:border-foreground/30 disabled:cursor-not-allowed disabled:opacity-45"
              >
                <span>{pick(lang, r.name, r.nameZh)}</span>
                <span className="text-xs text-muted-foreground">
                  {open ? (visited.includes(r.id) ? "✓" : "→") : ui.locked}
                </span>
              </button>
            );
          })}
        </div>
        {canRetry && (
          <Button variant="soft" size="sm" className="mt-6" onClick={onRetry}>
            {ui.retry}
          </Button>
        )}
      </div>
    </div>
  );
}

/** Shown only if three.js itself throws — never a list of islands, just a way out. */
function SceneStuck({ lang, onRetry }: { lang: Lang; onRetry: () => void }) {
  const detail = typeof document !== "undefined" ? document.documentElement.dataset["sceneError"] : undefined;
  return (
    <div className="absolute inset-0 grid place-items-center px-6">
      <div className="flex max-w-sm flex-col items-center gap-4 text-center">
        <p className="text-sm leading-relaxed text-muted-foreground">
          {pick(
            lang,
            "This browser couldn't start the 3D scene. Try again — if it keeps failing, check that hardware acceleration is on.",
            "这个浏览器没能启动 3D 场景。再试一次；如果一直不行，检查一下硬件加速有没有开。",
          )}
        </p>
        <Button variant="soft" size="sm" onClick={onRetry}>
          {pick(lang, "Try again", "重试")}
        </Button>
        <p className="text-[0.58rem] tabular-nums text-muted-foreground/55">
          {"build v4"}
          {detail ? ` · ${detail}` : ""}
        </p>
      </div>
    </div>
  );
}

export function WorldMap({
  onHome,
  user,
  onSignOut,
}: {
  onHome: () => void;
  user: Session;
  onSignOut: () => void;
}) {
  const [lang] = useLang();
  const ui = t(lang);
  const [supported, setSupported] = useState<boolean | null>(null);
  const [reducedMotion, setReducedMotion] = useState(false);
  const [phase, setPhase] = useState<Phase>("loading");
  const [attempt, setAttempt] = useState(0);
  const [visited, setVisited] = useState<string[]>([]);
  // ?gallery=1 opens the gallery straight away — the wall is the one page worth
  // linking to directly, and it saves clicking through the map to check it.
  const [openId, setOpenId] = useState<string | null>(() =>
    typeof window !== "undefined" && new URLSearchParams(window.location.search).has("gallery")
      ? "gallery"
      : null,
  );
  const [waited, setWaited] = useState(0);

  /** Each visitor carries their own exploration track, keyed by English name. */
  const storeKey = useMemo(() => visitedKey(user), [user]);

  const markReady = useCallback(() => setPhase("ready"), []);
  const openRegion = useCallback((id: string) => setOpenId(id), []);
  const closePanel = useCallback(() => setOpenId(null), []);
  const retry = useCallback(() => {
    webglSupport = null; // re-probe: a failed probe is often just a spent context budget
    setPhase("loading");
    setAttempt((a) => a + 1);
  }, []);

  useEffect(() => {
    setSupported(hasWebGL());
  }, [attempt]);

  // Shader compilation on integrated graphics can take a while, so give it a
  // generous window before saying anything: swap the full-screen veil for a
  // small strip, and let the scene drop in by itself if it still arrives.
  useEffect(() => {
    const id = window.setTimeout(() => {
      setPhase((p) => (p === "loading" ? "slow" : p));
    }, 12000);
    return () => window.clearTimeout(id);
  }, [attempt]);

  // A ticking counter so a slow first load reads as "working", not "frozen".
  useEffect(() => {
    if (phase !== "loading") return;
    setWaited(0);
    const id = window.setInterval(() => setWaited((s) => Math.round((s + 0.5) * 10) / 10), 500);
    return () => window.clearInterval(id);
  }, [phase, attempt]);

  useEffect(() => {
    setVisited(readVisited(storeKey));
  }, [storeKey]);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReducedMotion(mq.matches);
    const on = (e: MediaQueryListEvent) => setReducedMotion(e.matches);
    mq.addEventListener("change", on);
    return () => mq.removeEventListener("change", on);
  }, []);

  useEffect(() => {
    if (!openId) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpenId(null);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [openId]);

  const finishRegion = useCallback(
    (id: string) => {
      setVisited((prev) => {
        if (prev.includes(id)) return prev;
        const next = [...prev, id];
        try {
          localStorage.setItem(storeKey, JSON.stringify(next));
        } catch {
          /* storage may be unavailable; the visit still counts for this session */
        }
        return next;
      });
      setOpenId(null);
    },
    [storeKey],
  );

  const resetProgress = useCallback(() => {
    try {
      localStorage.removeItem(storeKey);
    } catch {
      /* ignore */
    }
    setVisited([]);
  }, [storeKey]);

  const seen = visited.length;
  const total = REGIONS.length;
  const active = openId ? regionById(openId) : undefined;
  const activeSeen = openId ? visited.includes(openId) : false;

  return (
    <div
      className="world-backdrop fixed inset-0 overflow-hidden"
      data-phase={phase}
      data-supported={String(supported)}
      data-attempt={attempt}
    >
      <div
        className={`absolute inset-0 transition-opacity duration-1000 ${phase === "ready" ? "opacity-100" : "opacity-0"}`}
        data-scene-ready={phase === "ready" ? "" : undefined}
      >
        <SceneBoundary key={attempt} fallback={<SceneStuck lang={lang} onRetry={retry} />}>
          <Suspense fallback={null}>
            <WorldScene
              key={attempt}
              reducedMotion={reducedMotion}
              visited={visited}
              onOpenRegion={openRegion}
              onReady={markReady}
            />
          </Suspense>
        </SceneBoundary>
      </div>

      {phase === "loading" && (
        <div className="absolute inset-0 grid place-items-center" role="status" aria-live="polite">
          <div className="flex flex-col items-center gap-3">
            <span className="loader-orb" aria-hidden />
            <p className="text-xs tracking-[0.25em] uppercase text-muted-foreground">
              {ui.gathering}
              {waited >= 2 && (
                <span className="ml-2 normal-case tracking-normal opacity-60 tabular-nums">{waited.toFixed(1)}s</span>
              )}
            </p>
          </div>
        </div>
      )}

      {phase === "slow" && (
        <div className="pointer-events-none absolute inset-x-0 bottom-5 z-20 flex justify-center px-4">
          <div className="pointer-events-auto flex flex-wrap items-center justify-center gap-x-3 gap-y-1 rounded-full border border-border/60 bg-background/85 px-4 py-2 text-xs text-muted-foreground backdrop-blur">
            <span>{pick(lang, "The 3D scene is taking its time.", "3D 场景还在准备中。")}</span>
            <button type="button" onClick={retry} className="underline underline-offset-2 transition hover:text-foreground">
              {ui.retry}
            </button>
            <button type="button" onClick={onHome} className="underline underline-offset-2 transition hover:text-foreground">
              {ui.home}
            </button>
          </div>
        </div>
      )}

      <header className="pointer-events-none absolute inset-x-0 top-0 z-20 flex items-center justify-between gap-3 p-4 sm:p-6">
        <Button variant="glass" size="sm" className="pointer-events-auto" onClick={onHome}>
          <span aria-hidden>←</span> {ui.home}
        </Button>
        <span className="pointer-events-none absolute left-1/2 hidden -translate-x-1/2 whitespace-nowrap font-display text-3xl text-foreground/80 sm:block sm:text-4xl">
          Jenia&apos;s World
        </span>
        <div className="pointer-events-auto flex items-center gap-2">
          <span className="hidden max-w-[8rem] truncate text-xs text-muted-foreground sm:inline">
            {lang === "zh" ? user.zh : user.en}
          </span>
          <LangSwitch />
          <Button variant="glass" size="sm" onClick={onSignOut}>
            {pick(lang, "Sign out", "退出")}
          </Button>
        </div>
      </header>

      {phase === "ready" && !openId && (
        <p className="pointer-events-none absolute inset-x-0 bottom-5 z-20 text-center text-xs text-muted-foreground">
          {seen < total ? (
            <>{ui.discovered(seen, total)}</>
          ) : (
            <>{ui.allAwake}</>
          )}
          {seen > 0 && (
            <>
              {" · "}
              <button
                type="button"
                onClick={resetProgress}
                className="pointer-events-auto underline underline-offset-2 transition-colors hover:text-foreground"
              >
                {ui.startOver}
              </button>
            </>
          )}
        </p>
      )}

      {active && (
        <WorldPage
          region={active}
          seen={activeSeen}
          onClose={closePanel}
          onDone={() => finishRegion(active.id)}
          onHome={onHome}
        />
      )}
    </div>
  );
}
