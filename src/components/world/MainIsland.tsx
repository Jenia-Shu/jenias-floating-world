import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { Island } from "./Island";
import { Cottage, Flowers, Mushroom, PathStones, Rock, Tree } from "./details";
import { Grow } from "./Grow";
import { Birds, Butterflies, Ducks, Rabbits, Squirrels } from "./creatures";
import { baseHeight, shapeRadius, surfaceHeight, type IslandShape } from "@/lib/world/terrain";

const P = { x: 2.0, z: 1.4 };
const dirLen = Math.hypot(P.x, P.z);
const DIR = { x: P.x / dirLen, z: P.z / dirLen };
const BASE: IslandShape = { radius: 5, height: 0.75, depth: 4.4, seed: 1.3, bump: 0.12 };
const RIM = shapeRadius(Math.atan2(DIR.z, DIR.x), BASE) - 0.05;
const E = { x: DIR.x * RIM, z: DIR.z * RIM };

export const MAIN_SHAPE: IslandShape = {
  ...BASE,
  dips: [
    { ax: P.x, az: P.z, bx: P.x, bz: P.z, r: 1.25, depth: 0.38 },
    { ax: P.x, az: P.z, bx: E.x + DIR.x * 0.3, bz: E.z + DIR.z * 0.3, r: 0.38, depth: 0.22 },
  ],
};

const WATER_LEVEL = baseHeight(P.x, P.z, BASE) - 0.17;
const h = (x: number, z: number) => surfaceHeight(x, z, MAIN_SHAPE);

const hash = (n: number) => {
  const s = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return s - Math.floor(s);
};

// ground animals live on the meadow, clear of the pond, cottage and stone path
const RABBIT_SPOTS: [number, number, number][] = [
  [-2.6, 0.4, 0],
  [1.2, -1.6, 0],
  [-0.6, 3.0, 0],
];
const SQUIRREL_SPOTS: [number, number, number][] = [
  [3.5, -0.8, 0],
  [-3.2, -2.2, 0],
];

function distToSeg(x: number, z: number, a: { x: number; z: number }, b: { x: number; z: number }) {
  const vx = b.x - a.x, vz = b.z - a.z;
  const t = Math.max(0, Math.min(1, ((x - a.x) * vx + (z - a.z) * vz) / (vx * vx + vz * vz)));
  return Math.hypot(x - (a.x + vx * t), z - (a.z + vz * t));
}

function makeWaterfallTexture() {
  const c = document.createElement("canvas");
  c.width = 64;
  c.height = 256;
  const g = c.getContext("2d")!;
  g.fillStyle = "#cfe6f0";
  g.fillRect(0, 0, 64, 256);
  for (let i = 0; i < 40; i++) {
    g.fillStyle = `rgba(255,255,255,${0.35 + hash(i) * 0.5})`;
    g.fillRect(hash(i + 3) * 60, hash(i + 7) * 256, 2 + hash(i + 1) * 5, 20 + hash(i + 9) * 60);
  }
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  return t;
}

function StreamAndFall({ reducedMotion }: { reducedMotion?: boolean | undefined }) {
  const tex = useMemo(makeWaterfallTexture, []);
  const streamGeo = useMemo(() => {
    const steps = 16;
    const perp = { x: -DIR.z, z: DIR.x };
    const verts: number[] = [];
    const idx: number[] = [];
    const start = { x: P.x + DIR.x * 0.7, z: P.z + DIR.z * 0.7 };
    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      const x = start.x + (E.x - start.x) * t;
      const z = start.z + (E.z - start.z) * t;
      const y = Math.min(WATER_LEVEL, baseHeight(x, z, BASE) - 0.13 - t * 0.05);
      verts.push(x - perp.x * 0.24, y, z - perp.z * 0.24, x + perp.x * 0.24, y, z + perp.z * 0.24);
      if (i < steps) {
        const a = i * 2;
        idx.push(a, a + 2, a + 1, a + 1, a + 2, a + 3);
      }
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.Float32BufferAttribute(verts, 3));
    g.setIndex(idx);
    g.computeVertexNormals();
    return g;
  }, []);
  const endY = Math.min(WATER_LEVEL, baseHeight(E.x, E.z, BASE) - 0.18);
  const fallH = 2.4;

  useFrame((_, dt) => {
    if (!reducedMotion) tex.offset.y += Math.min(dt, 0.05) * 0.6;
  });

  return (
    <group>
      <mesh geometry={streamGeo} receiveShadow>
        <meshStandardMaterial color="#a9d3e3" roughness={0.15} metalness={0.1} transparent opacity={0.88} />
      </mesh>
      <mesh
        position={[E.x + DIR.x * 0.12, endY - fallH / 2 + 0.05, E.z + DIR.z * 0.12]}
        rotation={[0, Math.atan2(DIR.x, DIR.z), 0]}
      >
        <planeGeometry args={[0.46, fallH]} />
        <meshStandardMaterial map={tex} transparent opacity={0.82} roughness={0.2} side={THREE.DoubleSide} />
      </mesh>
      {/* mist at the bottom of the fall */}
      <mesh position={[E.x + DIR.x * 0.15, endY - fallH, E.z + DIR.z * 0.15]}>
        <sphereGeometry args={[0.22, 16, 10]} />
        <meshStandardMaterial color="#ffffff" transparent opacity={0.3} roughness={1} />
      </mesh>
    </group>
  );
}

