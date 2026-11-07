import type React from "react";
import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import * as THREE from "three";
import type { OrbitControls as OrbitControlsImpl } from "three-stdlib";
import { Island } from "./Island";
import { MainIsland } from "./MainIsland";
import { Cloud, Flowers, LockMarker, Mushroom, Rock, Tree } from "./details";
import { Grow } from "./Grow";
import { Collie } from "./collie";
import { IslandTheme } from "./islands";
import { CollieDelivery } from "./CollieDelivery";
import { POND, POND_DIP } from "@/lib/world/bottle";
import { surfaceHeight, type IslandShape } from "@/lib/world/terrain";
import { isUnlocked } from "@/lib/world/regions";
import { pick, useLang } from "@/lib/i18n";
import { currentSession } from "@/lib/user";
import { BADGE_BY_ID } from "@/lib/achievements/badges";
import { buildStats } from "@/lib/achievements/stats";
import {
  achKey,
  evaluate,
  readState,
  recordAnimal,
  recordEgg,
  recordSurprise,
  writeState,
} from "@/lib/achievements/store";
import type { BadgeId } from "@/lib/achievements/types";
import { EmblemThumb } from "@/components/achievements/Emblem";

const START = new THREE.Vector3(4, 26, 40);
const END = new THREE.Vector3(10, 7.5, 15);
const TARGET = new THREE.Vector3(0, 0.3, 0);
const INTRO_S = 3;
const FOCUS_S = 1.1;

/** Where an island sits, and how big it is, so the camera can frame it. */
type FocusPoint = { pos: readonly [number, number, number]; radius: number };

/** A one-off camera framing, in world space. */
export type CameraCue = { pos: readonly [number, number, number]; target: readonly [number, number, number]; dur?: number };

function CameraRig({
  reducedMotion,
  focus,
  points,
  peek,
  cue,
  resetSignal,
  locked,
  onIntroDone,
}: {
  reducedMotion: boolean;
  focus: string | null;
  points: Record<string, FocusPoint>;
  /** The collie, framed for a couple of seconds after a click. */
  peek: { x: number; y: number; z: number } | null;
  cue: CameraCue | null;
  resetSignal: number;
  /** Keep the camera still and the orbit controls off (a cutscene is running). */
  locked: boolean;
  onIntroDone: () => void;
}) {
  const { camera } = useThree();
  const controls = useThree((s) => s.controls) as OrbitControlsImpl | null;
  const aspect = useThree((s) => s.size.width / s.size.height);
  // pull the camera back on tall/narrow screens so the whole island fits
  const overview = useMemo(() => END.clone().multiplyScalar(Math.min(2.1, Math.max(1, 1.15 / aspect))), [aspect]);

  // Clicking an island frames it instead of opening it: keep the angle the
  // visitor already looks from (clamped above the horizon) and close the
  // distance. The page behind an island only opens from its label button.
  const focusView = useMemo(() => {
    const p = focus ? points[focus] : undefined;
    if (!p) return null;
    const dir = camera.position.clone().sub(controls?.target ?? TARGET);
    if (dir.lengthSq() < 1e-6) dir.set(0.5, 0.6, 0.8);
    dir.y = Math.max(dir.y, 0.4);
    dir.normalize();
    const target = new THREE.Vector3(p.pos[0], p.pos[1] + 0.9, p.pos[2]);
    const dist = Math.max(9, p.radius * 3);
    return { pos: target.clone().addScaledVector(dir, dist), target };
  }, [focus, points, camera, controls]);

  const cueView = useMemo(
    () =>
      cue
        ? {
            pos: new THREE.Vector3(cue.pos[0], cue.pos[1], cue.pos[2]),
            target: new THREE.Vector3(cue.target[0], cue.target[1], cue.target[2]),
            dur: cue.dur,
          }
        : null,
    [cue],
  );

  // The dog is small and never stands still, so the click leans in close from
  // wherever the visitor already looks, holds for a beat, then lets go.
  const peekView = useMemo(() => {
    if (!peek) return null;
    const dir = camera.position.clone().sub(controls?.target ?? TARGET);
    dir.y = Math.max(dir.y, 0.35);
    dir.normalize();
    const target = new THREE.Vector3(peek.x, peek.y + 0.3, peek.z);
    return { pos: target.clone().addScaledVector(dir, 3.4), target };
  }, [peek, camera, controls]);

  const view = cueView ?? peekView ?? focusView;

  const flight = useRef<{
    fromPos: THREE.Vector3;
    fromTarget: THREE.Vector3;
    toPos: THREE.Vector3;
    toTarget: THREE.Vector3;
    t: number;
    dur: number;
  } | null>(null);
  const introDone = useRef(false);
  // The cutscene may only start once the opening swoop has actually landed;
  // otherwise the camera cue interrupts the intro halfway.
  const announcedIntro = useRef(false);
  // A resize must not yank the camera away from where the visitor left it;
  // only a focus change (or the opening flight) starts a new one.
  const overviewRef = useRef(overview);
  overviewRef.current = overview;
  const lockedRef = useRef(locked);
  lockedRef.current = locked;

  // One flight helper for the opening swoop, every focus change and the
  // bottle-delivery framing.
  useEffect(() => {
    if (!controls) return;
    const intro = !introDone.current;
    introDone.current = true;
    const toPos = (view ? view.pos : overviewRef.current).clone();
    const toTarget = (view ? view.target : TARGET).clone();
    const dur = reducedMotion ? 0 : intro ? INTRO_S : cueView ? (cueView.dur ?? 1.6) : FOCUS_S;
    if (dur === 0) {
      camera.position.copy(toPos);
      controls.target.copy(toTarget);
      flight.current = null;
      controls.update();
      controls.enabled = !lockedRef.current;
      if (!announcedIntro.current) {
        announcedIntro.current = true;
        onIntroDone();
      }
    } else {
      flight.current = {
        fromPos: camera.position.clone(),
        fromTarget: controls.target.clone(),
        toPos,
        toTarget,
        t: 0,
        dur,
      };
    }
  }, [controls, camera, view, cueView, reducedMotion, resetSignal, onIntroDone]);

  // The delivery and the dog peek both lean right in, so the orbit floor has
  // to come down with them.
  useEffect(() => {
    if (!controls) return;
    controls.minDistance = cueView || peekView ? 3 : 8;
  }, [controls, cueView, peekView]);

  useEffect(() => {
    if (!controls || flight.current) return;
    controls.enabled = !locked;
  }, [controls, locked]);

  useFrame((_, dt) => {
    const f = flight.current;
    if (!f || !controls) return;
    f.t = Math.min(f.dur, f.t + Math.min(dt, 0.05));
    const p = f.t / f.dur;
    const e = 1 - Math.pow(1 - p, 3);
    camera.position.lerpVectors(f.fromPos, f.toPos, e);
    controls.target.lerpVectors(f.fromTarget, f.toTarget, e);
    controls.enabled = false;
    controls.update();
    if (p >= 1) {
      flight.current = null;
      controls.enabled = !lockedRef.current;
      if (!announcedIntro.current) {
        announcedIntro.current = true;
        onIntroDone();
      }
    }
  });
  return null;
}

