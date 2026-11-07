/**
 * Tiny Maze — game state machine + DOM overlay (P1: Chapter 01).
 *
 * Mirrors World Explorer's `useExplorerGame` shape: the hook owns state and
 * exposes `view.scene` for the shared canvas, while this file's component
 * renders only the DOM layer (intro / HUD / map / pause / result).
 */

import { useCallback, useEffect, useMemo, useRef, useState, type PointerEvent as ReactPointerEvent } from "react";
import * as THREE from "three";
import { pick, type Lang } from "@/lib/i18n";
import { playSound } from "@/lib/fun/sound";
import { markCompleted, type FunState, type GameId, type RewardId } from "@/lib/fun/funZone";
import {
  DIRECTIONS,
  LEVELS,
  bi,
  parseGrid,
  worldToCell,
  type LevelDef,
  type MazePlan,
} from "./levels";
import type { MazeEvent, MazeRuntime, MazeSceneProps, MazeStats } from "./MazeScene";
import "./tiny-maze.css";

const LEVEL: LevelDef = LEVELS[0]!;
const TICKET: RewardId = "garden-path-ticket";

type Phase = "intro" | "playing" | "paused" | "result";
type Toast = { text: string; good?: boolean } | null;
type RunResult = { stars: number; chest: boolean; newTicket: boolean; firstTime: boolean };

export type MazeView = {
  phase: Phase;
  level: LevelDef;
  plan: MazePlan;
  scene: MazeSceneProps;
  runtime: MazeRuntime;
  stats: MazeStats;
  nearby: string | null;
  mapOpen: boolean;
  hintLevel: number;
  toast: Toast;
  result: RunResult | null;
  starsFound: number;
  completedBefore: boolean;
};

export type MazeActions = {
  begin: () => void;
  replay: () => void;
  act: (id: string | null) => void;
  toggleMap: () => void;
  togglePause: () => void;
  showHint: (n: number) => void;
  dismissToast: () => void;
  exitToPark: () => void;
};

type HookArgs = {
  state: FunState;
  commit: (next: FunState) => void;
  onUnlocked: (id: GameId) => void;
  lang: Lang;
  reducedMotion: boolean;
  onExit: () => void;
  /** The hook stays mounted; only the active mode listens to the keyboard. */
  active: boolean;
};

const emptyStats = (): MazeStats => ({
  stars: [false, false, false],
  chest: false,
  dirs: [...LEVEL.initialDirs],
  solved: false,
});

