/**
 * Tiny Maze — the 3D world for Chapter 01.
 *
 * Everything here is generated geometry (the rest of Jenia's World works the
 * same way), so no asset can fail to load and leave a hole in the maze.
 *
 * Movement is continuous, not tile-based: `Player` integrates a damped
 * velocity, resolves a circle against hedge AABBs, and writes its position to
 * a shared Vector3. `MazeCamera` reads that same Vector3, which is why the
 * camera can follow without a single React re-render per frame.
 */

import { useEffect, useLayoutEffect, useMemo, useRef, type MutableRefObject } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { CollieBody } from "@/components/world/collie";
import {
  Bush,
  Flower,
  GrassTuft,
  Label,
  PALETTE,
  RoundedBox,
  Star,
  Tree,
  WoodSign,
} from "@/components/fun/scene/shared";
import type { Lang } from "@/lib/i18n";
import {
  bi,
  CELL,
  INTERACT_RANGE,
  MOVE_SPEED,
  SHIFT_BOOST,
  PLAYER_RADIUS,
  worldToCell,
  yawForDir,
  type Bi,
  type LevelDef,
  type MazePlan,
  type Pt,
  type Wall,
} from "./levels";

export type MazeRuntime = {
  player: MutableRefObject<THREE.Vector3>;
  keys: MutableRefObject<Set<string>>;
  joystick: MutableRefObject<{ x: number; y: number }>;
  explored: MutableRefObject<Set<string>>;
};

export type MazeStats = {
  stars: boolean[];
  chest: boolean;
  dirs: number[];
  solved: boolean;
};

export type MazeEvent = { type: "star"; index: number } | { type: "exit" };

export type MazeSceneProps = {
  level: LevelDef;
  plan: MazePlan;
  runtime: MazeRuntime;
  stats: MazeStats;
  reducedMotion: boolean;
  paused: boolean;
  lang: Lang;
  /** Incremented on every replay so a fresh run clears one-shot pickups. */
  runKey: number;
  onEvent: (event: MazeEvent) => void;
  onNearby: (id: string | null) => void;
};

const clamp = (n: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, n));

/* ---------------------------------------------------------------- camera */

function MazeCamera({ runtime, reducedMotion }: { runtime: MazeRuntime; reducedMotion: boolean }) {
  const { camera } = useThree();
  const look = useRef(new THREE.Vector3(0, 0.42, 0));

  useFrame((_, dt) => {
    const p = runtime.player.current;
    const step = Math.min(dt, 0.05);
    if (reducedMotion) {
      camera.position.set(p.x, 8.7, p.z + 9.3);
      look.current.set(p.x, 0.42, p.z);
    } else {
      camera.position.x = THREE.MathUtils.damp(camera.position.x, p.x, 3.1, step);
      camera.position.y = THREE.MathUtils.damp(camera.position.y, 8.7, 3.1, step);
      camera.position.z = THREE.MathUtils.damp(camera.position.z, p.z + 9.3, 3.1, step);
      look.current.x = THREE.MathUtils.damp(look.current.x, p.x, 3.4, step);
      look.current.z = THREE.MathUtils.damp(look.current.z, p.z, 3.4, step);
    }
    camera.lookAt(look.current);
  });
  return null;
}

/* ------------------------------------------------------------ collisions */

/** Push a circle out of every nearby AABB. Two passes settle corner cases. */
function resolveCollisions(p: THREE.Vector3, walls: Wall[], r: number) {
  for (let pass = 0; pass < 2; pass++) {
    for (const w of walls) {
      if (p.x < w.minX - r || p.x > w.maxX + r || p.z < w.minZ - r || p.z > w.maxZ + r) continue;
      const cx = clamp(p.x, w.minX, w.maxX);
      const cz = clamp(p.z, w.minZ, w.maxZ);
      const ddx = p.x - cx;
      const ddz = p.z - cz;
      const d2 = ddx * ddx + ddz * ddz;
      if (d2 >= r * r) continue;
      if (d2 > 1e-9) {
        const d = Math.sqrt(d2);
        const push = r - d;
        p.x += (ddx / d) * push;
        p.z += (ddz / d) * push;
      } else {
        // Centre is inside the box: leave through the nearest face.
        const left = p.x - w.minX;
        const right = w.maxX - p.x;
        const up = p.z - w.minZ;
        const down = w.maxZ - p.z;
        const m = Math.min(left, right, up, down);
        if (m === left) p.x = w.minX - r;
        else if (m === right) p.x = w.maxX + r;
        else if (m === up) p.z = w.minZ - r;
        else p.z = w.maxZ + r;
      }
    }
  }
}