function Bridge() {
  const M = { x: P.x + (E.x - P.x) * 0.55, z: P.z + (E.z - P.z) * 0.55 };
  const y = baseHeight(M.x, M.z, BASE) - 0.02;
  const rotY = Math.atan2(DIR.x, DIR.z); // local x = perpendicular to stream
  const planks = Array.from({ length: 9 }, (_, i) => -0.6 + (i * 1.2) / 8);
  const arch = (x: number) => 0.16 * Math.cos((x / 0.6) * (Math.PI / 2));
  return (
    <group position={[M.x, y, M.z]} rotation={[0, rotY + Math.PI / 2, 0]}>
      {planks.map((x) => (
        <mesh key={x} position={[x, arch(x) + 0.04, 0]} rotation={[0, 0, -Math.sin((x / 0.6) * (Math.PI / 2)) * 0.25]} castShadow receiveShadow>
          <boxGeometry args={[0.13, 0.04, 0.5]} />
          <meshStandardMaterial color="#c49a74" roughness={0.85} />
        </mesh>
      ))}
      {[-0.27, 0.27].map((z) => (
        <group key={z}>
          {[-0.55, 0, 0.55].map((x) => (
            <mesh key={x} position={[x, arch(x) + 0.17, z]} castShadow>
              <cylinderGeometry args={[0.025, 0.025, 0.26, 6]} />
              <meshStandardMaterial color="#a7805f" />
            </mesh>
          ))}
          <mesh position={[0, 0.34, z]} rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.018, 0.018, 1.15, 6]} />
            <meshStandardMaterial color="#b48c69" />
          </mesh>
        </group>
      ))}
    </group>
  );
}

/** Bare-scrub rocks shown before the region has been visited. */
const BARE_ROCKS: { p: [number, number, number]; s: number; r: number }[] = [
  { p: [-1.9, 0, 0.7], s: 0.3, r: 1 },
  { p: [1.1, 0, -1.6], s: 0.22, r: 2 },
  { p: [0.3, 0, 2.3], s: 0.16, r: 3 },
  { p: [-2.6, 0, -1.5], s: 0.13, r: 0 },
  { p: [2.9, 0, 1.9], s: 0.11, r: 1 },
];

type Props = {
  reducedMotion?: boolean | undefined;
  /** Clicking the island frames it; it never opens a page by itself. */
  onSelect: () => void;
  hovered: boolean;
  setHovered: (h: boolean) => void;
  /** When false the island is bare rock; visiting About Me brings it to life. */
  revealed: boolean;
  /** A small hidden thing on the main island was found. */
  onEgg?: ((id: string) => void) | undefined;
};