type LabelTarget = { el: HTMLElement | null; world: THREE.Vector3; bob: number };

/** Framing for the bottle delivery: close enough to see the collie and the pond. */
const DELIVERY_CAMERA: CameraCue = { pos: [10.2, 2.85, -5.95], target: [9.2, 1.55, -8.85], dur: 1.5 };

/** Projects world points to screen each frame and positions plain DOM labels. */
function LabelProjector({
  targets,
  reducedMotion,
}: {
  targets: React.RefObject<LabelTarget[]>;
  reducedMotion: boolean;
}) {
  const v = useMemo(() => new THREE.Vector3(), []);
  useFrame(({ camera, size, clock }) => {
    for (const t of targets.current ?? []) {
      if (!t.el) continue;
      v.copy(t.world);
      if (!reducedMotion) v.y += Math.sin(clock.elapsedTime * 0.45 + t.bob) * 0.12;
      v.project(camera);
      const visible = v.z < 1;
      const x = (v.x * 0.5 + 0.5) * size.width;
      const y = (-v.y * 0.5 + 0.5) * size.height;
      t.el.style.transform = `translate(-50%, -50%) translate(${x}px, ${y}px)`;
      t.el.style.visibility = visible ? "visible" : "hidden";
    }
  });
  return null;
}

function ReadySignal({ onReady }: { onReady: () => void }) {
  const done = useRef(false);
  const fire = useRef(onReady);
  fire.current = onReady;
  const scene = useThree((s) => s.scene);
  useEffect(() => {
    if (import.meta.env.DEV) (window as unknown as { __scene?: THREE.Scene }).__scene = scene;
  }, [scene]);
  useEffect(() => {
    // The scene tree is mounted the moment this runs, so the veil can come down.
    // Waiting for a first frame was the bug: a slow or throttled canvas simply
    // never delivered one and the loader stayed up forever.
    if (done.current) return;
    done.current = true;
    fire.current();
  }, []);
  useFrame(() => {
    if (done.current) return;
    done.current = true;
    fire.current();
  });
  return null;
}

type Region3D = {
  id: string;
  name: string;
  nameZh: string;
  pos: [number, number, number];
  shape: IslandShape;
  phase: number;
  trees: [number, number, number][];
};