/* ---------------------------------------------------------------- hedges */

function Hedges({ plan, level }: { plan: MazePlan; level: LevelDef }) {
  const box = useRef<THREE.InstancedMesh>(null);
  const top = useRef<THREE.InstancedMesh>(null);
  const cells = plan.hedgeCells;
  const hiddenKeys = useMemo(() => new Set(plan.hidden.map((c) => `${c.row},${c.col}`)), [plan.hidden]);

  const boxGeo = useMemo(() => new THREE.BoxGeometry(CELL * 0.98, 0.74, CELL * 0.98), []);
  const topGeo = useMemo(() => new THREE.SphereGeometry(0.5, 10, 8), []);
  const boxMat = useMemo(
    () => new THREE.MeshStandardMaterial({ color: level.theme.hedge, roughness: 0.96 }),
    [level.theme.hedge],
  );
  const topMat = useMemo(
    () => new THREE.MeshStandardMaterial({ color: level.theme.hedgeTop, roughness: 0.97 }),
    [level.theme.hedgeTop],
  );

  useLayoutEffect(() => {
    const dummy = new THREE.Object3D();
    const plain = new THREE.Color("#ffffff");
    const secret = new THREE.Color("#efe0b6");
    cells.forEach((c, i) => {
      dummy.position.set(c.x, 0.37, c.z);
      dummy.scale.set(1, 1, 1);
      dummy.rotation.set(0, 0, 0);
      dummy.updateMatrix();
      box.current?.setMatrixAt(i, dummy.matrix);
      box.current?.setColorAt(i, hiddenKeys.has(`${c.row},${c.col}`) ? secret : plain);

      dummy.position.set(c.x, 0.74, c.z);
      dummy.scale.set(CELL * 0.98, 0.3, CELL * 0.98);
      dummy.updateMatrix();
      top.current?.setMatrixAt(i, dummy.matrix);
    });
    for (const mesh of [box.current, top.current]) {
      if (!mesh) continue;
      mesh.instanceMatrix.needsUpdate = true;
      mesh.computeBoundingSphere();
    }
    if (box.current?.instanceColor) box.current.instanceColor.needsUpdate = true;
  }, [cells, hiddenKeys]);

  return (
    <>
      <instancedMesh ref={box} args={[boxGeo, boxMat, cells.length]} castShadow receiveShadow />
      <instancedMesh ref={top} args={[topGeo, topMat, cells.length]} castShadow />
      {/* one quiet firefly over the secret gap — a hint, not an arrow */}
      {plan.hidden.map((c) => (
        <mesh key={`${c.row},${c.col}`} position={[c.x, 1.02, c.z]}>
          <sphereGeometry args={[0.035, 8, 6]} />
          <meshStandardMaterial color={PALETTE.goldLight} emissive="#ffd98a" emissiveIntensity={0.8} />
        </mesh>
      ))}
    </>
  );
}

/* ------------------------------------------------------------- props / set */