export function useTinyMazeGame({ state, commit, onUnlocked, lang, reducedMotion, onExit, active }: HookArgs) {
  const plan = useMemo(() => parseGrid(LEVEL), []);
  const player = useRef(new THREE.Vector3(plan.start[0], 0, plan.start[1]));
  const keys = useRef(new Set<string>());
  const joystick = useRef({ x: 0, y: 0 });
  const explored = useRef(new Set<string>());
  const runtime = useMemo<MazeRuntime>(() => ({ player, keys, joystick, explored }), []); // eslint-disable-line react-hooks/exhaustive-deps

  const [phase, setPhase] = useState<Phase>("intro");
  const [stats, setStats] = useState<MazeStats>(emptyStats);
  const [nearby, setNearby] = useState<string | null>(null);
  const nearbyRef = useRef<string | null>(null);
  const [mapOpen, setMapOpen] = useState(false);
  const [hintLevel, setHintLevel] = useState(0);
  const [toast, setToast] = useState<Toast>(null);
  const [result, setResult] = useState<RunResult | null>(null);
  const [runKey, setRunKey] = useState(0);
  const [tick, setTick] = useState(0);

  const statsRef = useRef(stats);
  statsRef.current = stats;
  const stateRef = useRef(state);
  stateRef.current = state;
  const V = useCallback((en: string, zh: string) => pick(lang, en, zh), [lang]);

  const record = state.maze.levels[String(LEVEL.id)] ?? {
    completed: false,
    challenges: 0,
    bestStars: 0,
    chest: false,
    starMask: [false, false, false] as boolean[],
  };

  /* -------------------------------------------------------------- actions */

  const resetRun = useCallback(() => {
    setStats(emptyStats());
    player.current.set(plan.start[0], 0, plan.start[1]);
    explored.current.clear();
    keys.current.clear();
    joystick.current.x = 0;
    joystick.current.y = 0;
    nearbyRef.current = null;
    setNearby(null);
    setToast(null);
    setHintLevel(0);
    setResult(null);
    setMapOpen(false);
    setRunKey((n) => n + 1);
  }, [plan]);

  const begin = useCallback(() => {
    const key = String(LEVEL.id);
    const prev = stateRef.current.maze.levels[key] ?? {
      completed: false,
      challenges: 0,
      bestStars: 0,
      chest: false,
      starMask: [false, false, false] as boolean[],
    };
    commit({
      ...stateRef.current,
      maze: {
        levels: {
          ...stateRef.current.maze.levels,
          [key]: { ...prev, challenges: prev.challenges + 1 },
        },
      },
    });
    setPhase("playing");
    playSound("tap");
  }, [commit]);

  const replay = useCallback(() => {
    resetRun();
    setPhase("intro");
  }, [resetRun]);

  const exitToPark = useCallback(() => {
    resetRun();
    setPhase("intro");
    onExit();
  }, [resetRun, onExit]);

  const complete = useCallback(() => {
    const s = statsRef.current;
    const starCount = s.stars.filter(Boolean).length;
    const key = String(LEVEL.id);
    const prev = stateRef.current.maze.levels[key] ?? {
      completed: false,
      challenges: 0,
      bestStars: 0,
      chest: false,
      starMask: [false, false, false] as boolean[],
    };
    const withMaze: FunState = {
      ...stateRef.current,
      maze: {
        levels: {
          ...stateRef.current.maze.levels,
          [key]: {
            completed: true,
            challenges: prev.challenges,
            bestStars: Math.max(prev.bestStars, starCount),
            chest: prev.chest || s.chest,
            starMask: s.stars.map((v, i) => v || (prev.starMask[i] ?? false)),
          },
        },
      },
    };

    // P1 slice: Chapter 01 is the only chapter, so finishing it completes the
    // game and lights up Game 03. P2 moves this call to the fifth chapter.
    const completion = markCompleted(withMaze, "tiny-maze");
    const newTicket = !completion.state.rewards.includes(TICKET);
    const next: FunState = newTicket
      ? { ...completion.state, rewards: [...completion.state.rewards, TICKET] }
      : completion.state;
    commit(next);
    if (completion.unlockedNext) onUnlocked(completion.unlockedNext);
    playSound("complete");
    setResult({ stars: starCount, chest: s.chest, newTicket, firstTime: completion.firstTime });
    setPhase("result");
    setMapOpen(false);
  }, [commit, onUnlocked]);

  const handleEvent = useCallback(
    (event: MazeEvent) => {
      if (event.type === "star") {
        setStats((s) => ({ ...s, stars: s.stars.map((v, i) => (i === event.index ? true : v)) }));
        playSound("star");
        setToast({ text: V("A little star found its way to you.", "捡到一颗小星星。"), good: true });
      } else if (event.type === "exit") {
        complete();
      }
    },
    [V, complete],
  );

  const handleNearby = useCallback((id: string | null) => {
    nearbyRef.current = id;
    setNearby(id);
  }, []);

  const act = useCallback(
    (id: string | null) => {
      if (!id) return;
      if (id.startsWith("statue-")) {
        const i = Number(id.slice(7));
        const dirs = statsRef.current.dirs.map((d, k) => (k === i ? (d + 1) % 4 : d));
        const solved = dirs.every((d, k) => d === LEVEL.answers[k]);
        const wasSolved = statsRef.current.solved;
        setStats((s) => ({ ...s, dirs, solved: wasSolved || solved }));
        if (solved && !wasSolved) {
          playSound("correct");
          setToast({ text: V("All three flowers are facing the right way — the hidden gate is opening!", "三朵花都转对了 —— 隐藏小门正在打开！"), good: true });
        } else {
          playSound("tap");
          setToast({ text: `${bi(lang, LEVEL.flowers[i] ?? LEVEL.flowers[0]!)} · ${bi(lang, DIRECTIONS[dirs[i] ?? 0] ?? DIRECTIONS[0]!)}` });
        }
      } else if (id === "sign") {
        playSound("hint");
        setHintLevel(1);
        setToast({ text: bi(lang, LEVEL.clue) });
      } else if (id === "chest") {
        setStats((s) => ({ ...s, chest: true }));
        playSound("star");
        setToast({ text: V("You found the hidden chest!", "找到隐藏宝箱啦！"), good: true });
      } else if (id === "exit") {
        complete();
      }
    },
    [V, lang, complete],
  );

  const toggleMap = useCallback(() => setMapOpen((v) => !v), []);
  const togglePause = useCallback(() => {
    setPhase((p) => (p === "playing" ? "paused" : p === "paused" ? "playing" : p));
  }, []);
  const showHint = useCallback((n: number) => {
    setHintLevel((cur) => (cur === n ? 0 : n));
    playSound("hint");
  }, []);
  const dismissToast = useCallback(() => setToast(null), []);

  /* --------------------------------------------------------------- input */

  useEffect(() => {
    if (!active) return;
    const down = (e: KeyboardEvent) => {
      const k = e.key.toLowerCase();
      if (k === "escape") {
        togglePause();
        return;
      }
      if (k === "m" && (phase === "playing" || phase === "paused")) {
        e.preventDefault();
        toggleMap();
        return;
      }
      if (k === " " && phase === "playing" && !mapOpen) {
        e.preventDefault();
        act(nearbyRef.current);
        return;
      }
      if (["arrowup", "arrowdown", "arrowleft", "arrowright", " "].includes(k) && phase === "playing") {
        e.preventDefault();
      }
      if (phase === "playing" && !mapOpen) keys.current.add(k);
    };
    const up = (e: KeyboardEvent) => keys.current.delete(e.key.toLowerCase());
    const blur = () => keys.current.clear();
    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    window.addEventListener("blur", blur);
    return () => {
      window.removeEventListener("keydown", down);
      window.removeEventListener("keyup", up);
      window.removeEventListener("blur", blur);
    };
  }, [active, phase, mapOpen, act, toggleMap, togglePause]);

  useEffect(() => {
    if (phase !== "playing" || mapOpen) {
      keys.current.clear();
      joystick.current.x = 0;
      joystick.current.y = 0;
    }
  }, [phase, mapOpen]);

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(null), toast.good ? 4200 : 2600);
    return () => window.clearTimeout(timer);
  }, [toast]);

  useEffect(() => {
    if (!mapOpen) return;
    const timer = window.setInterval(() => setTick((n) => n + 1), 260);
    return () => window.clearInterval(timer);
  }, [mapOpen]);

  /* ---------------------------------------------------------------- view */

  const scene = useMemo<MazeSceneProps>(
    () => ({
      level: LEVEL,
      plan,
      runtime,
      stats,
      reducedMotion,
      paused: phase !== "playing",
      lang,
      onEvent: handleEvent,
      onNearby: handleNearby,
      runKey,
    }),
    [plan, runtime, stats, reducedMotion, phase, lang, handleEvent, handleNearby, runKey],
  );

  const view: MazeView = {
    phase,
    level: LEVEL,
    plan,
    scene,
    runtime,
    stats,
    nearby,
    mapOpen,
    hintLevel,
    toast,
    result,
    starsFound: stats.stars.filter(Boolean).length,
    completedBefore: record.completed,
  };

  const actions: MazeActions = {
    begin,
    replay,
    act,
    toggleMap,
    togglePause,
    showHint,
    dismissToast,
    exitToPark,
  };

  // `tick` is intentionally read here so the live map re-renders while open.
  void tick;
  return { view, actions };
}

