import type React from "react";
import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import * as THREE from "three";
import type { OrbitControls as OrbitControlsImpl } from "three-stdlib";
import { Island } from "./Island";
import { MainIsland } from "./MainIsland";
import { Cloud, Flowers, LockMarker, Mushroom, Rock, Tree } from "./details";
import { Grow } from "./Grow";
import { IslandTheme } from "./islands";
import { surfaceHeight, type IslandShape } from "@/lib/world/terrain";
import { isUnlocked } from "@/lib/world/regions";
import { pick, useLang } from "@/lib/i18n";

const START = new THREE.Vector3(4, 26, 40);
const END = new THREE.Vector3(10, 7.5, 15);
const TARGET = new THREE.Vector3(0, 0.3, 0);
const INTRO_S = 3;

function CameraRig({ reducedMotion }: { reducedMotion: boolean }) {
  const { camera } = useThree();
  const controls = useThree((s) => s.controls) as OrbitControlsImpl | null;
  const t = useRef(reducedMotion ? INTRO_S : 0);
  const aspect = useThree((s) => s.size.width / s.size.height);
  // pull the camera back on tall/narrow screens so the whole island fits
  const end = useMemo(() => END.clone().multiplyScalar(Math.min(2.1, Math.max(1, 1.15 / aspect))), [aspect]);
  useFrame((_, dt) => {
    if (!controls) return;
    if (t.current < INTRO_S) {
      t.current = Math.min(INTRO_S, t.current + Math.min(dt, 0.05));
      const p = t.current / INTRO_S;
      const e = 1 - Math.pow(1 - p, 3);
      camera.position.lerpVectors(START, end, e);
      controls.target.copy(TARGET);
      controls.enabled = p >= 1;
      controls.update();
    }
  });
  useEffect(() => {
    if (reducedMotion) camera.position.copy(end);
  }, [reducedMotion, camera, end]);
  return null;
}

type LabelTarget = { el: HTMLElement | null; world: THREE.Vector3; bob: number };

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
    shape: { radius: 2.2, height: 0.4, depth: 2.3, seed: 7.7, bump: 0.08 },
    trees: [
      [-0.5, -0.4, 0.8],
      [0.7, 0.3, 0.6],
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

/**
 * A treeline and a few blooms around the edge of a satellite island. Without
 * this, unlocking one just swaps a padlock for a single building on bare grass,
 * which reads as "still empty" rather than "this place is now open".
 */
function IslandGreen({ shape, seed }: { shape: IslandShape; seed: number }) {
  const spots = useMemo(() => {
    const list: { x: number; y: number; z: number; s: number; r: number }[] = [];
    for (let i = 0; i < 12; i++) {
      const a = (i / 12) * Math.PI * 2 + seed * 1.7;
      const rr = 0.6 + ((i * 5) % 4) * 0.1;
      const x = Math.cos(a) * rr * shape.radius;
      const z = Math.sin(a) * rr * shape.radius;
      list.push({ x, y: surfaceHeight(x, z, shape), z, s: 0.42 + ((i * 3) % 5) * 0.08, r: a });
    }
    return list;
  }, [shape, seed]);

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

function RegionIsland({
  data,
  unlocked,
  reducedMotion,
  onOpen,
  onHover,
}: {
  data: Region3D;
  unlocked: boolean;
  reducedMotion: boolean;
  onOpen: () => void;
  onHover: (h: boolean) => void;
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
      onSelect={unlocked ? onOpen : undefined}
      onHover={unlocked ? onHover : undefined}
    >
      {unlocked && (
        <>
          <IslandTheme id={data.id} shape={data.shape} reducedMotion={reducedMotion} outward={outward} />
          <IslandGreen shape={data.shape} seed={data.phase} />
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

type Props = {
  reducedMotion: boolean;
  visited: readonly string[];
  onOpenRegion: (id: string) => void;
  onReady: () => void;
};

export default function WorldScene({ reducedMotion, visited, onOpenRegion, onReady }: Props) {
  const [lang] = useLang();
  const [hovered, setHovered] = useState(false);
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

  return (
    <div className="absolute inset-0" ref={shell} data-box={box}>
      <Canvas
        shadows
        dpr={[1, 1.25]}
        gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
        camera={{
          position: reducedMotion ? END.toArray() : START.toArray(),
          fov: 40,
          near: 0.1,
          far: 200,
        }}
        onCreated={({ gl }) => {
          gl.toneMapping = THREE.ACESFilmicToneMapping;
          gl.toneMappingExposure = 1.05;
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
            onOpen={() => onOpenRegion("about")}
            hovered={hovered}
            setHovered={setHovered}
            revealed={true}
          />
          {REGIONS_3D.map((r) => (
            <RegionIsland
              key={r.id}
              data={r}
              unlocked={isUnlocked(r.id, visited)}
              reducedMotion={reducedMotion}
              onOpen={() => onOpenRegion(r.id)}
              onHover={setHovered}
            />
          ))}
          <SteppingRocks />
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
          enablePan={false}
          enableDamping
          dampingFactor={0.08}
          minDistance={8}
          maxDistance={42}
          minPolarAngle={0.35}
          maxPolarAngle={1.42}
          rotateSpeed={0.6}
          zoomSpeed={0.7}
          target={TARGET.toArray()}
        />
        <CameraRig reducedMotion={reducedMotion} />
        <LabelProjector targets={labels} reducedMotion={reducedMotion} />
      </Canvas>
      <div className="pointer-events-none absolute inset-0 overflow-hidden" data-tags={tags.length}>
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
    </div>
  );
}