/** A recognizable bloom per flower type, sitting on the turning head. */
function FlowerHead({ index }: { index: number }) {
  if (index === 1) {
    // Daisy — white petals around a gold centre.
    const petals = Array.from({ length: 8 }, (_, i) => {
      const a = (i / 8) * Math.PI * 2;
      return { x: Math.cos(a) * 0.17, z: Math.sin(a) * 0.17, a };
    });
    return (
      <group>
        {petals.map((p, i) => (
          <mesh key={i} position={[p.x, 0, p.z]} rotation={[Math.PI / 2, 0, -p.a]} castShadow>
            <sphereGeometry args={[0.082, 10, 8]} />
            <meshStandardMaterial color="#fbf7ee" roughness={0.85} />
          </mesh>
        ))}
        <mesh castShadow>
          <sphereGeometry args={[0.11, 14, 12]} />
          <meshStandardMaterial color="#e7b53c" roughness={0.8} />
        </mesh>
      </group>
    );
  }
  if (index === 2) {
    // Tulip — a cupped bloom with three soft lobes.
    return (
      <group>
        <mesh position={[0, 0.02, 0]} castShadow>
          <cylinderGeometry args={[0.14, 0.1, 0.3, 14]} />
          <meshStandardMaterial color="#e98aa6" roughness={0.78} />
        </mesh>
        {[-0.07, 0, 0.07].map((x, i) => (
          <mesh key={i} position={[x, 0.17, (i - 1) * 0.03]} rotation={[0, 0, (i - 1) * 0.22]} castShadow>
            <sphereGeometry args={[0.075, 10, 8]} />
            <meshStandardMaterial color="#f2a6bd" roughness={0.78} />
          </mesh>
        ))}
      </group>
    );
  }
  // Rose — a rounded red bloom with a hint of ruffled petals.
  return (
    <group>
      <mesh castShadow>
        <sphereGeometry args={[0.17, 16, 14]} />
        <meshStandardMaterial color="#e0627f" roughness={0.76} />
      </mesh>
      <mesh scale={[1.18, 0.72, 1.18]}>
        <torusGeometry args={[0.11, 0.05, 10, 20]} />
        <meshStandardMaterial color="#cf5572" roughness={0.8} />
      </mesh>
      <mesh position={[0, 0.04, 0]} scale={[0.7, 0.5, 0.7]}>
        <torusGeometry args={[0.1, 0.045, 10, 20]} />
        <meshStandardMaterial color="#d96a86" roughness={0.8} />
      </mesh>
    </group>
  );
}