/* ------------------------------------------------------------------- DOM */

export type TinyMazeGameProps = {
  view: MazeView;
  actions: MazeActions;
  lang: Lang;
};

function nearbyLabel(id: string | null, view: MazeView, lang: Lang): string {
  if (!id) return "";
  if (id.startsWith("statue-")) {
    const i = Number(id.slice(7));
    const flower = bi(lang, view.level.flowers[i] ?? view.level.flowers[0]!);
    const dir = bi(lang, DIRECTIONS[view.stats.dirs[i] ?? 0] ?? DIRECTIONS[0]!);
    return pick(lang, `Turn the ${flower} statue · now facing ${dir}`, `转动${flower}雕像 · 现在朝${dir}`);
  }
  if (id === "sign") return pick(lang, "Read the clue sign", "读一读提示牌");
  if (id === "chest") return pick(lang, "Open the hidden chest", "打开隐藏宝箱");
  if (id === "exit") return pick(lang, "Step into the exit", "走进出口");
  return "";
}

function Joystick({ runtime, lang }: { runtime: MazeRuntime; lang: Lang }) {
  const [knob, setKnob] = useState({ x: 0, y: 0 });
  const move = (e: ReactPointerEvent<HTMLDivElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    const x = Math.max(-1, Math.min(1, (e.clientX - (r.left + r.width / 2)) / (r.width / 2)));
    const y = Math.max(-1, Math.min(1, (e.clientY - (r.top + r.height / 2)) / (r.height / 2)));
    runtime.joystick.current.x = x;
    runtime.joystick.current.y = y;
    setKnob({ x, y });
  };
  const release = (e: ReactPointerEvent<HTMLDivElement>) => {
    e.currentTarget.releasePointerCapture?.(e.pointerId);
    runtime.joystick.current.x = 0;
    runtime.joystick.current.y = 0;
    setKnob({ x: 0, y: 0 });
  };
  return (
    <div
      className="tm-joystick"
      onPointerDown={(e) => {
        e.currentTarget.setPointerCapture(e.pointerId);
        move(e);
      }}
      onPointerMove={(e) => {
        if (e.currentTarget.hasPointerCapture(e.pointerId)) move(e);
      }}
      onPointerUp={release}
      onPointerCancel={release}
      role="group"
      aria-label={pick(lang, "Move", "移动")}
    >
      <div className="tm-knob" style={{ transform: `translate(${knob.x * 30}px, ${knob.y * 30}px)` }} />
    </div>
  );
}