/** The satellite islands. `id` matches the entry in lib/world/regions.ts. */
const REGIONS_3D: Region3D[] = [
  {
    id: "gallery",
    name: "Gallery",
    nameZh: "作品集",
    pos: [-11, -1.0, -5],
    phase: 1.4,
    shape: { radius: 2.6, height: 0.45, depth: 2.6, seed: 4.2, bump: 0.08 },
    trees: [
      [-0.8, 0.3, 0.9],
      [0.6, -0.7, 0.75],
      [0.2, 0.9, 0.65],
    ],
  },
  {
    id: "collections",
    name: "Collections",
    nameZh: "收藏",
    pos: [8.5, 1.1, -10],
    phase: 2.6,
    shape: { radius: 2.2, height: 0.4, depth: 2.3, seed: 7.7, bump: 0.08, dips: [POND_DIP] },
    trees: [
      [-0.5, -0.4, 0.8],
      [1.55, -0.55, 0.6],
    ],
  },
  {
    id: "fun",
    name: "Fun Zone",
    nameZh: "乐园",
    pos: [-6.5, -1.8, 8.5],
    phase: 3.9,
    shape: { radius: 2.0, height: 0.4, depth: 2.1, seed: 2.9, bump: 0.07 },
    trees: [[0.6, -0.3, 0.7]],
  },
  {
    id: "community",
    name: "Community",
    nameZh: "留言",
    pos: [12.5, -1.5, 3],
    phase: 5.1,
    shape: { radius: 1.7, height: 0.35, depth: 1.9, seed: 9.4, bump: 0.06 },
    trees: [[-0.3, 0.4, 0.6]],
  },
];

/** The island the bottle delivery plays on. */
const COLLECTIONS_3D = REGIONS_3D.find((r) => r.id === "collections")!;

/**
 * A treeline and a few blooms around the edge of a satellite island. Without
 * this, unlocking one just swaps a padlock for a single building on bare grass,
 * which reads as "still empty" rather than "this place is now open".
 */
function IslandGreen({
  shape,
  seed,
  skip,
}: {
  shape: IslandShape;
  seed: number;
  /** Ring spots to leave empty (the third island's pond sits in one of them). */
  skip?: ((x: number, z: number) => boolean) | undefined;
}) {
  const spots = useMemo(() => {
    const list: { x: number; y: number; z: number; s: number; r: number }[] = [];
    for (let i = 0; i < 12; i++) {
      const a = (i / 12) * Math.PI * 2 + seed * 1.7;
      const rr = 0.6 + ((i * 5) % 4) * 0.1;
      const x = Math.cos(a) * rr * shape.radius;
      const z = Math.sin(a) * rr * shape.radius;
      if (skip?.(x, z)) continue;
      list.push({ x, y: surfaceHeight(x, z, shape), z, s: 0.42 + ((i * 3) % 5) * 0.08, r: a });
    }
    return list;
  }, [shape, seed, skip]);

  const blooms = useMemo(
    () =>
      spots
        .filter((_, i) => i % 4 === 0)
        .map((p) => ({
          p: [p.x * 0.86, p.y + 0.04, p.z * 0.86] as [number, number, number],
          c: ["#f3d9a4", "#e8b7b0", "#cfe0ee", "#e7d3ef"][Math.abs(Math.round(p.r * 10)) % 4]!,
        })),
    [spots],
  );

  return (
    <>
      {spots.map((p, i) =>
        i % 4 === 0 ? null : (
          <Grow key={i} position={[p.x, p.y - 0.02, p.z]}>
            {i % 4 === 3 ? (
              <Mushroom position={[0, 0, 0]} cream={i % 2 === 0} />
            ) : (
              <Tree position={[0, 0, 0]} scale={p.s} variant={(i % 3) + 1} />
            )}
          </Grow>
        ),
      )}
      <Flowers points={blooms} />
    </>
  );
}

/** Keep trees and mushrooms out of the pond on the third island. */
const NEAR_POND = (x: number, z: number) => Math.hypot(x - POND.x, z - POND.z) < POND.r + 0.3;

function RegionIsland({
  data,
  unlocked,
  reducedMotion,
  onSelect,
  onHover,
  onEgg,
}: {
  data: Region3D;
  unlocked: boolean;
  reducedMotion: boolean;
  onSelect: () => void;
  onHover: (h: boolean) => void;
  onEgg: (id: string) => void;
}) {
  const h = (x: number, z: number) => surfaceHeight(x, z, data.shape);
  const outward = useMemo<[number, number]>(() => {
    const len = Math.hypot(data.pos[0], data.pos[2]) || 1;
    return [data.pos[0] / len, data.pos[2] / len];
  }, [data.pos]);
  return (
    <Island
      shape={data.shape}
      position={data.pos}
      grass={unlocked ? "#a7c79c" : "#b4c3ad"}
      muted={!unlocked}
      bobPhase={data.phase}
      reducedMotion={reducedMotion}
      onSelect={unlocked ? onSelect : undefined}
      onHover={unlocked ? onHover : undefined}
    >
      {unlocked && (
        <>
          <IslandTheme id={data.id} shape={data.shape} reducedMotion={reducedMotion} outward={outward} onEgg={onEgg} />
          <IslandGreen shape={data.shape} seed={data.phase} skip={data.id === "collections" ? NEAR_POND : undefined} />
          {data.trees.map(([x, z, s], i) => (
            <Grow key={i} position={[x, h(x, z) - 0.02, z]}>
              <Tree position={[0, 0, 0]} scale={s} variant={i + 2} />
            </Grow>
          ))}
        </>
      )}
      <Rock position={[-0.4, h(-0.4, -0.9), -0.9]} scale={0.18} rot={1} />
      <Rock position={[0.9, h(0.9, 0.8), 0.8]} scale={0.12} rot={2} />
      {!unlocked && <LockMarker position={[0, h(0, 0) + 1.25, 0]} />}
    </Island>
  );
}

