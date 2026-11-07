/**
 * Fun Zone shell: the 3D park, the three-game progression, and the host for
 * Game 01. Game 02 / 03 slots are already registered and visible (locked), so
 * later sessions only add their own game folder — nothing here needs rewriting.
 *
 * Only one canvas is ever mounted. The park and the campsite share it, which
 * avoids the WebGL-context leaks this project has been bitten by before.
 */

import { Component, useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { LangSwitch } from "@/components/LangSwitch";
import { pick, useLang } from "@/lib/i18n";
import type { Session } from "@/lib/user";
import {
  GAMES,
  UNLOCK_LINE,
  gameById,
  isGameUnlocked,
  readFunState,
  writeFunState,
  type FunState,
  type GameId,
} from "@/lib/fun/funZone";
import { playSound, setSoundEnabled, stopAmbience } from "@/lib/fun/sound";
import { FunZoneCanvas, type FunZoneMode } from "./FunZoneCanvas";
import { useExplorerGame, WorldExplorerGame } from "./games/world-explorer/WorldExplorerGame";
import { useTinyMazeGame, TinyMazeGame } from "./games/tiny-maze/TinyMazeGame";
import type { ExplorerStage } from "./scene/ExplorerScene";
import "./fun.css";

type Props = {
  user: Session;
  onClose: () => void;
  onOpenWall?: (() => void) | undefined;
  seen: boolean;
  onDone: () => void;
};

class SceneBoundary extends Component<{ children: ReactNode; fallback: ReactNode }, { failed: boolean }> {
  override state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  override componentDidCatch(error: unknown) {
    console.error("[fun-zone]", error);
  }
  override render() {
    return this.state.failed ? this.props.fallback : this.props.children;
  }
}

let webglSupport: boolean | null = null;
function hasWebGL() {
  if (webglSupport !== null) return webglSupport;
  try {
    const c = document.createElement("canvas");
    const gl = c.getContext("webgl2") || c.getContext("webgl");
    webglSupport = !!gl;
    (gl as WebGLRenderingContext | null)?.getExtension("WEBGL_lose_context")?.loseContext();
  } catch {
    webglSupport = false;
  }
  return webglSupport;
}

export function FunZonePage({ user, onClose, onOpenWall, seen, onDone }: Props) {
  const [lang] = useLang();
  const [state, setState] = useState<FunState>(() => readFunState(user));
  const [mode, setMode] = useState<FunZoneMode>("park");
  const [lockedHint, setLockedHint] = useState<GameId | null>(null);
  const [justUnlocked, setJustUnlocked] = useState<GameId | null>(null);
  const [pendingUnlock, setPendingUnlock] = useState<GameId | null>(null);
  const [unlockToast, setUnlockToast] = useState(false);
  const [supported, setSupported] = useState(() => (typeof document === "undefined" ? true : hasWebGL()));
  const [reducedMotion, setReducedMotion] = useState(false);
  const [sceneKey, setSceneKey] = useState(0);
  const unlockTimer = useRef(0);

  useEffect(() => {
    setSupported(hasWebGL());
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReducedMotion(mq.matches);
    const on = (e: MediaQueryListEvent) => setReducedMotion(e.matches);
    mq.addEventListener("change", on);
    setSoundEnabled(readFunState(user).sound);
    return () => {
      mq.removeEventListener("change", on);
      window.clearTimeout(unlockTimer.current);
      stopAmbience();
    };
  }, [user]);

  const commit = useCallback(
    (next: FunState) => {
      writeFunState(next, user);
      setState(next);
    },
    [user],
  );

  useEffect(() => {
    setSoundEnabled(state.sound);
  }, [state.sound]);

  const unlocked = useMemo(
    () =>
      Object.fromEntries(GAMES.map((g) => [g.id, isGameUnlocked(g.id, state)])) as Record<GameId, boolean>,
    [state],
  );

  const onUnlocked = useCallback((id: GameId) => {
    // Hold the animation until the visitor is back in the park, otherwise it
    // would play behind the game's result screen where nobody can see it.
    setPendingUnlock(id);
  }, []);

  const game = useExplorerGame({ state, commit, onUnlocked, reducedMotion });
  const stage: ExplorerStage | null = mode === "game" ? game.view.stage : null;

  const enterPark = useCallback(() => {
    setMode("park");
    if (pendingUnlock) {
      setJustUnlocked(pendingUnlock);
      setPendingUnlock(null);
      setUnlockToast(true);
      playSound("unlock");
      window.clearTimeout(unlockTimer.current);
      unlockTimer.current = window.setTimeout(() => {
        setJustUnlocked(null);
        setUnlockToast(false);
      }, 3600);
    }
  }, [pendingUnlock]);

  const select = useCallback(
    (id: GameId) => {
      const def = gameById(id);
      if (!isGameUnlocked(id, state)) {
        setLockedHint(id);
        playSound("wrong");
        window.setTimeout(() => setLockedHint(null), 4200);
        return;
      }
      if (!def.available) {
        setLockedHint(id);
        window.setTimeout(() => setLockedHint(null), 4200);
        return;
      }
      setLockedHint(null);
      playSound("tap");
      setMode(id === "tiny-maze" ? "maze" : "game");
    },
    [state],
  );

  const maze = useTinyMazeGame({
    state,
    commit,
    onUnlocked,
    lang,
    reducedMotion,
    onExit: enterPark,
    active: mode === "maze",
  });

  const toggleSound = () => {
    const next = !state.sound;
    commit({ ...state, sound: next });
    setSoundEnabled(next);
    if (next) playSound("tap");
  };

  const V = (en: string, zh: string) => pick(lang, en, zh);
  const lockedDef = lockedHint ? gameById(lockedHint) : null;
  const lockedIsOpen = lockedHint ? isGameUnlocked(lockedHint, state) : false;

  return (
    <div className="fz-root" data-mode={mode} data-stage={stage ?? ""}>
      {supported ? (
        <SceneBoundary
          key={sceneKey}
          fallback={
            <div className="fz-canvas" style={{ display: "grid", placeItems: "center", padding: 24 }}>
              <div className="fz-glass" style={{ padding: 22, maxWidth: 380, textAlign: "center" }}>
                <p className="fz-note">
                  {V(
                    "The 3D park could not start on this device. The questions still work — you can keep exploring.",
                    "这台设备没能启动 3D 乐园，但题目依然可以玩，探索不会中断。",
                  )}
                </p>
                <button type="button" className="fz-btn fz-btn--ghost" style={{ marginTop: 14 }} onClick={() => setSceneKey((n) => n + 1)}>
                  {V("Try again", "重试")}
                </button>
              </div>
            </div>
          }
        >
          <div className="fz-canvas">
            <FunZoneCanvas
              mode={mode}
              stage={stage}
              reducedMotion={reducedMotion}
              active
              unlocked={unlocked}
              justUnlocked={justUnlocked}
              onSelect={select}
              explorer={mode === "game" ? game.view.scene : null}
              maze={mode === "maze" ? maze.view.scene : null}
              mazeKey={maze.view.scene.runKey}
            />
          </div>
        </SceneBoundary>
      ) : (
        <div
          className="fz-canvas"
          style={{ background: "linear-gradient(170deg,#e4eff4,#f5f1e5 60%,#dce9dc)" }}
        />
      )}
      <div className="fz-vignette" />

      <header className="fz-header">
        <button type="button" className="fz-chip" onClick={mode !== "park" ? enterPark : onClose}>
          <span aria-hidden>←</span> {mode !== "park" ? V("Fun Zone", "乐园") : V("Map", "地图")}
        </button>
        <div className="fz-header-right">
          <LangSwitch />
          <button
            type="button"
            className="fz-chip"
            aria-pressed={state.sound}
            aria-label={V("Sound", "声音")}
            onClick={toggleSound}
          >
            {state.sound ? "♪" : "○"} <span className="fz-sound-label">{V("Sound", "声音")}</span>
          </button>
          {onOpenWall && (
            <button type="button" className="fz-chip" onClick={onOpenWall}>
              {V("Badges", "徽章墙")}
            </button>
          )}
        </div>
      </header>

      {mode === "park" && (
        <>
          <div className="fz-park-title">
            <p className="fz-eyebrow">{V("PLAY A LITTLE", "玩一会儿")}</p>
            <h1 className="fz-display fz-title">Fun Zone</h1>
            <p className="fz-sub">{V("Three little games, one small world", "三个小游戏，一座小小的世界")}</p>
          </div>

          {unlockToast && (
            <div className="fz-unlock-toast" role="status">
              {V(UNLOCK_LINE.en, UNLOCK_LINE.zh)}
            </div>
          )}

          <div className="fz-park-card fz-glass">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 8 }}>
              <span className="fz-eyebrow">{V("GAME AREAS", "游戏区")}</span>
              <span className="fz-note" style={{ fontSize: "0.7rem" }}>
                {V(
                  `${Object.values(unlocked).filter(Boolean).length} / 3 unlocked`,
                  `已解锁 ${Object.values(unlocked).filter(Boolean).length} / 3`,
                )}
              </span>
            </div>
            <div className="fz-park-list">
              {GAMES.map((g) => {
                const open = unlocked[g.id];
                return (
                  <button
                    key={g.id}
                    type="button"
                    className={`fz-park-item ${open ? "" : "locked"}`}
                    onClick={() => select(g.id)}
                  >
                    <b>
                      {g.num} · {V(g.name.en, g.name.zh)}
                    </b>
                    <small>
                      {!open ? V("Locked · 🔒", "未解锁 · 🔒") : g.available ? V(g.tagline.en, g.tagline.zh) : V("Coming soon — this game is still being built.", "即将开放 —— 这个游戏还在制作中。")}
                    </small>
                  </button>
                );
              })}
            </div>

            {lockedDef && (
              <div className={`fz-locked-note ${lockedHint ? "fz-shake" : ""}`} role="status">
                {lockedIsOpen && !lockedDef.available
                  ? V(
                      `${lockedDef.name.en} is unlocked, but its game is still being made. It will arrive in a later update.`,
                      `${lockedDef.name.zh} 已经解锁，不过游戏还在制作中，会在之后的更新里加进来。`,
                    )
                  : V(lockedDef.lockedHint.en, lockedDef.lockedHint.zh)}
              </div>
            )}
            {!lockedHint && !seen && (
              <div style={{ marginTop: 12, textAlign: "center" }}>
                <button type="button" className="fz-textbtn" onClick={onDone}>
                  {V("Mark this island as seen →", "看完了 →")}
                </button>
              </div>
            )}
          </div>
        </>
      )}

      {mode === "game" && (
        <WorldExplorerGame game={game} lang={lang} onExit={enterPark} />
      )}

      {mode === "maze" && (
        <TinyMazeGame view={maze.view} actions={maze.actions} lang={lang} />
      )}

      {!supported && (
        <p className="fz-note" style={{ position: "absolute", bottom: 12, left: 0, right: 0, textAlign: "center", zIndex: 12 }}>
          {V("3D is unavailable here — a calm flat backdrop is showing instead.", "这里无法显示 3D，已换成安静的平面背景。")}
        </p>
      )}
    </div>
  );
}