function MapOverlay({ view, lang, onClose }: { view: MazeView; lang: Lang; onClose: () => void }) {
  const { plan, runtime, stats } = view;
  const [pr, pc] = worldToCell(runtime.player.current.x, runtime.player.current.z, plan.rows, plan.cols);
  const starCells = useMemo(() => {
    const m = new Map<string, number>();
    plan.stars.forEach((p, i) => {
      const [r, c] = worldToCell(p[0], p[1], plan.rows, plan.cols);
      m.set(`${r},${c}`, i);
    });
    return m;
  }, [plan]);
  return (
    <div className="tm-overlay tm-map-overlay" role="dialog" aria-label={pick(lang, "Map", "地图")}>
      <div className="tm-panel tm-map-panel">
        <div className="tm-panel-head">
          <div>
            <span className="tm-eyebrow">{pick(lang, "EXPLORED SO FAR", "已探索")}</span>
            <h3>{pick(lang, "Garden map", "花园地图")}</h3>
          </div>
          <button type="button" className="tm-iconbtn" onClick={onClose} aria-label={pick(lang, "Close", "关闭")}>
            ×
          </button>
        </div>
        <div className="tm-map-grid" style={{ gridTemplateColumns: `repeat(${plan.cols}, 1fr)` }}>
          {plan.cells.map((ch, i) => {
            const r = Math.floor(i / plan.cols);
            const c = i % plan.cols;
            const seen = runtime.explored.current.has(`${r},${c}`);
            const isPlayer = r === pr && c === pc;
            const isWall = ch === "#" || ch === "D" || ch === "h" || ch === "G";
            const starIndex = starCells.get(`${r},${c}`);
            const marker =
              seen && starIndex !== undefined && !stats.stars[starIndex]
                ? "star"
                : seen && ch === "C" && !stats.chest
                  ? "chest"
                  : seen && ch === "E"
                    ? "exit"
                    : "";
            return (
              <div
                key={i}
                className={`tm-map-cell ${seen ? "seen" : "fog"} ${isWall ? "wall" : "path"} ${isPlayer ? "player" : ""}`}
              >
                {marker === "star" && <span className="tm-map-mark">✦</span>}
                {marker === "chest" && <span className="tm-map-mark">▣</span>}
                {marker === "exit" && <span className="tm-map-mark">◎</span>}
              </div>
            );
          })}
        </div>
        <p className="tm-note">
          {pick(
            lang,
            "Only the paths Princess has walked are shown. The map will not tell you the answer.",
            "地图只显示公主走过的路，不会告诉你谜题的答案。",
          )}
        </p>
      </div>
    </div>
  );
}