export function MainIsland({ reducedMotion, onSelect, hovered, setHovered, revealed, onEgg }: Props) {
  const cottage = { x: -1.7, z: -1.1, rot: 0.55 };
  const ring = useRef<THREE.Mesh>(null);

  const layout = useMemo(() => {
    const perp = { x: -DIR.z, z: DIR.x };
    const M = { x: P.x + (E.x - P.x) * 0.55, z: P.z + (E.z - P.z) * 0.55 };
    let A = { x: M.x - perp.x * 0.85, z: M.z - perp.z * 0.85 };
    let B = { x: M.x + perp.x * 0.85, z: M.z + perp.z * 0.85 };
    if (Math.hypot(B.x - cottage.x, B.z - cottage.z) < Math.hypot(A.x - cottage.x, A.z - cottage.z)) [A, B] = [B, A];
    const door = { x: cottage.x + Math.sin(cottage.rot) * 0.75, z: cottage.z + Math.cos(cottage.rot) * 0.75 };
    const seg1 = new THREE.CatmullRomCurve3([
      new THREE.Vector3(door.x, 0, door.z),
      new THREE.Vector3(-0.6, 0, 0.9),
      new THREE.Vector3(0.6, 0, 2.0),
      new THREE.Vector3(A.x, 0, A.z),
    ]);
    const after = { x: B.x + (B.x - M.x) * 1.4, z: B.z + (B.z - M.z) * 1.4 };
    const seg2 = new THREE.CatmullRomCurve3([new THREE.Vector3(B.x, 0, B.z), new THREE.Vector3(after.x, 0, after.z)]);
    const stones: { p: [number, number, number]; s: number; r: number }[] = [];
    const pathPts: { x: number; z: number }[] = [];
    const addCurve = (curve: THREE.CatmullRomCurve3, n: number, off: number) => {
      curve.getSpacedPoints(n).forEach((v, i) => {
        const side = (hash(i + off) - 0.5) * 0.18;
        const x = v.x + side, z = v.z + side * 0.6;
        pathPts.push({ x, z });
        stones.push({ p: [x, h(x, z) + 0.01, z], s: 0.13 + hash(i + off + 50) * 0.06, r: hash(i + off) * 3 });
      });
    };
    addCurve(seg1, Math.round(seg1.getLength() / 0.3), 0);
    addCurve(seg2, Math.round(seg2.getLength() / 0.3), 100);

    const clear = (x: number, z: number, pad = 0) => {
      const R = shapeRadius(Math.atan2(z, x), BASE) * 0.86;
      if (Math.hypot(x, z) > R) return false;
      if (Math.hypot(x - P.x, z - P.z) < 1.35 + pad) return false;
      if (distToSeg(x, z, P, E) < 0.55 + pad) return false;
      if (Math.hypot(x - cottage.x, z - cottage.z) < 1.05 + pad) return false;
      return pathPts.every((p) => Math.hypot(p.x - x, p.z - z) > 0.28 + pad);
    };

    const treeSpots: [number, number, number][] = [
      [-3.3, 0.6, 1.1], [-2.9, -2.5, 1], [-0.7, -3.0, 0.9], [0.9, -2.3, 1.15], [-3.7, -1.0, 0.85],
      [1.7, -3.3, 0.8], [3.4, -1.1, 1.05], [-1.9, 2.6, 0.95], [-0.3, 3.5, 0.8], [2.6, -2.0, 0.75], [-2.4, 1.6, 0.7],
    ];
    const trees = treeSpots.filter(([x, z]) => clear(x, z, 0.05)).map(([x, z, s], i) => ({ p: [x, h(x, z) - 0.02, z] as [number, number, number], s, v: i }));

    const flowerColors = ["#f4efe2", "#e9cf8f", "#b9d3e6", "#f0d6c8", "#ffffff"];
    const flowers: { p: [number, number, number]; c: string }[] = [];
    const mushrooms: { p: [number, number, number]; cream: boolean }[] = [];
    const rocks: { p: [number, number, number]; s: number; r: number }[] = [];
    for (let i = 0; i < 900 && flowers.length < 140; i++) {
      // clustered flowers
      const cx = (hash(i * 3.1) - 0.5) * 8.5, cz = (hash(i * 7.3) - 0.5) * 8.5;
      if (!clear(cx, cz)) continue;
      for (let k = 0; k < 5; k++) {
        const x = cx + (hash(i * 11 + k) - 0.5) * 0.5, z = cz + (hash(i * 13 + k) - 0.5) * 0.5;
        if (clear(x, z)) flowers.push({ p: [x, h(x, z), z], c: flowerColors[(i + k) % flowerColors.length]! });
      }
    }
    for (let i = 0; i < 300 && mushrooms.length < 9; i++) {
      const x = (hash(i * 5.7 + 2) - 0.5) * 8, z = (hash(i * 9.1 + 4) - 0.5) * 8;
      if (clear(x, z)) mushrooms.push({ p: [x, h(x, z), z], cream: i % 3 === 0 });
    }
    // stones around the pond rim
    for (let i = 0; i < 11; i++) {
      const a = (i / 11) * Math.PI * 2 + hash(i) * 0.3;
      const x = P.x + Math.cos(a) * 1.12, z = P.z + Math.sin(a) * 1.0;
      if (distToSeg(x, z, P, E) < 0.45) continue;
      rocks.push({ p: [x, h(x, z) + 0.02, z], s: 0.1 + hash(i + 20) * 0.1, r: hash(i) * 3 });
    }
    for (let i = 0; i < 200 && rocks.length < 22; i++) {
      const x = (hash(i * 2.3 + 8) - 0.5) * 8.6, z = (hash(i * 4.9 + 1) - 0.5) * 8.6;
      if (clear(x, z)) rocks.push({ p: [x, h(x, z), z], s: 0.08 + hash(i) * 0.14, r: hash(i + 1) * 3 });
    }
    return { stones, trees, flowers, mushrooms, rocks };
  }, [cottage.x, cottage.z, cottage.rot]);

  const butterflyAnchors = useMemo<[number, number, number][]>(() => {
    const pts = layout.flowers;
    if (pts.length < 4) return [];
    const picks = [0, Math.floor(pts.length / 3), Math.floor((pts.length * 2) / 3), pts.length - 1];
    return picks.map((i) => pts[i]!.p);
  }, [layout.flowers]);

  useFrame(({ clock }) => {
    if (!ring.current) return;
    const m = ring.current.material as THREE.MeshBasicMaterial;
    m.opacity = (hovered ? 0.55 : 0.28) + (reducedMotion ? 0 : Math.sin(clock.elapsedTime * 1.6) * 0.08);
  });

  return (
    <Island
      shape={MAIN_SHAPE}
      position={[0, 0, 0]}
      grass={revealed ? "#9cc58a" : "#b7c2ae"}
      bobPhase={0}
      reducedMotion={reducedMotion}
      onSelect={onSelect}
      onHover={setHovered}
    >
      {/* soft champagne halo marking the active region */}
      <mesh ref={ring} position={[0, -0.25, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[5.25, 5.55, 96]} />
        <meshBasicMaterial color="#e6cf98" transparent opacity={0.3} depthWrite={false} />
      </mesh>

      {!revealed && (
        <>
          {BARE_ROCKS.map((r, i) => (
            <Grow key={i} position={[r.p[0], h(r.p[0], r.p[2]), r.p[2]]} reducedMotion={reducedMotion}>
              <Rock position={[0, 0, 0]} scale={r.s} rot={r.r} />
            </Grow>
          ))}
        </>
      )}

      {revealed && (
        <>
          <group
            onClick={(e) => {
              if (!onEgg) return;
              e.stopPropagation();
              onEgg("cottage-door");
            }}
          >
            <Grow position={[cottage.x, h(cottage.x, cottage.z) - 0.04, cottage.z]} reducedMotion={reducedMotion}>
              <Cottage position={[0, 0, 0]} rotation={cottage.rot} />
            </Grow>
          </group>

          <Grow position={[P.x, WATER_LEVEL, P.z]} reducedMotion={reducedMotion}>
            <mesh rotation={[-Math.PI / 2, 0, 0]} scale={[1, 0.9, 1]} receiveShadow>
              <circleGeometry args={[1.05, 40]} />
              <meshStandardMaterial color="#9fcbe0" roughness={0.12} metalness={0.15} transparent opacity={0.9} />
            </mesh>
          </Grow>

          <Grow reducedMotion={reducedMotion}>
            <StreamAndFall reducedMotion={reducedMotion} />
          </Grow>
          <Grow reducedMotion={reducedMotion}>
            <Bridge />
          </Grow>
          <Grow reducedMotion={reducedMotion}>
            <PathStones points={layout.stones} />
          </Grow>

          {layout.trees.map((t) => (
            <Grow key={t.v} position={t.p} reducedMotion={reducedMotion}>
              <Tree position={[0, 0, 0]} scale={t.s} variant={t.v} />
            </Grow>
          ))}

          <Grow reducedMotion={reducedMotion}>
            <Flowers points={layout.flowers} />
          </Grow>

          {layout.mushrooms.map((m, i) => (
            <Grow key={i} position={m.p} reducedMotion={reducedMotion}>
              <Mushroom position={[0, 0, 0]} cream={m.cream} />
            </Grow>
          ))}

          {layout.rocks.map((r, i) => (
            <Grow key={i} position={r.p} reducedMotion={reducedMotion}>
              <Rock position={[0, 0, 0]} scale={r.s} rot={r.r} />
            </Grow>
          ))}

          <Birds reducedMotion={reducedMotion} />
          <Butterflies anchors={butterflyAnchors} ground={h} reducedMotion={reducedMotion} />
          <Rabbits anchors={RABBIT_SPOTS} ground={h} reducedMotion={reducedMotion} />
          <Squirrels anchors={SQUIRREL_SPOTS} ground={h} reducedMotion={reducedMotion} />
          <Ducks center={[P.x, WATER_LEVEL, P.z]} radius={0.62} reducedMotion={reducedMotion} />
        </>
      )}
    </Island>
  );
}
