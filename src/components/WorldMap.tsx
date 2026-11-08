import {
  Component,
  lazy,
  Suspense,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type FormEvent,
  type ReactNode,
} from "react";
import { Button } from "@/components/ui/button";
import { REGIONS, isUnlocked, regionById } from "@/lib/world/regions";
import { pick, t, useLang, type Lang } from "@/lib/i18n";
import { bottleKey, setNickname, visitedKey, type Session } from "@/lib/user";
import { readBottle, writeBottle, type BottleStage } from "@/lib/world/bottle";
import { recordExplored, recordSection } from "@/lib/achievements/store";
import { AchievementWall } from "./achievements/AchievementWall";
import { LangSwitch } from "./LangSwitch";
import { WorldPage } from "./WorldPage";
import { LetterModal } from "./world/LetterModal";
import { BridgeToFun } from "./message/BridgeToFun";
import { GuideDialogue } from "./world/GuideDialogue";

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

class SceneBoundary extends Component<
  { children: ReactNode; fallback: ReactNode },
  { failed: boolean }
> {
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
  const detail =
    typeof document !== "undefined" ? document.documentElement.dataset["sceneError"] : undefined;
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

/**
 * Renaming is a session swap, not a data move: the new nickname gets its own
 * progress keys, the old ones are left untouched.
 */
function NicknamePanel({
  user,
  lang,
  onClose,
  onSaved,
}: {
  user: Session;
  lang: Lang;
  onClose: () => void;
  onSaved: (session: Session) => void;
}) {
  const [zh, setZh] = useState(user.zh);
  const [en, setEn] = useState(user.en);
  const [invalid, setInvalid] = useState(false);

  const save = (e: FormEvent) => {
    e.preventDefault();
    const next = setNickname(en, zh);
    if (!next) {
      setInvalid(true);
      return;
    }
    onSaved(next);
    onClose();
  };

  const field =
    "mt-2 h-10 w-full rounded-xl border border-border/70 bg-background/80 px-3 text-sm text-foreground outline-none transition focus:border-foreground/30";
  const label =
    "mt-4 block text-[0.68rem] font-semibold tracking-[0.16em] uppercase text-muted-foreground";

  return (
    <div
      className="absolute inset-0 z-30 grid place-items-center bg-foreground/10 px-5 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="nickname-title"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <form
        onSubmit={save}
        className="w-full max-w-xs rounded-2xl border border-border/70 bg-background px-6 py-6 shadow-[0_2px_40px_rgba(64,92,120,0.16)]"
      >
        <h2 id="nickname-title" className="font-display text-xl text-foreground">
          {pick(lang, "Set your nickname", "设置昵称")}
        </h2>
        <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
          {pick(
            lang,
            "Progress is saved on this device, per nickname. A new nickname starts a fresh track — everything you already explored stays under the old one.",
            "进度按昵称保存在这台设备上。换一个昵称会从新的进度开始，之前探索过的仍留在旧昵称下。",
          )}
        </p>

        <label className={label} htmlFor="nickname-zh">
          {pick(lang, "Chinese nickname", "中文昵称")}
        </label>
        <input
          id="nickname-zh"
          value={zh}
          autoFocus
          onChange={(e) => {
            setZh(e.target.value);
            setInvalid(false);
          }}
          className={field}
        />

        <label className={label} htmlFor="nickname-en">
          {pick(lang, "English nickname", "英文昵称")}
        </label>
        <input
          id="nickname-en"
          value={en}
          onChange={(e) => {
            setEn(e.target.value);
            setInvalid(false);
          }}
          className={field}
        />

        {invalid && (
          <p className="mt-3 text-[0.72rem] leading-relaxed text-destructive" role="alert">
            {pick(lang, "Both names are needed.", "两个昵称都要填。")}
          </p>
        )}

        <div className="mt-6 flex justify-end gap-2">
          <Button type="button" variant="ghost" size="sm" onClick={onClose}>
            {pick(lang, "Cancel", "取消")}
          </Button>
          <Button type="submit" size="sm">
            {pick(lang, "Save", "保存")}
          </Button>
        </div>
      </form>
    </div>
  );
}

export function WorldMap({
  onHome,
  user,
  onSignOut,
  onNicknameChange,
  active = true,
  onFinishJourney,
}: {
  onHome: () => void;
  user: Session;
  onSignOut: () => void;
  onNicknameChange: (session: Session) => void;
  /** False while the welcome screen covers the map; the scene then stops drawing. */
  active?: boolean;
  /** Game 03 ended: raise the cover-page curtain at the app root. */
  onFinishJourney?: (() => void) | undefined;
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
  const [openId, setOpenId] = useState<string | null>(() => {
    if (typeof window === "undefined") return null;
    const q = new URLSearchParams(window.location.search);
    if (q.has("gallery")) return "gallery";
    // Debug-only: `?lastlight=1` opens Game 03 straight away for review.
    if (q.has("lastlight")) return "fun";
    return null;
  });
  const [waited, setWaited] = useState(0);
  const [wallOpen, setWallOpen] = useState<boolean>(
    () =>
      typeof window !== "undefined" && new URLSearchParams(window.location.search).has("badges"),
  );
  const [nicknameOpen, setNicknameOpen] = useState(false);
  // Once the first three islands are finished, the Message Island grows a tide
  // pool and a collie drops a bottle into it. The stage survives reloads.
  const [bottle, setBottle] = useState<BottleStage>(() => readBottle(bottleKey(user)));
  const [letterOpen, setLetterOpen] = useState(false);
  const [overviewTick, setOverviewTick] = useState(0);
  // The Message Island hands over to the Fun Zone through a short fog crossing
  // rather than a hard cut between two different 3D canvases.
  const [funArrival, setFunArrival] = useState(false);
  /**
   * Princess leads the visitor to this island after a chapter closes. Only the
   * first two hand-offs are guided (My World → Gallery → Collections); after
   * Collections the bottle and the letter take over, exactly as asked.
   */
  const [guideTo, setGuideTo] = useState<"gallery" | "collections" | null>(null);
  const clearGuide = useCallback(() => setGuideTo(null), []);

  /** Each visitor carries their own exploration track, keyed by English name. */
  const storeKey = useMemo(() => visitedKey(user), [user]);
  const bottleStoreKey = useMemo(() => bottleKey(user), [user]);

  // The opening belongs to the visitor's own progress, not to a global
  // once-ever flag: a fresh (or reset) account must always start with Princess
  // and bare islands, even if somebody else signed in on this browser before.
  // `?onboard=force` replays it for review.
  const [onboarding, setOnboarding] = useState(() => {
    if (typeof window !== "undefined" && new URLSearchParams(window.location.search).get("onboard") === "force") return true;
    return readVisited(storeKey).length === 0;
  });

  const markReady = useCallback(() => setPhase("ready"), []);
  // The last line of the guide opens My World directly. Closing the guide used
  // to fly the camera back to the overview and grow the home island in full
  // view, which read as a jarring jump; the page now covers that beat entirely.
  const finishOnboarding = useCallback(() => {
    // No global "seen it once" flag: the guide returns whenever this visitor's
    // progress is empty, and stays away once an island has been finished.
    // My World opens fresh, not "already seen": its own completion button is
    // what marks the chapter done and lets Princess lead on to the Gallery.
    setOnboarding(false);
    setOpenId("about");
  }, []);
  // The Message Island has no chapter page. Its 3D label zooms into the island
  // so the bottle can be tapped again; the no-WebGL fallback list opens the
  // letter itself. Neither route should land on the old reading page.
  const openRegion = useCallback((id: string) => {
    if (id === "community") {
      setLetterOpen(true);
      return;
    }
    setOpenId(id);
  }, []);
  const closePanel = useCallback(() => setOpenId(null), []);
  const retry = useCallback(() => {
    webglSupport = null; // re-probe: a failed probe is often just a spent context budget
    setPhase("loading");
    setAttempt((a) => a + 1);
  }, []);

  // Switching windows or tabs can make the browser drop the WebGL context; the
  // canvas then stays blank forever. Rebuild the scene instead of leaving the
  // visitor with an empty map.
  const lostTimer = useRef(0);
  const handleSceneLost = useCallback(() => {
    window.clearTimeout(lostTimer.current);
    lostTimer.current = window.setTimeout(retry, 600);
  }, [retry]);
  useEffect(() => () => window.clearTimeout(lostTimer.current), []);

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
    setBottle(readBottle(bottleStoreKey));
  }, [bottleStoreKey]);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReducedMotion(mq.matches);
    const on = (e: MediaQueryListEvent) => setReducedMotion(e.matches);
    mq.addEventListener("change", on);
    return () => mq.removeEventListener("change", on);
  }, []);

  useEffect(() => {
    if (!openId) return;
    recordExplored(user, openId);
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpenId(null);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [openId, user]);

  const finishRegion = useCallback(
    (id: string, close = true) => {
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
      // Achievements count a finished task, not an opened page. The album marks
      // itself through its own completion check, so only the reading areas are
      // recorded here.
      if (id !== "collections") recordSection(user, id);
      if (close) {
        setOpenId(null);
        // Only My World and the Gallery get a guided hand-off, and only once:
        // a page that has already been seen closes with onClose, never onDone.
        const next = id === "about" ? "gallery" : id === "gallery" ? "collections" : null;
        if (next && !onboarding && !visited.includes(next) && isUnlocked(next, [...visited, id])) {
          setGuideTo(next);
        }
      }
    },
    [storeKey, user, onboarding, visited],
  );

  const resetProgress = useCallback(() => {
    try {
      localStorage.removeItem(storeKey);
      localStorage.removeItem(bottleStoreKey);
    } catch {
      /* ignore */
    }
    setVisited([]);
    setBottle("pending");
    setLetterOpen(false);
    setGuideTo(null);
    // Starting over means the opening as well: bare islands and Princess.
    setOnboarding(true);
  }, [storeKey, bottleStoreKey]);

  // The bottle is owed once the three islands before the Message Island are
  // finished and the map is actually on screen — never behind a page or the
  // welcome overlay.
  const bottleDue =
    bottle === "pending" &&
    phase === "ready" &&
    active &&
    !openId &&
    !wallOpen &&
    visited.includes("about") &&
    visited.includes("gallery") &&
    visited.includes("collections");

  const markDelivered = useCallback(() => {
    setBottle((prev) => {
      if (prev !== "pending") return prev;
      writeBottle(bottleStoreKey, "floating");
      return "floating";
    });
  }, [bottleStoreKey]);

  const openLetter = useCallback(() => {
    setLetterOpen(true);
    // Warm the Fun Zone chunk while the letter is being read, so the fog
    // always parts onto an already-mounted 3D park instead of a loading gap.
    void import("@/components/fun/FunZonePage").catch(() => {});
    setBottle((prev) => {
      if (prev !== "read") writeBottle(bottleStoreKey, "read");
      return "read";
    });
  }, [bottleStoreKey]);

  // The letter ends with "跟上它". Mount the 3D park immediately and lay a
  // short veil of fog on top of it, so the fog parts onto the park itself —
  // no separate crossing page, no drawn wooden bridge.
  const followToFun = useCallback(() => {
    finishRegion("community", false);
    // Close the letter so it never sits on top of the veil or the 3D park.
    setLetterOpen(false);
    // The veil holds at full cover until the lazy park is on screen, then
    // parts. Mount the park as soon as its chunk is ready; on failure
    // WorldPage's own lazy import will request it again and show its fallback.
    if (!reducedMotion) setFunArrival(true);
    // Land on the Fun Zone immediately and let the lazy park mount behind the
    // veil — the fog parts onto the park itself, never back onto the map.
    setOpenId("fun");
    void import("@/components/fun/FunZonePage").catch(() => {});
  }, [finishRegion, reducedMotion]);

  const arrivalDone = useCallback(() => setFunArrival(false), []);

  // Game 03 ends the whole journey. Close the Fun Zone panel in the same beat
  // the curtain is raised, so re-entering the world lands on a clean map
  // instead of jumping straight back into the game.
  const finishJourney = useCallback(() => {
    setOpenId(null);
    setLetterOpen(false);
    onFinishJourney?.();
  }, [onFinishJourney]);

  const closeLetter = useCallback(() => {
    // Reading the letter completes the Message Island whichever button is
    // picked. "Keep exploring" used to only close the modal, leaving `fun`
    // locked forever: isUnlocked("fun") needs "community" in the visit list,
    // and that was only recorded by "Follow her". Marking it here also lets
    // visitors enter the Fun Zone straight from the big map later on.
    finishRegion("community", false);
    setLetterOpen(false);
    setOverviewTick((n) => n + 1);
  }, [finishRegion]);

  const seen = visited.length;
  const total = REGIONS.length;
  const opened = openId ? regionById(openId) : undefined;
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
              onboarding={onboarding}
              onOpenRegion={openRegion}
              onReady={markReady}
              paused={!active || Boolean(openId) || wallOpen || letterOpen}
              onContextLost={handleSceneLost}
              bottleDue={bottleDue}
              bottleFloating={bottle !== "pending"}
              bottleUnread={bottle !== "read"}
              bottleRead={bottle === "read"}
              onBottleDelivered={markDelivered}
              onOpenLetter={openLetter}
              overviewTick={overviewTick}
              guideTo={guideTo}
              onGuideDone={clearGuide}
            />
          </Suspense>
        </SceneBoundary>
      </div>

      <GuideDialogue
        active={onboarding}
        lang={lang}
        reducedMotion={reducedMotion}
        onFinish={finishOnboarding}
      />

      {phase === "loading" && (
        <div className="absolute inset-0 grid place-items-center" role="status" aria-live="polite">
          <div className="flex flex-col items-center gap-3">
            <span className="loader-orb" aria-hidden />
            <p className="text-xs tracking-[0.25em] uppercase text-muted-foreground">
              {ui.gathering}
              {waited >= 2 && (
                <span className="ml-2 normal-case tracking-normal opacity-60 tabular-nums">
                  {waited.toFixed(1)}s
                </span>
              )}
            </p>
          </div>
        </div>
      )}

      {phase === "slow" && (
        <div className="pointer-events-none absolute inset-x-0 bottom-5 z-20 flex justify-center px-4">
          <div className="pointer-events-auto flex flex-wrap items-center justify-center gap-x-3 gap-y-1 rounded-full border border-border/60 bg-background/85 px-4 py-2 text-xs text-muted-foreground backdrop-blur">
            <span>{pick(lang, "The 3D scene is taking its time.", "3D 场景还在准备中。")}</span>
            <button
              type="button"
              onClick={retry}
              className="underline underline-offset-2 transition hover:text-foreground"
            >
              {ui.retry}
            </button>
            <button
              type="button"
              onClick={onHome}
              className="underline underline-offset-2 transition hover:text-foreground"
            >
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
          <button
            type="button"
            onClick={() => setNicknameOpen(true)}
            title={pick(lang, "Set nickname", "设置昵称")}
            aria-label={pick(lang, "Set nickname", "设置昵称")}
            className="max-w-[6.5rem] truncate rounded-full border border-border/60 bg-background/70 px-3 py-1.5 text-xs text-muted-foreground transition hover:border-foreground/30 hover:text-foreground"
          >
            {lang === "zh" ? user.zh : user.en}
          </button>
          <Button
            variant="glass"
            size="sm"
            onClick={() => setWallOpen(true)}
            aria-label={pick(lang, "Achievement Wall", "徽章墙")}
            title={pick(lang, "Achievement Wall", "徽章墙")}
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              aria-hidden
            >
              <path d="M8 4h8v5a4 4 0 0 1-8 0V4Z" />
              <path d="M8 5H5v2a3 3 0 0 0 3 3M16 5h3v2a3 3 0 0 1-3 3" />
              <path d="M12 13v4M8.5 20h7l-1-3h-5l-1 3Z" />
            </svg>
            <span className="hidden sm:inline">{pick(lang, "Achievements", "徽章墙")}</span>
          </Button>
          <LangSwitch />
          <Button variant="glass" size="sm" onClick={onSignOut}>
            {pick(lang, "Sign out", "退出")}
          </Button>
        </div>
      </header>

      {phase === "ready" && !openId && (
        <p className="pointer-events-none absolute inset-x-0 bottom-5 z-20 text-center text-xs text-muted-foreground">
          {seen < total ? <>{ui.discovered(seen, total)}</> : <>{ui.allAwake}</>}
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

      {opened && (
        <WorldPage
          region={opened}
          user={user}
          seen={activeSeen}
          onClose={closePanel}
          onDone={() => finishRegion(opened.id)}
          onComplete={() => finishRegion(opened.id, false)}
          onHome={onHome}
          onOpenWall={() => setWallOpen(true)}
          onOpenLetter={openLetter}
          onFollow={followToFun}
          onFinishJourney={finishJourney}
        />
      )}

      {funArrival && <BridgeToFun reducedMotion={reducedMotion} onDone={arrivalDone} />}

      {wallOpen && <AchievementWall user={user} onClose={() => setWallOpen(false)} />}

      {letterOpen && <LetterModal onClose={closeLetter} onFollow={followToFun} />}

      {nicknameOpen && (
        <NicknamePanel
          user={user}
          lang={lang}
          onClose={() => setNicknameOpen(false)}
          onSaved={onNicknameChange}
        />
      )}
    </div>
  );
}