function IntroCard({ view, actions, lang }: { view: MazeView; actions: MazeActions; lang: Lang }) {
  const L = view.level;
  return (
    <div className="tm-overlay tm-intro-overlay">
      <div className="tm-intro-card tm-panel">
        <span className="tm-eyebrow">{pick(lang, "CHAPTER", "第")} {L.num} · TINY MAZE</span>
        <h1>{bi(lang, L.name)}</h1>
        <p className="tm-intro-sub">{bi(lang, L.subtitle)}</p>
        <p className="tm-preview-note">
          {pick(lang, "The 3D garden behind this card is the world you are about to walk into.", "卡片后面那座 3D 花园，就是你等下要走进去的世界。")}
        </p>

        <div className="tm-intro-grid">
          <section>
            <h4>{pick(lang, "The story", "背景故事")}</h4>
            <p>{bi(lang, L.story)}</p>
          </section>
          <section>
            <h4>{pick(lang, "Your goal", "通关目标")}</h4>
            <p>{bi(lang, L.goal)}</p>
          </section>
        </div>

        <section className="tm-intro-section">
          <h4>{pick(lang, "Rules", "本关规则")}</h4>
          <ul>
            {L.rules.map((r, i) => (
              <li key={i}>{bi(lang, r)}</li>
            ))}
          </ul>
        </section>

        <div className="tm-intro-grid">
          <section>
            <h4>{pick(lang, "The puzzle", "解谜机制")}</h4>
            <p>{bi(lang, L.mechanism)}</p>
          </section>
          <section>
            <h4>{pick(lang, "Controls", "操作方式")}</h4>
            <p>{bi(lang, L.controls)}</p>
          </section>
        </div>

        <section className="tm-intro-section">
          <h4>{pick(lang, "Stars & the hidden chest", "星星与隐藏宝箱")}</h4>
          <p>{bi(lang, L.collect)}</p>
        </section>

        {view.completedBefore && (
          <p className="tm-note tm-replay-note">
            {pick(lang, "You have finished this chapter before. Come back whenever you like — the puzzle never changes.", "这一关你之前通关过。随时可以再来，谜题不会变。")}
          </p>
        )}

        <button type="button" className="tm-primary" onClick={actions.begin}>
          {pick(lang, "Start exploring", "开始探索")} <span aria-hidden>→</span>
        </button>
      </div>
    </div>
  );
}

function ResultCard({ view, actions, lang }: { view: MazeView; actions: MazeActions; lang: Lang }) {
  const r = view.result;
  if (!r) return null;
  return (
    <div className="tm-overlay tm-result-overlay">
      <div className="tm-panel tm-result-card">
        <span className="tm-eyebrow">{pick(lang, "CHAPTER COMPLETE", "本关完成")}</span>
        <h2>{pick(lang, "Princess found the way out.", "公主找到出口啦。")}</h2>
        <p className="tm-note">{bi(lang, view.level.subtitle)}</p>
        <div className="tm-result-stats">
          <div>
            <span className="tm-eyebrow">{pick(lang, "STARS", "星星")}</span>
            <b>{r.stars} / 3</b>
          </div>
          <div>
            <span className="tm-eyebrow">{pick(lang, "HIDDEN CHEST", "隐藏宝箱")}</span>
            <b>{r.chest ? pick(lang, "Found", "已找到") : pick(lang, "Still hidden", "还没找到")}</b>
          </div>
        </div>
        {r.newTicket && (
          <div className="tm-ticket">
            <span className="tm-ticket-num">01</span>
            <div>
              <strong>GARDEN PATH</strong>
              <small>{pick(lang, "Garden Path Ticket · a keepsake", "花园小径纪念票 · 收藏留念")}</small>
            </div>
          </div>
        )}
        {r.firstTime && (
          <p className="tm-note">{pick(lang, "A light turned on back in the Fun Zone.", "乐园里有一盏灯亮了。")}</p>
        )}
        <div className="tm-result-actions">
          <button type="button" className="tm-primary" onClick={actions.exitToPark}>
            {pick(lang, "Back to Fun Zone", "回到乐园")}
          </button>
          <button type="button" className="tm-ghost" onClick={actions.replay}>
            {pick(lang, "Play again", "再玩一次")}
          </button>
        </div>
      </div>
    </div>
  );
}