function Statue({
  p,
  dir,
  index,
  flower,
  lang,
  reducedMotion,
}: {
  p: Pt;
  dir: number;
  index: number;
  flower: Bi;
  lang: Lang;
  reducedMotion: boolean;
}) {
  const spin = useRef<THREE.Group>(null);
  useFrame((_, dt) => {
    if (!spin.current) return;
    const target = yawForDir(dir);
    const cur = spin.current.rotation.y;
    const delta = Math.atan2(Math.sin(target - cur), Math.cos(target - cur));
    spin.current.rotation.y = reducedMotion ? target : cur + delta * Math.min(1, dt * 7);
  });
  return (
    <group position={[p[0], 0, p[1]]}>
      {/* planted stone base so it reads as an installed statue, not a hedge */}
      <mesh position={[0, 0.03, 0]} receiveShadow castShadow>
        <cylinderGeometry args={[0.36, 0.42, 0.07, 18]} />
        <meshStandardMaterial color={PALETTE.stone} roughness={0.95} />
      </mesh>
      {/* pedestal column */}
      <mesh position={[0, 0.34, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[0.22, 0.3, 0.64, 16]} />
        <meshStandardMaterial color="#bdb9a8" roughness={0.92} />
      </mesh>
      {/* collar */}
      <mesh position={[0, 0.69, 0]} castShadow>
        <cylinderGeometry args={[0.27, 0.27, 0.09, 16]} />
        <meshStandardMaterial color={PALETTE.cream} roughness={0.9} />
      </mesh>

      {/* the flower head, turning to face its assigned direction */}
      <group ref={spin} position={[0, 0.86, 0]}>
        <FlowerHead index={index} />
        {/* gold pointer: +z is the way the flower faces */}
        <mesh position={[0, -0.16, 0.32]} rotation={[Math.PI / 2, 0, 0]} castShadow>
          <coneGeometry args={[0.07, 0.28, 10]} />
          <meshStandardMaterial color={PALETTE.gold} metalness={0.5} roughness={0.35} />
        </mesh>
      </group>

      {/* a floating name, readable from the follow camera, so the player knows
          which flower this statue is */}
      <group position={[0, 1.5, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <Label text={bi(lang, flower)} width={1.3} height={0.28} size={48} color="#6b5a3e" />
      </group>
    </group>
  );
}

function Gate({ p, solved, reducedMotion }: { p: Pt; solved: boolean; reducedMotion: boolean }) {
  const g = useRef<THREE.Group>(null);
  const glow = useRef<THREE.MeshStandardMaterial>(null);
  useFrame(({ clock }, dt) => {
    if (!g.current) return;
    const target = solved ? -1.35 : 0;
    g.current.position.y = reducedMotion
      ? target
      : THREE.MathUtils.damp(g.current.position.y, target, 3.2, Math.min(dt, 0.05));
    if (glow.current && !reducedMotion) {
      glow.current.emissiveIntensity = (solved ? 1.15 : 0.35) + Math.sin(clock.elapsedTime * 2.4) * 0.12;
    }
  });
  return (
    <group position={[p[0], 0, p[1]]}>
      <group ref={g}>
        <RoundedBox args={[CELL * 0.98, 0.92, CELL * 0.5]} radius={0.1} smoothness={3} castShadow>
          <meshStandardMaterial color={PALETTE.woodLight} roughness={0.86} />
        </RoundedBox>
        {[-0.32, 0.32].map((x) => (
          <mesh key={x} position={[x, 0, CELL * 0.26]}>
            <boxGeometry args={[0.05, 0.78, 0.04]} />
            <meshStandardMaterial color={PALETTE.gold} metalness={0.4} roughness={0.45} />
          </mesh>
        ))}
        <mesh position={[0, 0.18, CELL * 0.26]}>
          <sphereGeometry args={[0.055, 10, 8]} />
          <meshStandardMaterial color={PALETTE.goldLight} metalness={0.5} roughness={0.35} />
        </mesh>
      </group>
      {solved && (
        <mesh position={[0, 0.05, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0.32, 0.46, 24]} />
          <meshStandardMaterial
            ref={glow}
            color={PALETTE.goldLight}
            emissive="#ffd98a"
            emissiveIntensity={1}
            side={THREE.DoubleSide}
            transparent
            opacity={0.75}
          />
        </mesh>
      )}
    </group>
  );
}

function ExitArch({ p, reducedMotion }: { p: Pt; reducedMotion: boolean }) {
  const ring = useRef<THREE.Group>(null);
  useFrame((_, dt) => {
    if (ring.current && !reducedMotion) ring.current.rotation.y += dt * 0.7;
  });
  return (
    <group position={[p[0], 0, p[1]]}>
      {[-0.42, 0.42].map((x) => (
        <mesh key={x} position={[x, 0.62, 0]} castShadow>
          <cylinderGeometry args={[0.065, 0.075, 1.24, 8]} />
          <meshStandardMaterial color={PALETTE.wood} roughness={0.9} />
        </mesh>
      ))}
      <mesh position={[0, 1.26, 0]} castShadow>
        <boxGeometry args={[1.02, 0.12, 0.14]} />
        <meshStandardMaterial color={PALETTE.woodLight} roughness={0.88} />
      </mesh>
      <group ref={ring} position={[0, 0.72, 0]}>
        <mesh>
          <torusGeometry args={[0.26, 0.028, 8, 24]} />
          <meshStandardMaterial color={PALETTE.goldLight} emissive="#ffd98a" emissiveIntensity={0.7} />
        </mesh>
      </group>
      <group position={[0, 1.55, 0]}>
        <WoodSign text="EXIT" width={0.9} post={false} />
      </group>
    </group>
  );
}

function CollectStar({ p, seed, reducedMotion }: { p: Pt; seed: number; reducedMotion: boolean }) {
  const g = useRef<THREE.Group>(null);
  useFrame(({ clock }, dt) => {
    if (!g.current || reducedMotion) return;
    g.current.rotation.y += dt * 1.7;
    g.current.position.y = 0.62 + Math.sin(clock.elapsedTime * 2.1 + seed) * 0.09;
  });
  return (
    <group ref={g} position={[p[0], 0.62, p[1]]}>
      <Star scale={1.25} emissive={0.85} />
      <pointLight color="#ffd98a" intensity={0.35} distance={2.2} />
    </group>
  );
}

function Chest({ p, opened, reducedMotion }: { p: Pt; opened: boolean; reducedMotion: boolean }) {
  const lid = useRef<THREE.Group>(null);
  useFrame((_, dt) => {
    if (!lid.current) return;
    const target = opened ? -1.15 : 0;
    lid.current.rotation.x = reducedMotion
      ? target
      : THREE.MathUtils.damp(lid.current.rotation.x, target, 5, Math.min(dt, 0.05));
  });
  return (
    <group position={[p[0], 0, p[1]]}>
      <RoundedBox args={[0.44, 0.26, 0.32]} radius={0.05} smoothness={3} position={[0, 0.14, 0]} castShadow>
        <meshStandardMaterial color={PALETTE.wood} roughness={0.88} />
      </RoundedBox>
      <group ref={lid} position={[0, 0.27, -0.16]}>
        <RoundedBox args={[0.44, 0.1, 0.32]} radius={0.04} smoothness={3} position={[0, 0.05, 0.16]} castShadow>
          <meshStandardMaterial color={PALETTE.woodDark} roughness={0.85} />
        </RoundedBox>
      </group>
      <mesh position={[0, 0.15, 0.165]}>
        <boxGeometry args={[0.07, 0.14, 0.02]} />
        <meshStandardMaterial color={PALETTE.gold} metalness={0.5} roughness={0.4} />
      </mesh>
      {opened && <Star position={[0, 0.55, 0]} scale={0.85} emissive={1} />}
    </group>
  );
}

function GardenWorld({
  level,
  plan,
  stats,
  reducedMotion,
  lang,
}: {
  level: LevelDef;
  plan: MazePlan;
  stats: MazeStats;
  reducedMotion: boolean;
  lang: Lang;
}) {
  const w = plan.cols * CELL;
  const d = plan.rows * CELL;
  const decorations = useMemo(
    () =>
      plan.openCells.filter((_, i) => i % 5 === 2).slice(0, 26).map((c, i) => ({
        x: c.x + (i % 3 === 0 ? 0.33 : -0.33),
        z: c.z + (i % 2 === 0 ? 0.31 : -0.31),
        i,
      })),
    [plan.openCells],
  );

  return (
    <group>
      {/* soft grass all around, then the cream stone paths of the garden */}
      <mesh position={[0, -0.24, 0]} receiveShadow>
        <boxGeometry args={[w + 12, 0.2, d + 12]} />
        <meshStandardMaterial color={PALETTE.grass} roughness={1} />
      </mesh>
      <mesh position={[0, -0.08, 0]} receiveShadow>
        <boxGeometry args={[w + 0.5, 0.16, d + 0.5]} />
        <meshStandardMaterial color={level.theme.ground} roughness={1} />
      </mesh>

      <Hedges plan={plan} level={level} />

      {decorations.map((f) => (
        <group key={f.i} position={[f.x, 0, f.z]}>
          {f.i % 3 === 0 ? <Flower /> : f.i % 3 === 1 ? <GrassTuft /> : <Bush scale={0.7} />}
        </group>
      ))}
      {[
        [-w / 2 - 1.1, -d / 2 - 0.9],
        [w / 2 + 1.1, -d / 2 - 0.9],
        [-w / 2 - 1.1, d / 2 + 0.9],
        [w / 2 + 1.1, d / 2 + 0.9],
      ].map(([x, z], i) => (
        <Tree key={i} position={[x!, -0.12, z!]} scale={1.25} reducedMotion={reducedMotion} />
      ))}

      {/* a wooden arch at the entrance */}
      <group position={[plan.start[0] - 0.35, 0, plan.start[1]]}>
        {[-0.42, 0.42].map((x) => (
          <mesh key={x} position={[x, 0.65, 0]} castShadow>
            <cylinderGeometry args={[0.055, 0.07, 1.3, 8]} />
            <meshStandardMaterial color={PALETTE.wood} roughness={0.9} />
          </mesh>
        ))}
        <mesh position={[0, 1.32, 0]} castShadow>
          <boxGeometry args={[1.0, 0.1, 0.12]} />
          <meshStandardMaterial color={PALETTE.woodLight} roughness={0.88} />
        </mesh>
      </group>

      {plan.sign && (
        <group position={[plan.sign[0], 0.55, plan.sign[1]]}>
          <WoodSign text={lang === "zh" ? "提示" : "CLUE"} width={1.35} />
          {/* a glowing beacon so the sign is easy to spot across the garden */}
          <mesh position={[0, 1.05, 0]}>
            <sphereGeometry args={[0.07, 12, 10]} />
            <meshStandardMaterial color={PALETTE.goldLight} emissive="#ffd98a" emissiveIntensity={1} />
          </mesh>
          <pointLight position={[0, 1.2, 0]} color="#ffdca0" intensity={0.5} distance={3.5} />
        </group>
      )}
      <group position={[0, 0.02, plan.rows * CELL * 0.36]} rotation={[-Math.PI / 2, 0, 0]}>
        <Label text="A LITTLE MAZE, A LITTLE MYSTERY" width={4.2} height={0.32} size={44} color="#9a8a68" />
      </group>

      {plan.statues.map((p, i) => (
        <Statue
          key={i}
          p={p}
          dir={stats.dirs[i] ?? level.initialDirs[i] ?? 0}
          index={i}
          flower={level.flowers[i] ?? { en: "Flower", zh: "花" }}
          lang={lang}
          reducedMotion={reducedMotion}
        />
      ))}
      {plan.gate && <Gate p={plan.gate} solved={stats.solved} reducedMotion={reducedMotion} />}
      {plan.exit && <ExitArch p={plan.exit} reducedMotion={reducedMotion} />}
      {plan.stars.map((p, i) =>
        stats.stars[i] ? null : <CollectStar key={i} p={p} seed={i * 1.7} reducedMotion={reducedMotion} />,
      )}
      {plan.chest && <Chest p={plan.chest} opened={stats.chest} reducedMotion={reducedMotion} />}
    </group>
  );
}

/* ---------------------------------------------------------------- player */

function Player({
  plan,
  walls,
  runtime,
  stats,
  paused,
  reducedMotion,
  runKey,
  onEvent,
  onNearby,
}: {
  plan: MazePlan;
  walls: Wall[];
  runtime: MazeRuntime;
  stats: MazeStats;
  paused: boolean;
  reducedMotion: boolean;
  runKey: number;
  onEvent: (event: MazeEvent) => void;
  onNearby: (id: string | null) => void;
}) {
  const root = useRef<THREE.Group>(null);
  const body = useRef<THREE.Group>(null);
  const head = useRef<THREE.Group>(null);
  const tail = useRef<THREE.Group>(null);
  const legs = useRef<(THREE.Group | null)[]>([null, null, null, null]);
  const vel = useRef(new THREE.Vector3());
  const yaw = useRef(0);
  const trot = useRef(0);
  const bump = useRef(0);
  const nearbyId = useRef<string | null>(null);
  const picked = useRef(new Set<number>());
  const exitFired = useRef(false);

  // Keep callbacks fresh without re-registering the frame loop.
  const events = useRef(onEvent);
  events.current = onEvent;
  const nearCb = useRef(onNearby);
  nearCb.current = onNearby;
  const statsRef = useRef(stats);
  statsRef.current = stats;

  useEffect(() => {
    runtime.player.current.set(plan.start[0], 0, plan.start[1]);
    root.current?.position.set(plan.start[0], 0, plan.start[1]);
    vel.current.set(0, 0, 0);
    picked.current.clear();
    exitFired.current = false;
    nearbyId.current = null;
    nearCb.current(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [plan, runKey]);

  useFrame(({ clock }, dt) => {
    const g = root.current;
    if (!g) return;
    const step = Math.min(dt, 0.05);
    const t = clock.elapsedTime;
    const s = statsRef.current;
    const keys = runtime.keys.current;
    const j = runtime.joystick.current;

    let dx = 0;
    let dz = 0;
    if (!paused) {
      if (keys.has("w") || keys.has("arrowup")) dz -= 1;
      if (keys.has("s") || keys.has("arrowdown")) dz += 1;
      if (keys.has("a") || keys.has("arrowleft")) dx -= 1;
      if (keys.has("d") || keys.has("arrowright")) dx += 1;
      dx += j.x;
      dz += j.y;
      const len = Math.hypot(dx, dz);
      if (len > 1) {
        dx /= len;
        dz /= len;
      }
    }

    // Hold Shift to let the princess hurry — a gentle boost, not a sprint.
    const boost = keys.has("shift") ? SHIFT_BOOST : 1;
    vel.current.x = THREE.MathUtils.damp(vel.current.x, dx * MOVE_SPEED * boost, 9, step);
    vel.current.z = THREE.MathUtils.damp(vel.current.z, dz * MOVE_SPEED * boost, 9, step);

    const moveLen = Math.hypot(dx, dz);
    let turnScale = 1;
    if (moveLen > 0.02) {
      const wantYaw = Math.atan2(dx, dz);
      const diff = Math.atan2(Math.sin(wantYaw - yaw.current), Math.cos(wantYaw - yaw.current));
      // She turns first, then starts moving — no instant snapping.
      turnScale = Math.max(0.22, 1 - (Math.abs(diff) / Math.PI) * 1.7);
      yaw.current += diff * Math.min(1, step * 9);
      trot.current += step * (7 + Math.hypot(vel.current.x, vel.current.z) * 2.4);
    }
    g.rotation.y = yaw.current;

    const pos = runtime.player.current;
    const prevX = pos.x;
    const prevZ = pos.z;
    pos.x += vel.current.x * step * turnScale;
    pos.z += vel.current.z * step * turnScale;
    resolveCollisions(pos, walls, PLAYER_RADIUS);
    if (moveLen > 0.15 && Math.hypot(pos.x - prevX, pos.z - prevZ) < 0.002) bump.current = 0.4;
    bump.current = Math.max(0, bump.current - step);
    g.position.set(pos.x, 0, pos.z);

    // Fog of war: the 3x3 patch around her counts as seen.
    const [r, c] = worldToCell(pos.x, pos.z, plan.rows, plan.cols);
    for (let dr = -1; dr <= 1; dr++) {
      for (let dc = -1; dc <= 1; dc++) {
        const rr = r + dr;
        const cc = c + dc;
        if (rr < 0 || cc < 0 || rr >= plan.rows || cc >= plan.cols) continue;
        runtime.explored.current.add(`${rr},${cc}`);
      }
    }

    // ---- animation -----------------------------------------------------
    if (body.current) body.current.position.y = reducedMotion ? 0 : Math.sin(t * 2.1) * 0.006;
    const speed = Math.hypot(vel.current.x, vel.current.z);
    const running = speed > 0.12;
    for (let i = 0; i < 4; i++) {
      const leg = legs.current[i];
      if (!leg) continue;
      const swing = running && !reducedMotion ? Math.sin(trot.current + (i === 0 || i === 3 ? 0 : Math.PI)) * 0.5 : 0;
      leg.rotation.x = THREE.MathUtils.damp(leg.rotation.x, swing, 12, step);
    }
    if (head.current) {
      head.current.rotation.x = THREE.MathUtils.damp(head.current.rotation.x, bump.current > 0 ? 0.2 : running ? -0.08 : 0, 7, step);
      head.current.rotation.y = reducedMotion ? 0 : Math.sin(t * 0.7) * 0.18;
    }
    if (tail.current) {
      tail.current.rotation.y = reducedMotion ? 0 : Math.sin(t * (running ? 9 : 3.4)) * (running ? 0.45 : 0.2);
    }

    // ---- pickups -------------------------------------------------------
    plan.stars.forEach((p, i) => {
      if (s.stars[i] || picked.current.has(i)) return;
      if (Math.hypot(pos.x - p[0], pos.z - p[1]) < 0.55) {
        picked.current.add(i);
        events.current({ type: "star", index: i });
      }
    });

    // ---- nearest interactable -----------------------------------------
    let best: string | null = null;
    let bestD = INTERACT_RANGE;
    const consider = (id: string, p: Pt | null) => {
      if (!p) return;
      const d = Math.hypot(pos.x - p[0], pos.z - p[1]);
      if (d < bestD) {
        bestD = d;
        best = id;
      }
    };
    plan.statues.forEach((p, i) => consider(`statue-${i}`, p));
    consider("sign", plan.sign);
    if (!s.chest) consider("chest", plan.chest);
    if (s.solved) consider("exit", plan.exit);
    if (best !== nearbyId.current) {
      nearbyId.current = best;
      nearCb.current(best);
    }

    // ---- exit ----------------------------------------------------------
    if (s.solved && plan.exit && !exitFired.current && Math.hypot(pos.x - plan.exit[0], pos.z - plan.exit[1]) < 0.9) {
      exitFired.current = true;
      events.current({ type: "exit" });
    }
    if (s.solved && plan.exit) {
      const d = Math.hypot(pos.x - plan.exit[0], pos.z - plan.exit[1]);
      if (d < 1.3) console.error("TMDBG " + JSON.stringify({ d: +d.toFixed(2), fired: exitFired.current, near: nearbyId.current }));
    }
  });

  return (
    <group ref={root} position={[plan.start[0], 0, plan.start[1]]} scale={1.65} name="maze-princess">
      <CollieBody body={body} head={head} tail={tail} legs={legs} />
      {/* a small soft-blue backpack, clearly strapped to her back — not a seat */}
      <group position={[0, 0.27, -0.05]} rotation={[0.55, 0, 0]}>
        <RoundedBox args={[0.11, 0.1, 0.055]} radius={0.028} smoothness={3} castShadow>
          <meshStandardMaterial color="#9fc4dd" roughness={0.85} />
        </RoundedBox>
        {[0.046, -0.046].map((x) => (
          <mesh key={x} position={[x, 0.04, 0.055]} rotation={[0, 0, x > 0 ? 0.18 : -0.18]}>
            <boxGeometry args={[0.016, 0.15, 0.018]} />
            <meshStandardMaterial color="#7fa8c4" roughness={0.9} />
          </mesh>
        ))}
      </group>
    </group>
  );
}

/* ------------------------------------------------------------------ scene */

export function MazeScene({
  level,
  plan,
  runtime,
  stats,
  reducedMotion,
  paused,
  lang,
  runKey,
  onEvent,
  onNearby,
}: MazeSceneProps) {
  const walls = useMemo<Wall[]>(
    () => (stats.solved || !plan.gateWall ? plan.walls : [...plan.walls, plan.gateWall]),
    [plan, stats.solved],
  );

  return (
    <>
      <MazeCamera runtime={runtime} reducedMotion={reducedMotion} />
      <GardenWorld level={level} plan={plan} stats={stats} reducedMotion={reducedMotion} lang={lang} />
      <Player
        plan={plan}
        walls={walls}
        runtime={runtime}
        stats={stats}
        paused={paused}
        reducedMotion={reducedMotion}
        runKey={runKey}
        onEvent={onEvent}
        onNearby={onNearby}
      />
    </>
  );
}
