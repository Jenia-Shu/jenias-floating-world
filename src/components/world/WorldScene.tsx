import type React from "react";
import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Environment, Lightformer, OrbitControls } from "@react-three/drei";
import * as THREE from "three";
import type { OrbitControls as OrbitControlsImpl } from "three-stdlib";
import { Island } from "./Island";
import { MainIsland } from "./MainIsland";
import { Cloud, LockMarker, Rock, Tree } from "./details";
import { surfaceHeight, type IslandShape } from "@/lib/world/terrain";

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
  const scene = useThree((s) => s.scene);
  useEffect(() => {
    if (import.meta.env.DEV) (window as unknown as { __scene?: THREE.Scene }).__scene = scene;
  }, [scene]);
  useFrame(() => {
    if (!done.current) {
      done.current = true;
      requestAnimationFrame(onReady);
    }
  });
  return null;
}

type Locked = {
  name: string;
  pos: [number, number, number];
  shape: IslandShape;
  phase: number;
  trees: [number, number, number][];
};

const LOCKED: Locked[] = [
  {
    name: "Locked",
    pos: [-11, -1.6, -5],
    phase: 1.4,
    shape: { radius: 2.6, height: 0.45, depth: 2.6, seed: 4.2, bump: 0.08 },
    trees: [
      [-0.8, 0.3, 0.9],
      [0.6, -0.7, 0.75],
      [0.2, 0.9, 0.65],
    ],
  },
  {
    name: "Locked",
    pos: [8.5, 1.4, -10],
    phase: 2.6,
    shape: { radius: 2.2, height: 0.4, depth: 2.3, seed: 7.7, bump: 0.08 },
    trees: [
      [-0.5, -0.4, 0.8],
      [0.7, 0.3, 0.6],
    ],
  },
  {
    name: "Locked",
    pos: [-6.5, -3.4, 8.5],
    phase: 3.9,
    shape: { radius: 2.0, height: 0.4, depth: 2.1, seed: 2.9, bump: 0.07 },
    trees: [[0.6, -0.3, 0.7]],
  },
  {
    name: "Locked",
    pos: [12.5, -2.6, 3],
    phase: 5.1,
    shape: { radius: 1.7, height: 0.35, depth: 1.9, seed: 9.4, bump: 0.06 },
    trees: [[-0.3, 0.4, 0.6]],
  },
];

function LockedIsland({ data, reducedMotion }: { data: Locked; reducedMotion: boolean }) {
  const h = (x: number, z: number) => surfaceHeight(x, z, data.shape);
  return (
    <Island
      shape={data.shape}
      position={data.pos}
      grass="#b4c3ad"
      muted
      bobPhase={data.phase}
      reducedMotion={reducedMotion}
    >
      {data.trees.map(([x, z, s], i) => (
        <Tree key={i} position={[x, h(x, z) - 0.02, z]} scale={s} variant={i + 2} muted />
      ))}
      <Rock position={[-0.4, h(-0.4, -0.9), -0.9]} scale={0.18} rot={1} />
      <Rock position={[0.9, h(0.9, 0.8), 0.8]} scale={0.12} rot={2} />
      <LockMarker position={[0, h(0, 0) + 1.25, 0]} />
    </Island>
  );
}

/** Little floating stepping rocks linking the archipelago. */
function SteppingRocks() {
  const pts = useMemo(() => {
    const out: { p: [number, number, number]; s: number }[] = [];
    LOCKED.forEach((l, li) => {
      for (let i = 1; i <= 3; i++) {
        const t = 0.32 + i * 0.12;
        out.push({
          p: [l.pos[0] * t, l.pos[1] * t - 0.9 + Math.sin(i + li) * 0.3, l.pos[2] * t],
          s: 0.22 - i * 0.03,
        });
      }
    });
    return out;
  }, []);
  return (
    <>
      {pts.map((r, i) => (
        <Rock key={i} position={r.p} scale={r.s} rot={i} />
      ))}
    </>
  );
}

type Props = { reducedMotion: boolean; onOpenAbout: () => void; onReady: () => void };

export default function WorldScene({ reducedMotion, onOpenAbout, onReady }: Props) {
  const [hovered, setHovered] = useState(false);
  const labels = useRef<LabelTarget[]>([
    { el: null, world: new THREE.Vector3(0, 3, 0), bob: 0 },
    ...LOCKED.map((l) => ({
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

  return (
    <div className="absolute inset-0">
      <Canvas
        shadows
        dpr={[1, 1.75]}
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
        <Environment resolution={128}>
          <Lightformer
            intensity={1.2}
            position={[0, 6, 0]}
            rotation-x={Math.PI / 2}
            scale={[12, 12, 1]}
            color="#f4f1ea"
          />
          <Lightformer
            intensity={0.6}
            color="#bcd6e3"
            position={[-6, 1, -2]}
            rotation-y={Math.PI / 2}
            scale={[20, 2, 1]}
          />
          <Lightformer
            intensity={0.5}
            color="#f1e2c0"
            position={[6, 2, 3]}
            rotation-y={-Math.PI / 2}
            scale={[20, 2, 1]}
          />
        </Environment>

        <Suspense fallback={null}>
          <MainIsland
            reducedMotion={reducedMotion}
            onOpen={onOpenAbout}
            hovered={hovered}
            setHovered={setHovered}
          />
          {LOCKED.map((l, i) => (
            <LockedIsland key={i} data={l} reducedMotion={reducedMotion} />
          ))}
          <SteppingRocks />
          <Cloud position={[-14, 6, -16]} scale={2.2} speed={0.04} reducedMotion={reducedMotion} />
          <Cloud position={[16, 8, -20]} scale={2.8} speed={0.03} reducedMotion={reducedMotion} />
          <Cloud position={[2, -7, -14]} scale={2} speed={0.05} reducedMotion={reducedMotion} />
          <Cloud position={[-18, -4, 10]} scale={2.4} speed={0.035} reducedMotion={reducedMotion} />
          <ReadySignal onReady={onReady} />
        </Suspense>

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
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <button
          type="button"
          ref={(el) => {
            labels.current[0]!.el = el;
          }}
          onClick={onOpenAbout}
          className="region-label region-label--active pointer-events-auto absolute left-0 top-0"
          aria-label="Open About Me"
          style={{ visibility: "hidden" }}
        >
          <span className="region-dot" aria-hidden />
          About Me
        </button>
        {LOCKED.map((l, i) => (
          <div
            key={i}
            ref={(el) => {
              labels.current[i + 1]!.el = el;
            }}
            className="region-label region-label--locked absolute left-0 top-0"
            aria-disabled="true"
            style={{ visibility: "hidden" }}
          >
            <svg
              width="11"
              height="11"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.4"
              aria-hidden
            >
              <rect x="4" y="11" width="16" height="10" rx="2" />
              <path d="M8 11V7a4 4 0 0 1 8 0v4" />
            </svg>
            {l.name}
          </div>
        ))}
      </div>
    </div>
  );
}