/**
 * Loose stepping stones drifting between the main island and each satellite.
 * Deliberately not a bridge — the gaps are part of the floating-world look.
 */
function SteppingRocks() {
  return (
    <>
      {REGIONS_3D.map((r) => {
        const len = Math.hypot(r.pos[0], r.pos[2]) || 1;
        const ux = r.pos[0] / len;
        const uz = r.pos[2] / len;
        const fromR = 4.7;
        const toR = len - r.shape.radius * 0.9;
        return Array.from({ length: 4 }, (_, i) => {
          const t = (i + 1) / 5;
          const d = fromR + (toR - fromR) * t;
          const y = r.pos[1] * t + Math.sin(t * Math.PI) * 0.32;
          return (
            <Rock
              key={`${r.id}-${i}`}
              position={[ux * d, y, uz * d]}
              scale={0.2 + (i % 3) * 0.045}
              rot={i * 1.7 + r.phase}
            />
          );
        });
      })}
    </>
  );
}

/** Three soft notes. Silent when the visitor has turned sound off. */
function chime() {
  try {
    if (localStorage.getItem("jenia:sound") === "off") return;
    const Ctor =
      window.AudioContext ??
      (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctor) return;
    const ctx = new Ctor();
    [659.25, 987.77, 1318.51].forEach((freq, i) => {
      const at = ctx.currentTime + i * 0.11;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0.0001, at);
      gain.gain.linearRampToValueAtTime(0.09, at + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, at + 0.85);
      osc.connect(gain).connect(ctx.destination);
      osc.start(at);
      osc.stop(at + 0.9);
    });
    window.setTimeout(() => void ctx.close(), 1400);
  } catch {
    // sound is a nicety, never a blocker
  }
}

/** Purely visual weather: a meteor, fireflies, or a low rainbow. */
function SurpriseOverlay({ kind }: { kind: string }) {
  return (
    <div className="pointer-events-none absolute inset-0 z-10 overflow-hidden" aria-hidden>
      {kind === "shooting-star" && (
        <span className="surprise-meteor">
          <i />
        </span>
      )}
      {kind === "fireflies" && (
        <span className="surprise-fireflies">
          {Array.from({ length: 20 }, (_, i) => (
            <i
              key={i}
              style={{
                left: `${(i * 37) % 100}%`,
                top: `${22 + ((i * 53) % 58)}%`,
                animationDelay: `${(i % 7) * 0.32}s`,
              }}
            />
          ))}
        </span>
      )}
      {kind === "rainbow" && (
        <span className="surprise-rainbow">
          <i />
          <i />
          <i />
        </span>
      )}
    </div>
  );
}

type Props = {
  reducedMotion: boolean;
  visited: readonly string[];
  onOpenRegion: (id: string) => void;
  onReady: () => void;
  /** Stop drawing while a page covers the map — frees the GPU and the context budget. */
  paused?: boolean;
  /** The browser dropped the WebGL context (tab switch, driver reset, GPU eviction). */
  onContextLost?: (() => void) | undefined;
  /** The third island owes the visitor a bottle delivery (first time only). */
  bottleDue?: boolean;
  /** The bottle is in the water, or on its way there. */
  bottleFloating?: boolean;
  /** Keep the "there is something in the pond" nudge until the letter is read. */
  bottleUnread?: boolean;
  /** The letter has been read — the collie is free to leave. */
  bottleRead?: boolean;
  onBottleDelivered?: (() => void) | undefined;
  onOpenLetter?: (() => void) | undefined;
  /** Bumped when the letter closes, so the camera drifts back to the overview. */
  overviewTick?: number;
};