export function TinyMazeGame({ view, actions, lang }: TinyMazeGameProps) {
  const { phase, level, stats, nearby, mapOpen, hintLevel, toast, starsFound } = view;
  const showHud = phase === "playing" || phase === "paused";
  const prompt = nearbyLabel(nearby, view, lang);

  return (
    <div className="tm-ui" data-phase={phase}>
      {showHud && (
        <>
          <div className="tm-hud-left">
            <span className="tm-eyebrow">CHAPTER {level.num}</span>
            <b>{bi(lang, level.name)}</b>
            <span className="tm-stars">
              {[0, 1, 2].map((i) => (
                <span key={i} className={stats.stars[i] ? "on" : ""}>✦</span>
              ))}
              <small>{starsFound} / 3</small>
            </span>
          </div>

          <div className="tm-hud-right">
            <button type="button" className="tm-iconbtn" onClick={actions.toggleMap} aria-label={pick(lang, "Map (M)", "地图 (M)")}>
              ▦
            </button>
            <button
              type="button"
              className="tm-iconbtn"
              onClick={() => actions.showHint(hintLevel === 1 ? 2 : 1)}
              aria-label={pick(lang, "Hint", "提示")}
            >
              ?
            </button>
            <button type="button" className="tm-iconbtn" onClick={actions.togglePause} aria-label={pick(lang, "Pause (Esc)", "暂停 (Esc)")}>
              {phase === "paused" ? "▶" : "Ⅱ"}
            </button>
          </div>

          {hintLevel > 0 && (
            <div className="tm-hint-panel tm-panel">
              <div className="tm-panel-head">
                <span className="tm-eyebrow">{pick(lang, `HINT ${hintLevel}`, `提示 ${hintLevel}`)}</span>
                <button type="button" className="tm-iconbtn" onClick={() => actions.showHint(hintLevel)} aria-label="×">×</button>
              </div>
              <p>{bi(lang, hintLevel === 1 ? level.hint1 : level.hint2)}</p>
              {hintLevel === 1 && (
                <button type="button" className="tm-ghost" onClick={() => actions.showHint(2)}>
                  {pick(lang, "A little more help", "再给一点提示")}
                </button>
              )}
            </div>
          )}

          <div className="tm-toast-slot">
            {toast && <div className={`tm-toast ${toast.good ? "good" : ""}`} onClick={actions.dismissToast}>{toast.text}</div>}
          </div>

          <Joystick runtime={view.runtime} lang={lang} />

          {prompt && phase === "playing" && (
            <div className="tm-interact">
              <span className="tm-interact-text">{prompt}</span>
              <button type="button" className="tm-action" onClick={() => actions.act(nearby)} aria-label={pick(lang, "Interact (Space)", "互动 (空格)")}>
                <span aria-hidden>✦</span>
                <small>{pick(lang, "SPACE", "空格")}</small>
              </button>
            </div>
          )}

          {phase === "paused" && (
            <div className="tm-overlay tm-pause-overlay">
              <div className="tm-panel tm-pause-card">
                <span className="tm-eyebrow">TINY MAZE</span>
                <h2>{pick(lang, "A little pause.", "先歇一会儿。")}</h2>
                <p className="tm-note">{pick(lang, "Princess will wait right here.", "公主会在这里等你。")}</p>
                <div className="tm-result-actions">
                  <button type="button" className="tm-primary" onClick={actions.togglePause}>
                    {pick(lang, "Keep exploring", "继续探索")}
                  </button>
                  <button type="button" className="tm-ghost" onClick={actions.replay}>
                    {pick(lang, "Start this chapter over", "重新开始本关")}
                  </button>
                </div>
                <button type="button" className="tm-textbtn" onClick={actions.exitToPark}>
                  {pick(lang, "Leave for the Fun Zone", "先回乐园")}
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {phase === "intro" && <IntroCard view={view} actions={actions} lang={lang} />}
      {phase === "result" && <ResultCard view={view} actions={actions} lang={lang} />}
      {mapOpen && <MapOverlay view={view} lang={lang} onClose={actions.toggleMap} />}
    </div>
  );
}