export default function WorldScene({
  reducedMotion,
  visited,
  onOpenRegion,
  onReady,
  paused = false,
  onContextLost,
  bottleDue = false,
  bottleFloating = false,
  bottleUnread = false,
  bottleRead = false,
  onBottleDelivered,
  onOpenLetter,
  overviewTick = 0,
}: Props) {
  const [lang] = useLang();
  const [hovered, setHovered] = useState(false);
  /** The island the camera is currently framing. Pages open from the label button only. */
  const [focus, setFocus] = useState<string | null>(null);
  /** The bottle delivery: the camera holds still and the labels step aside. */
  const [cine, setCine] = useState(false);
  const [cue, setCue] = useState<CameraCue | null>(null);
  const [resetSignal, setResetSignal] = useState(0);
  const [introReady, setIntroReady] = useState(false);
  const deliveryStarted = useRef(false);
  const onIntroDone = useCallback(() => setIntroReady(true), []);
  const handleDelivered = useCallback(() => onBottleDelivered?.(), [onBottleDelivered]);
  const handleOpenLetter = useCallback(() => onOpenLetter?.(), [onOpenLetter]);
  const handleDone = useCallback(() => setCine(false), []);
  const focusIsland = useCallback(
    (id: string) => {
      if (cine) return;
      setCue(null);
      setFocus(id);
    },
    [cine],
  );
  const focusPoints = useMemo<Record<string, FocusPoint>>(() => {
    const p: Record<string, FocusPoint> = { about: { pos: [0, 0, 0], radius: 5 } };
    for (const r of REGIONS_3D) p[r.id] = { pos: r.pos, radius: r.shape.radius };
    return p;
  }, []);
  /** Clicking the collie leans the camera onto her, then lets go two beats later. */
  const [peek, setPeek] = useState<{ x: number; y: number; z: number } | null>(null);
  const peekTimer = useRef(0);
  const onColliePoke = useCallback(
    (at: { x: number; y: number; z: number }) => {
      if (cine) return;
      setPeek(at);
      window.clearTimeout(peekTimer.current);
      peekTimer.current = window.setTimeout(() => setPeek(null), 2000);
    },
    [cine],
  );
  useEffect(() => () => window.clearTimeout(peekTimer.current), []);
  // Where the pointer went down, so a drag across empty sky does not clear the
  // focus — only a genuine click does.
  const press = useRef<{ x: number; y: number } | null>(null);
  useEffect(() => {
    if (!focus && !peek) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setFocus(null);
        setPeek(null);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [focus, peek]);

  // Once the first two islands are done, the third one delivers a bottle: the
  // camera turns to its pond and the collie does the rest.
  useEffect(() => {
    if (!bottleDue || !introReady || deliveryStarted.current) return;
    const id = window.setTimeout(() => {
      deliveryStarted.current = true;
      setFocus(null);
      setCue(DELIVERY_CAMERA);
      setCine(true);
    }, 700);
    return () => window.clearTimeout(id);
  }, [bottleDue, introReady]);

  // Closing the letter returns to the overview, not to whatever was framed before.
  const lastTick = useRef(overviewTick);
  useEffect(() => {
    if (overviewTick === lastTick.current) return;
    lastTick.current = overviewTick;
    setCue(null);
    setFocus(null);
    setCine(false);
    setResetSignal((n) => n + 1);
  }, [overviewTick]);
  const [found, setFound] = useState(false);
  const [toast, setToast] = useState<BadgeId | null>(null);
  const [surprise, setSurprise] = useState<string | null>(null);
  const [muted, setMuted] = useState(false);
  useEffect(() => {
    setMuted(localStorage.getItem("jenia:sound") === "off");
  }, []);
  useEffect(() => {
    if (!found) return;
    const id = window.setTimeout(() => setFound(false), 5600);
    return () => window.clearTimeout(id);
  }, [found]);
  useEffect(() => {
    if (!toast) return;
    const id = window.setTimeout(() => setToast(null), 5600);
    return () => window.clearTimeout(id);
  }, [toast]);

  /** Re-evaluates the wall and hands back any badge that just became real. */
  const newlyEarned = useCallback((): BadgeId[] => {
    const session = currentSession();
    if (!session) return [];
    const state = readState(achKey(session));
    const stats = buildStats(session, state);
    const ev = evaluate(state, stats);
    if (ev.newly.length) writeState(achKey(session), ev.state);
    return ev.newly;
  }, []);

  const onEgg = useCallback(
    (id: string) => {
      const session = currentSession();
      if (!session) return;
      recordEgg(session, id);
      const newly = newlyEarned();
      if (newly[0]) {
        setToast(newly[0]);
        chime();
      }
    },
    [newlyEarned],
  );

  const onAnimal = useCallback(() => {
    const session = currentSession();
    if (!session) return;
    recordAnimal(session, "border-collie");
    newlyEarned();
    setFound(true);
    chime();
  }, [newlyEarned]);

  // A rare, harmless surprise. It is visual only and records which kinds were
  // met; it never hands out a badge on a coin flip — the badges need 1 or 3 of
  // these, and the third one only comes from actually meeting three kinds.
  useEffect(() => {
    if (reducedMotion) return;
    let alive = true;
    let timer = 0;
    const kinds = ["shooting-star", "fireflies", "rainbow"];
    const show = () => {
      if (!alive) return;
      const kind = kinds[Math.floor(Math.random() * kinds.length)]!;
      setSurprise(kind);
      const session = currentSession();
      if (session) {
        recordSurprise(session, kind);
        const newly = newlyEarned();
        if (newly[0]) {
          setToast(newly[0]);
          chime();
        }
      }
      window.setTimeout(() => {
        if (alive) setSurprise(null);
      }, 7000);
      timer = window.setTimeout(show, 45000 + Math.random() * 30000);
    };
    timer = window.setTimeout(show, 16000 + Math.random() * 10000);
    return () => {
      alive = false;
      window.clearTimeout(timer);
    };
  }, [reducedMotion, newlyEarned]);
  const shell = useRef<HTMLDivElement>(null);
  const [box, setBox] = useState("?");
  useEffect(() => {
    const el = shell.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    setBox(`${Math.round(r.width)}x${Math.round(r.height)}`);
  }, []);
  const labels = useRef<LabelTarget[]>([
    { el: null, world: new THREE.Vector3(0, 3, 0), bob: 0 },
    ...REGIONS_3D.map((l) => ({
      el: null,
      world: new THREE.Vector3(l.pos[0], l.pos[1] + surfaceHeight(0, 0, l.shape) + 1.85, l.pos[2]),
      bob: l.phase,
    })),
  ]);
  useEffect(() => {
    document.body.style.cursor = hovered ? "pointer" : "";
    return () => {
      document.body.style.cursor = "";
    };
  }, [hovered]);

  const tags = [
    { id: "about", name: "My World", nameZh: "我的世界", locked: false },
    ...REGIONS_3D.map((r) => ({ id: r.id, name: r.name, nameZh: r.nameZh, locked: !isUnlocked(r.id, visited) })),
  ];
  const toastDef = toast ? BADGE_BY_ID.get(toast) : undefined;

  return (
    <div
      className="absolute inset-0"
      ref={shell}
      data-box={box}
      onPointerDown={(e) => {
        press.current = { x: e.clientX, y: e.clientY };
      }}
    >
      <Canvas
        shadows
        dpr={[1, 1.25]}
        frameloop={paused ? "never" : "always"}
        onPointerMissed={(e) => {
          const p = press.current;
          if (p && Math.hypot(e.clientX - p.x, e.clientY - p.y) < 6) {
            setFocus(null);
            setPeek(null);
            setCue(null);
          }
        }}
        // "default" lets the browser keep the canvas on the GPU it started on.
        // Forcing "high-performance" makes laptops switch GPUs when the window
        // moves, and the switch is a common cause of a lost WebGL context.
        gl={{ antialias: true, alpha: true, powerPreference: "default" }}
        camera={{
          position: reducedMotion ? END.toArray() : START.toArray(),
          fov: 40,
          near: 0.1,
          far: 200,
        }}
        onCreated={({ gl, scene, camera }) => {
          gl.toneMapping = THREE.ACESFilmicToneMapping;
          gl.toneMappingExposure = 1.05;
          // A lost context leaves a blank canvas that looks like a frozen page.
          // Swallow the default behaviour so the browser may restore it, and let
          // the map remount a fresh scene instead of sitting there empty.
          gl.domElement.addEventListener(
            "webglcontextlost",
            (event) => {
              event.preventDefault();
              onContextLost?.();
            },
            { once: true },
          );
          // ponytail: the scene stays reachable from the console so the world can
          // be inspected without a debug build. Cheap: two references.
          (window as unknown as { __scene?: THREE.Scene }).__scene = scene;
          (window as unknown as { __camera?: THREE.Camera }).__camera = camera;
          // The renderer is alive — that is the only signal the veil needs.
          onReady();
        }}
        style={{ touchAction: "none" }}
      >
        <fog attach="fog" args={["#dfe8ec", 32, 80]} />
        <hemisphereLight args={["#f1f6f8", "#c7d2bf", 0.75]} />
        <ambientLight intensity={0.18} />
        <directionalLight
          position={[9, 16, 7]}
          intensity={1.7}
          color="#fff1dc"
          castShadow
          shadow-mapSize={[2048, 2048]}
          shadow-camera-left={-9}
          shadow-camera-right={9}
          shadow-camera-top={9}
          shadow-camera-bottom={-9}
          shadow-camera-near={1}
          shadow-camera-far={45}
          shadow-bias={-0.0005}
          shadow-normalBias={0.03}
          shadow-radius={4}
        />
        {/* Bounced sky light replaces the HDR environment: no extra cubemap
            render pass, so the first frame arrives much sooner. */}
        <directionalLight position={[-8, 5, -6]} intensity={0.55} color="#cfe0ee" />
        <directionalLight position={[6, 3, 8]} intensity={0.4} color="#f3e6cb" />

        <Suspense fallback={null}>
          <MainIsland
            reducedMotion={reducedMotion}
            onSelect={() => focusIsland("about")}
            hovered={hovered}
            setHovered={setHovered}
            revealed={true}
            onEgg={onEgg}
          />
          {REGIONS_3D.map((r) => (
            <RegionIsland
              key={r.id}
              data={r}
              unlocked={isUnlocked(r.id, visited)}
              reducedMotion={reducedMotion}
              onSelect={() => focusIsland(r.id)}
              onHover={setHovered}
              onEgg={onEgg}
            />
          ))}
          {isUnlocked("collections", visited) && (
            <CollieDelivery
              shape={COLLECTIONS_3D.shape}
              play={cine}
              delivered={bottleFloating}
              exit={bottleRead}
              reducedMotion={reducedMotion}
              onDelivered={handleDelivered}
              onDone={handleDone}
              onOpen={handleOpenLetter}
            />
          )}
          <SteppingRocks />
          {!cine && !(bottleFloating && bottleUnread) && (
            <Collie reducedMotion={reducedMotion} onFound={onAnimal} onPoke={onColliePoke} />
          )}
          <Cloud position={[-14, 6, -16]} scale={2.2} speed={0.04} reducedMotion={reducedMotion} />
          <Cloud position={[16, 8, -20]} scale={2.8} speed={0.03} reducedMotion={reducedMotion} />
          <Cloud position={[2, -7, -14]} scale={2} speed={0.05} reducedMotion={reducedMotion} />
          <Cloud position={[-18, -4, 10]} scale={2.4} speed={0.035} reducedMotion={reducedMotion} />
        </Suspense>

        {/* Outside the content Suspense on purpose: the veil should come down as
            soon as the canvas exists, not when the last island finishes suspending. */}
        <ReadySignal onReady={onReady} />

        <OrbitControls
          makeDefault
          enabled={!cine}
          enablePan={false}
          enableDamping
          dampingFactor={0.08}
          minDistance={8}
          maxDistance={42}
          minPolarAngle={0.35}
          maxPolarAngle={1.42}
          rotateSpeed={0.6}
          zoomSpeed={0.7}
        />
        <CameraRig
          reducedMotion={reducedMotion}
          focus={focus}
          points={focusPoints}
          peek={peek}
          cue={cue}
          resetSignal={resetSignal}
          locked={cine}
          onIntroDone={onIntroDone}
        />
        <LabelProjector targets={labels} reducedMotion={reducedMotion} />
      </Canvas>
      <div
        className={`pointer-events-none absolute inset-0 overflow-hidden transition-opacity duration-700 ${cine ? "opacity-0 [&_*]:pointer-events-none" : "opacity-100"}`}
        data-tags={tags.length}
      >
        {tags.map((t, i) => (
          <div
            key={t.id}
            ref={(el) => {
              labels.current[i]!.el = el;
            }}
            className="absolute left-0 top-0"
            style={{ visibility: "hidden" }}
          >
            <div className="flex -translate-x-1/2 -translate-y-1/2 flex-col items-center gap-1.5 whitespace-nowrap">
              <span className="region-dot" aria-hidden />
              <span className="text-[0.68rem] tracking-[0.22em] uppercase text-foreground/70">{pick(lang, t.name, t.nameZh)}</span>
              {t.locked ? (
                <span className="flex items-center gap-1.5 rounded-full border border-border/70 bg-background/70 px-3 py-1 text-[0.6rem] tracking-[0.14em] uppercase text-muted-foreground backdrop-blur-sm">
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" aria-hidden>
                    <rect x="4" y="11" width="16" height="10" rx="2" />
                    <path d="M8 11V7a4 4 0 0 1 8 0v4" />
                  </svg>
                  {pick(lang, "Locked", "未解锁")}
                </span>
              ) : (
                <button
                  type="button"
                  onClick={() => onOpenRegion(t.id)}
                  className="pointer-events-auto rounded-full bg-foreground px-3.5 py-1.5 text-[0.66rem] font-medium tracking-[0.06em] text-background shadow-[0_2px_10px_rgba(0,0,0,0.18)] transition-opacity hover:opacity-85"
                >
                  {pick(lang, "Enter", "进入")} {pick(lang, t.name, t.nameZh)}
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
      {surprise && <SurpriseOverlay kind={surprise} />}
      {toastDef && (
        <div className="pointer-events-none absolute inset-x-0 bottom-5 z-20 flex justify-center px-4">
          <div
            role="status"
            className="pointer-events-auto flex items-start gap-3 rounded-2xl border border-white/70 bg-white/88 px-4 py-3 shadow-[0_22px_54px_-28px_rgba(20,40,60,0.62)] backdrop-blur-md"
            style={{ animation: "rise 620ms cubic-bezier(.22,.68,.24,1) both" }}
          >
            <span
              className="grid h-11 w-11 shrink-0 place-items-center rounded-full"
              style={{ background: `radial-gradient(circle at 32% 26%, ${toastDef.metal[0]}, ${toastDef.metal[1]})` }}
            >
              <EmblemThumb emblem={toastDef.emblem} metal={toastDef.metal} silhouette={false} className="block h-9 w-9" />
            </span>
            <div className="text-left">
              <p className="text-[0.48rem] uppercase tracking-[0.3em] text-[#7d9fc4]">
                {pick(lang, `New badge · No. ${toastDef.num}`, `新徽章 · 第 ${toastDef.num} 号`)}
              </p>
              <p className="mt-0.5 text-[0.86rem] font-medium text-[#2f4156]">{pick(lang, toastDef.en, toastDef.zh)}</p>
              <p className="mt-0.5 max-w-[15rem] text-[0.6rem] leading-snug text-[#465a72]/80">
                {pick(lang, toastDef.line.en, toastDef.line.zh)}
              </p>
            </div>
          </div>
        </div>
      )}
      {found && !toastDef && (
        <div className="pointer-events-none absolute inset-x-0 bottom-5 z-20 flex justify-center px-4">
          <div
            role="status"
            className="pointer-events-auto flex items-start gap-3 rounded-2xl border border-white/70 bg-white/88 px-4 py-3 shadow-[0_22px_54px_-28px_rgba(20,40,60,0.62)] backdrop-blur-md"
            style={{ animation: "rise 620ms cubic-bezier(.22,.68,.24,1) both" }}
          >
            <span
              className="grid h-11 w-11 shrink-0 place-items-center rounded-full text-[#2f4156]"
              style={{ background: "radial-gradient(circle at 32% 26%, #e8eff6, #8fa9bf)" }}
              aria-hidden
            >
              <svg
                viewBox="0 0 48 48"
                className="h-7 w-7"
                fill="none"
                stroke="currentColor"
                strokeWidth={1.6}
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M24 13c4.8 0 7.6 3 7.6 7.6 0 2.4-.4 4.3-1.3 6l-1.7 6c-.4 1.6-1.9 2.6-3.5 2.6h-2.2c-1.6 0-3.1-1-3.5-2.6l-1.7-6c-.9-1.7-1.3-3.6-1.3-6C16.4 16 19.2 13 24 13Z" />
                <path d="M17.8 16.6 15.2 10l4.7 3.3M30.2 16.6 32.8 10 28.1 13.3" />
                <circle cx="21.2" cy="20.6" r="1.4" fill="currentColor" stroke="none" />
                <circle cx="26.8" cy="20.6" r="1.4" fill="currentColor" stroke="none" />
                <path d="M24 24.4v2.2" />
              </svg>
            </span>
            <div className="text-left">
              <p className="text-[0.48rem] uppercase tracking-[0.3em] text-[#7d9fc4]">
                {pick(lang, "New badge · No. 37", "新徽章 · 第 37 号")}
              </p>
              <p className="mt-0.5 text-[0.86rem] font-medium text-[#2f4156]">
                {pick(lang, "Border Collie Tracker", "小狗追踪员")}
              </p>
              <p className="mt-0.5 max-w-[15rem] text-[0.6rem] leading-snug text-[#465a72]/80">
                {pick(
                  lang,
                  "You found the little one running between the islands.",
                  "你发现了那只在岛屿之间奔跑的小家伙。",
                )}
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                localStorage.setItem("jenia:sound", "off");
                setMuted(true);
              }}
              disabled={muted}
              className="ml-1 shrink-0 rounded-full border border-[#2f4156]/15 px-2 py-0.5 text-[0.55rem] text-[#465a72]/70 transition hover:bg-[#2f4156]/5 disabled:opacity-40"
              aria-label={pick(lang, "Turn the sound off", "关掉音效")}
            >
              {muted ? "🔇" : "🔈"}
            </button>
          </div>
        </div>
      )}
      {bottleFloating && bottleUnread && !cine && (
        <div className="absolute inset-x-0 bottom-16 z-20 flex justify-center px-4">
          {cue ? (
            <p className="pointer-events-none rounded-full border border-white/70 bg-white/80 px-4 py-2 text-[0.7rem] tracking-[0.06em] text-[#2f4156] shadow-[0_18px_40px_-30px_rgba(20,40,60,0.6)] backdrop-blur-md">
              {pick(lang, "A bottle is drifting in the pond — tap it.", "水面上漂着一只瓶子，点它看看。")}
            </p>
          ) : (
            <button
              type="button"
              onClick={() => {
                setFocus(null);
                setCue(DELIVERY_CAMERA);
              }}
              className="pointer-events-auto rounded-full border border-white/70 bg-white/85 px-4 py-2 text-[0.7rem] text-[#2f4156] shadow-[0_18px_40px_-30px_rgba(20,40,60,0.6)] backdrop-blur-md transition hover:bg-white"
              style={{ animation: "rise 620ms cubic-bezier(.22,.68,.24,1) both" }}
            >
              {pick(lang, "Something is drifting in the third island's pond", "第三座岛的水池里，好像有东西")}{" "}
              <span aria-hidden>→</span>
            </button>
          )}
        </div>
      )}
    </div>
  );
}
