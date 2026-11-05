import { useMemo, useRef, type ReactNode } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { CHAPTERS } from "@/lib/world/story";

/* ------------------------------------------------------------- palette */

const C = {
  floor: "#e6dfd2",
  wall: "#f2efe8",
  wallWarm: "#efe7d9",
  wood: "#c9b393",
  woodDark: "#a68d6b",
  blue: "#afcbe8",
  blueDeep: "#7d9fc4",
  blueInk: "#405c78",
  cream: "#f7f5ef",
  green: "#93b096",
  greenDark: "#6f8f76",
  gold: "#e7c98a",
  clay: "#cf9c86",
  glass: "#cfe2f2",
  slate: "#8b9aa6",
};

const mk = (
  color: string,
  o: { rough?: number; metal?: number; emissive?: string; ei?: number; opacity?: number } = {},
) =>
  new THREE.MeshStandardMaterial({
    color: new THREE.Color(color),
    roughness: o.rough ?? 0.9,
    metalness: o.metal ?? 0,
    transparent: o.opacity !== undefined,
    opacity: o.opacity ?? 1,
    ...(o.emissive ? { emissive: new THREE.Color(o.emissive), emissiveIntensity: o.ei ?? 0.7 } : {}),
  });

const MAT = {
  floor: mk(C.floor, { rough: 0.95 }),
  wall: mk(C.wall, { rough: 1 }),
  wallWarm: mk(C.wallWarm, { rough: 1 }),
  wood: mk(C.wood),
  woodDark: mk(C.woodDark),
  blue: mk(C.blue, { rough: 0.85 }),
  blueDeep: mk(C.blueDeep, { rough: 0.8 }),
  blueInk: mk(C.blueInk, { rough: 0.8 }),
  cream: mk(C.cream),
  green: mk(C.green, { rough: 0.95 }),
  greenDark: mk(C.greenDark, { rough: 0.95 }),
  gold: mk(C.gold, { emissive: "#f0d7a0", ei: 0.55 }),
  clay: mk(C.clay),
  glass: mk(C.glass, { rough: 0.25, metal: 0.1, opacity: 0.42 }),
  slate: mk(C.slate, { rough: 0.6, metal: 0.2 }),
  book: [mk("#a9bfd4"), mk("#d8c3a5"), mk("#b7c6ae"), mk("#cbb3b8"), mk("#9fb3c8")],
};

const G = {
  box: new THREE.BoxGeometry(1, 1, 1),
  cyl: new THREE.CylinderGeometry(0.5, 0.5, 1, 16),
  cyl8: new THREE.CylinderGeometry(0.5, 0.5, 1, 8),
  cone: new THREE.ConeGeometry(0.5, 1, 18),
  ball: new THREE.SphereGeometry(0.5, 20, 14),
  plane: new THREE.PlaneGeometry(1, 1),
  octa: new THREE.OctahedronGeometry(0.5, 0),
  torus: new THREE.TorusGeometry(0.5, 0.06, 8, 28),
  caps: new THREE.CapsuleGeometry(0.5, 1, 6, 14),
};

/* --------------------------------------------------------------- shells */

function Shell({ wallColor = MAT.wall }: { wallColor?: THREE.Material }) {
  return (
    <group>
      <mesh geometry={G.box} material={MAT.floor} position={[0, -0.1, 0]} scale={[11, 0.2, 11]} receiveShadow />
      <mesh geometry={G.box} material={wallColor} position={[0, 2, -5.4]} scale={[11, 4.4, 0.2]} />
      <mesh geometry={G.box} material={wallColor} position={[-5.4, 2, 0]} scale={[0.2, 4.4, 11]} />
      <mesh geometry={G.box} material={wallColor} position={[5.4, 2, 0]} scale={[0.2, 4.4, 11]} />
    </group>
  );
}

function Window({ position = [0, 2, -5.25] as [number, number, number] }) {
  return (
    <group position={position}>
      <mesh geometry={G.plane} material={MAT.glass} scale={[3.4, 2.4, 1]} />
      <mesh geometry={G.box} material={MAT.cream} position={[0, 1.26, 0.02]} scale={[3.7, 0.12, 0.14]} />
      <mesh geometry={G.box} material={MAT.cream} position={[0, -1.22, 0.02]} scale={[3.7, 0.14, 0.24]} />
      <mesh geometry={G.box} material={MAT.cream} position={[-1.78, 0, 0.02]} scale={[0.12, 2.6, 0.14]} />
      <mesh geometry={G.box} material={MAT.cream} position={[1.78, 0, 0.02]} scale={[0.12, 2.6, 0.14]} />
      <mesh geometry={G.box} material={MAT.cream} position={[0, 0, 0.02]} scale={[0.09, 2.4, 0.12]} />
      <mesh geometry={G.ball} material={MAT.gold} position={[-1.1, 2.9, 0.4]} scale={[0.5, 0.5, 0.5]} />
    </group>
  );
}

function Plant({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      <mesh geometry={G.cyl} material={MAT.clay} position={[0, 0.18, 0]} scale={[0.46, 0.36, 0.46]} />
      <mesh geometry={G.ball} material={MAT.green} position={[0, 0.62, 0]} scale={[0.62, 0.6, 0.62]} />
      <mesh geometry={G.ball} material={MAT.greenDark} position={[0.22, 0.86, 0.1]} scale={[0.4, 0.42, 0.4]} />
      <mesh geometry={G.ball} material={MAT.green} position={[-0.24, 0.78, -0.12]} scale={[0.38, 0.4, 0.38]} />
    </group>
  );
}

function Sofa({ position, rotation = 0 }: { position: [number, number, number]; rotation?: number }) {
  return (
    <group position={position} rotation={[0, rotation, 0]}>
      <mesh geometry={G.box} material={MAT.blue} position={[0, 0.3, 0]} scale={[2.2, 0.42, 0.92]} />
      <mesh geometry={G.box} material={MAT.blueDeep} position={[0, 0.66, -0.34]} scale={[2.2, 0.6, 0.24]} />
      <mesh geometry={G.box} material={MAT.blueDeep} position={[-1.02, 0.52, 0.02]} scale={[0.18, 0.38, 0.92]} />
      <mesh geometry={G.box} material={MAT.blueDeep} position={[1.02, 0.52, 0.02]} scale={[0.18, 0.38, 0.92]} />
    </group>
  );
}

function Desk({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      <mesh geometry={G.box} material={MAT.wood} position={[0, 0.76, 0]} scale={[1.9, 0.09, 0.78]} />
      {[
        [-0.86, 0, -0.32],
        [0.86, 0, -0.32],
        [-0.86, 0, 0.32],
        [0.86, 0, 0.32],
      ].map((p, i) => (
        <mesh key={i} geometry={G.box} material={MAT.woodDark} position={[p[0]!, 0.38, p[2]!]} scale={[0.08, 0.76, 0.08]} />
      ))}
      {/* lamp */}
      <mesh geometry={G.cyl} material={MAT.slate} position={[0.66, 0.83, -0.16]} scale={[0.2, 0.05, 0.2]} />
      <mesh geometry={G.cyl} material={MAT.slate} position={[0.66, 1.02, -0.16]} scale={[0.035, 0.38, 0.035]} />
      <mesh geometry={G.cone} material={MAT.gold} position={[0.66, 1.26, -0.16]} scale={[0.34, 0.26, 0.34]} />
      <mesh geometry={G.ball} material={MAT.gold} position={[0.66, 1.16, -0.16]} scale={[0.12, 0.12, 0.12]} />
      {/* books */}
      <mesh geometry={G.box} material={MAT.book[0]} position={[-0.5, 0.84, 0.02]} scale={[0.42, 0.06, 0.3]} rotation={[0, 0.12, 0]} />
      <mesh geometry={G.box} material={MAT.book[1]} position={[-0.5, 0.9, 0.02]} scale={[0.38, 0.06, 0.27]} rotation={[0, -0.06, 0]} />
      <mesh geometry={G.box} material={MAT.book[2]} position={[-0.5, 0.96, 0.02]} scale={[0.34, 0.05, 0.25]} rotation={[0, 0.2, 0]} />
      {/* mug */}
      <mesh geometry={G.cyl} material={MAT.cream} position={[-0.05, 0.87, 0.14]} scale={[0.16, 0.18, 0.16]} />
      {/* headphones */}
      <mesh geometry={G.torus} material={MAT.slate} position={[0.22, 0.82, 0.12]} rotation={[1.4, 0, 0]} scale={[0.34, 0.34, 0.34]} />
    </group>
  );
}

function Chair({ position, rotation = 0 }: { position: [number, number, number]; rotation?: number }) {
  return (
    <group position={position} rotation={[0, rotation, 0]}>
      <mesh geometry={G.box} material={MAT.woodDark} position={[0, 0.44, 0]} scale={[0.46, 0.07, 0.46]} />
      <mesh geometry={G.box} material={MAT.woodDark} position={[0, 0.72, -0.2]} scale={[0.44, 0.5, 0.06]} />
      {[
        [-0.18, 0.18],
        [0.18, 0.18],
        [-0.18, -0.18],
        [0.18, -0.18],
      ].map((p, i) => (
        <mesh key={i} geometry={G.box} material={MAT.woodDark} position={[p[0]!, 0.22, p[1]!]} scale={[0.05, 0.44, 0.05]} />
      ))}
    </group>
  );
}

function Shelf({ position, rotation = 0 }: { position: [number, number, number]; rotation?: number }) {
  const books = useMemo(
    () =>
      Array.from({ length: 14 }, (_, i) => ({
        x: -1.15 + (i % 7) * 0.33,
        y: 0.62 + Math.floor(i / 7) * 0.78,
        w: 0.18 + ((i * 7) % 5) * 0.02,
        h: 0.34 + ((i * 3) % 4) * 0.05,
        m: i % 5,
      })),
    [],
  );
  return (
    <group position={position} rotation={[0, rotation, 0]}>
      <mesh geometry={G.box} material={MAT.wood} position={[0, 0.9, -0.18]} scale={[2.5, 1.9, 0.1]} />
      <mesh geometry={G.box} material={MAT.wood} position={[0, 0.02, 0]} scale={[2.6, 0.1, 0.5]} />
      <mesh geometry={G.box} material={MAT.wood} position={[0, 1.82, 0]} scale={[2.6, 0.1, 0.5]} />
      <mesh geometry={G.box} material={MAT.wood} position={[0, 0.94, 0]} scale={[2.6, 0.08, 0.48]} />
      <mesh geometry={G.box} material={MAT.wood} position={[-1.3, 0.92, 0]} scale={[0.1, 1.9, 0.5]} />
      <mesh geometry={G.box} material={MAT.wood} position={[1.3, 0.92, 0]} scale={[0.1, 1.9, 0.5]} />
      {books.map((b, i) => (
        <mesh key={i} geometry={G.box} material={MAT.book[b.m]!} position={[b.x, b.y, 0.02]} scale={[b.w, b.h, 0.28]} />
      ))}
    </group>
  );
}

/* ------------------------------------------------------------ chapter 1 */

function RoomScene() {
  return (
    <group>
      <Shell />
      <Window />
      <Desk position={[-0.4, 0, -2.1]} />
      <Chair position={[-0.4, 0, -1.15]} rotation={Math.PI} />
      <Plant position={[2.3, 0, -2.6]} />
      <Sofa position={[2.6, 0, 1.4]} rotation={-0.5} />
      {/* rug */}
      <mesh geometry={G.cyl} material={MAT.wallWarm} position={[0, 0.02, -0.4]} scale={[4.6, 0.04, 4.6]} />
      {/* pinboard */}
      <mesh geometry={G.box} material={MAT.cream} position={[3.4, 2.2, -5.2]} scale={[1.8, 1.3, 0.08]} />
      <mesh geometry={G.box} material={MAT.book[3]} position={[3.1, 2.35, -5.1]} scale={[0.5, 0.4, 0.04]} rotation={[0, 0, 0.06]} />
      <mesh geometry={G.box} material={MAT.book[1]} position={[3.75, 2.05, -5.1]} scale={[0.45, 0.35, 0.04]} rotation={[0, 0, -0.08]} />
    </group>
  );
}

/* ------------------------------------------------------------ chapter 2 */

function StudioScene() {
  return (
    <group>
      <Shell wallColor={MAT.wallWarm} />
      <Window position={[0, 2, -5.25]} />
      <Shelf position={[-2.9, 0, -4.4]} />
      <Desk position={[1.5, 0, -2.4]} />
      <Chair position={[1.5, 0, -1.4]} rotation={Math.PI} />
      <Sofa position={[-2.2, 0, 1.9]} rotation={0.6} />
      <Plant position={[3.4, 0, -3.6]} />
      <mesh geometry={G.box} material={MAT.wallWarm} position={[0, 0.03, 0.2]} scale={[5.4, 0.06, 4.4]} />
      {/* gallery wall */}
      {[
        [-1.5, 2.4, 0.62, 0.46],
        [0, 2.5, 0.5, 0.62],
        [1.5, 2.4, 0.7, 0.42],
      ].map((p, i) => (
        <group key={i} position={[p[0]!, p[1]!, -5.15]}>
          <mesh geometry={G.box} material={MAT.cream} scale={[p[2]! + 0.1, p[3]! + 0.1, 0.06]} />
          <mesh geometry={G.box} material={MAT.book[i]!} position={[0, 0, 0.04]} scale={[p[2]!, p[3]!, 0.03]} />
        </group>
      ))}
      {/* desk clutter: notebook + pen */}
      <mesh geometry={G.box} material={MAT.cream} position={[1.4, 0.83, -2.3]} scale={[0.4, 0.04, 0.3]} rotation={[0, 0.3, 0]} />
      <mesh geometry={G.cyl8} material={MAT.blueInk} position={[1.4, 0.86, -2.3]} scale={[0.02, 0.24, 0.02]} rotation={[0, 0, 1.2]} />
    </group>
  );
}

/* ------------------------------------------------------------ chapter 3 */

function InterestIcon({ kind }: { kind: number }) {
  if (kind === 0)
    return (
      <group>
        <mesh geometry={G.box} material={MAT.woodDark} position={[0, 0.06, 0]} scale={[0.5, 0.12, 0.4]} />
        <mesh geometry={G.cyl} material={MAT.slate} position={[0, 0.14, 0]} scale={[0.34, 0.04, 0.34]} />
        <mesh geometry={G.cyl} material={MAT.clay} position={[0, 0.17, 0]} scale={[0.1, 0.02, 0.1]} />
        <mesh geometry={G.cyl8} material={MAT.slate} position={[0.14, 0.2, -0.06]} scale={[0.02, 0.24, 0.02]} rotation={[0, 0, -0.5]} />
      </group>
    );
  if (kind === 1)
    return (
      <group>
        <mesh geometry={G.box} material={MAT.book[0]} position={[0, 0.04, 0]} scale={[0.42, 0.08, 0.3]} />
        <mesh geometry={G.box} material={MAT.book[2]} position={[0.02, 0.11, 0]} scale={[0.38, 0.07, 0.28]} />
        <mesh geometry={G.box} material={MAT.book[4]} position={[-0.02, 0.17, 0]} scale={[0.34, 0.06, 0.26]} />
        <mesh geometry={G.cyl8} material={MAT.gold} position={[0.2, 0.24, 0.06]} scale={[0.015, 0.22, 0.015]} rotation={[0.3, 0, -0.4]} />
      </group>
    );
  if (kind === 2)
    return (
      <group>
        <mesh geometry={G.octa} material={MAT.blueDeep} position={[0, 0.18, 0]} scale={[0.36, 0.36, 0.36]} />
        <mesh geometry={G.torus} material={MAT.gold} position={[0, 0.18, 0]} rotation={[1.2, 0.4, 0]} scale={[0.56, 0.56, 0.56]} />
      </group>
    );
  if (kind === 3)
    return (
      <group>
        <mesh geometry={G.cyl8} material={MAT.woodDark} position={[0, 0.06, 0]} scale={[0.1, 0.12, 0.1]} />
        {[0, 2.1, 4.2].map((a, i) => (
          <mesh
            key={i}
            geometry={G.cyl8}
            material={MAT.woodDark}
            position={[Math.cos(a) * 0.08, -0.02, Math.sin(a) * 0.08]}
            scale={[0.025, 0.3, 0.025]}
            rotation={[Math.cos(a) * 0.35, 0, -Math.sin(a) * 0.35]}
          />
        ))}
        <mesh geometry={G.cyl} material={MAT.slate} position={[0, 0.3, 0]} scale={[0.12, 0.36, 0.12]} rotation={[1.1, 0, 0]} />
      </group>
    );
  if (kind === 4)
    return (
      <group>
        <mesh geometry={G.box} material={MAT.blueInk} position={[0, 0.16, 0]} scale={[0.44, 0.32, 0.06]} rotation={[-0.24, 0, 0]} />
        <mesh geometry={G.box} material={MAT.blue} position={[0, 0.16, 0.05]} scale={[0.36, 0.24, 0.02]} rotation={[-0.24, 0, 0]} />
        <mesh geometry={G.box} material={MAT.slate} position={[0, 0.04, 0.16]} scale={[0.5, 0.05, 0.16]} />
      </group>
    );
  return (
    <group>
      <mesh geometry={G.cyl} material={MAT.cream} position={[0, 0.1, 0]} scale={[0.16, 0.2, 0.16]} />
      <mesh geometry={G.cyl} material={MAT.wallWarm} position={[0, 0.01, 0]} scale={[0.3, 0.03, 0.3]} />
      <mesh geometry={G.ball} material={MAT.clay} position={[0.1, 0.24, 0]} scale={[0.07, 0.07, 0.07]} />
    </group>
  );
}

function InterestsScene() {
  const spots: [number, number, number][] = [
    [-3.3, 0, -1.4],
    [-1.7, 0, -2.5],
    [0, 0, -2.9],
    [1.7, 0, -2.5],
    [3.3, 0, -1.4],
    [0, 0, 1.6],
  ];
  return (
    <group>
      <mesh geometry={G.cyl} material={MAT.floor} position={[0, -0.1, 0]} scale={[11, 0.2, 11]} />
      <mesh geometry={G.cyl} material={MAT.blue} position={[0, -0.16, 0]} scale={[10.2, 0.24, 10.2]} />
      {spots.map((p, i) => (
        <group key={i} position={p}>
          <mesh geometry={G.cyl} material={MAT.cream} position={[0, 0.18, 0]} scale={[1.05, 0.34, 1.05]} />
          <group position={[0, 0.35, 0]}>
            <InterestIcon kind={i} />
          </group>
        </group>
      ))}
    </group>
  );
}

/* ------------------------------------------------------------ chapter 4 */

function JourneyScene() {
  const steps = useMemo(
    () =>
      Array.from({ length: 9 }, (_, i) => {
        const t = i / 8;
        return {
          x: -4 + t * 8,
          y: 0.1 + Math.sin(t * Math.PI * 1.4) * 0.5,
          r: t * 1.5 - 0.7,
        };
      }),
    [],
  );
  return (
    <group>
      <mesh geometry={G.cyl} material={MAT.green} position={[0, -0.5, 0]} scale={[11, 0.9, 11]} />
      {steps.map((s, i) => (
        <mesh
          key={i}
          geometry={G.box}
          material={MAT.wood}
          position={[s.x, s.y - 0.2, s.r]}
          scale={[1.05, 0.2, 1.05]}
          rotation={[0, i * 0.16, 0]}
        />
      ))}
      {[0, 1, 2, 3].map((i) => {
        const t = 0.12 + i * 0.26;
        const x = -4 + t * 8;
        const z = t * 1.5 - 0.7;
        const y = 0.1 + Math.sin(t * Math.PI * 1.4) * 0.5;
        return (
          <group key={i} position={[x, y, z]}>
            <mesh geometry={G.cyl8} material={MAT.woodDark} position={[0, 0.62, 0]} scale={[0.08, 1.24, 0.08]} />
            <mesh geometry={G.ball} material={MAT.gold} position={[0, 1.3, 0]} scale={[0.2, 0.2, 0.2]} />
          </group>
        );
      })}
      {[
        [-3.6, 1.9, 1.6, 0.9],
        [3.4, 1.6, -2.3, 0.8],
        [4.2, 1.2, 2.2, 0.65],
        [-1.2, 2.1, -3.4, 0.7],
      ].map((p, i) => (
        <group key={i} position={[p[0]!, 0, p[1]!]}>
          <mesh geometry={G.cyl8} material={MAT.woodDark} position={[0, 0.4 * p[3]!, 0]} scale={[0.12 * p[3]!, 0.9 * p[3]!, 0.12 * p[3]!]} />
          <mesh geometry={G.ball} material={MAT.greenDark} position={[0, 1.1 * p[3]!, 0]} scale={[1.1 * p[3]!, 1.0 * p[3]!, 1.1 * p[3]!]} />
          <mesh geometry={G.ball} material={MAT.green} position={[0.2 * p[3]!, 1.5 * p[3]!, 0.1 * p[3]!]} scale={[0.7 * p[3]!, 0.7 * p[3]!, 0.7 * p[3]!]} />
        </group>
      ))}
      {/* distant hills */}
      {[
        [-6, -1, -7, 3.4],
        [0, -1, -8, 4.2],
        [6, -1, -7, 3.2],
      ].map((p, i) => (
        <mesh key={i} geometry={G.cone} material={MAT.blueDeep} position={[p[0]!, p[1]!, p[2]!]} scale={[p[3]!, p[3]! * 0.8, p[3]!]} />
      ))}
    </group>
  );
}

/* ------------------------------------------------------------ chapter 5 */

function MindScene() {
  const float = useRef<THREE.Group>(null);
  useFrame(({ clock }) => {
    if (float.current) {
      float.current.rotation.y = clock.elapsedTime * 0.14;
      float.current.position.y = 1.7 + Math.sin(clock.elapsedTime * 0.5) * 0.08;
    }
  });
  return (
    <group>
      <mesh geometry={G.cyl} material={MAT.cream} position={[0, -0.1, 0]} scale={[11, 0.2, 11]} />
      {/* glass walls */}
      <mesh geometry={G.plane} material={MAT.glass} position={[0, 1.8, -5.4]} scale={[11, 3.6, 1]} />
      {[-4, -1.34, 1.34, 4].map((x, i) => (
        <mesh key={i} geometry={G.box} material={MAT.cream} position={[x, 1.8, -5.34]} scale={[0.09, 3.6, 0.12]} />
      ))}
      <mesh geometry={G.box} material={MAT.cream} position={[0, 3.62, -5.34]} scale={[11, 0.1, 0.12]} />
      <Desk position={[0, 0, -2.6]} />
      <Chair position={[0, 0, -1.5]} rotation={Math.PI} />
      <Shelf position={[-3.6, 0, -4.6]} rotation={1.57} />
      <mesh geometry={G.cyl} material={MAT.blue} position={[0, 0.02, -0.6]} scale={[4.4, 0.04, 4.4]} />
      {/* floating geometry */}
      <group ref={float} position={[0, 1.7, -4]} scale={[1, 1, 1]}>
        <mesh geometry={G.octa} material={MAT.blueDeep} scale={[0.5, 0.5, 0.5]} />
        <mesh geometry={G.octa} material={MAT.gold} position={[1.5, 0.5, 0.4]} scale={[0.26, 0.26, 0.26]} />
        <mesh geometry={G.octa} material={MAT.slate} position={[-1.5, -0.4, 0.3]} scale={[0.2, 0.2, 0.2]} />
      </group>
    </group>
  );
}

/* ------------------------------------------------------------ chapter 6 */

function SummitScene() {
  return (
    <group>
      <mesh geometry={G.cyl} material={MAT.slate} position={[0, -0.3, 0]} scale={[6.4, 0.6, 6.4]} />
      <mesh geometry={G.cyl} material={MAT.green} position={[0, 0.04, 0]} scale={[5.6, 0.14, 5.6]} />
      <mesh geometry={G.cyl} material={MAT.blue} position={[0, -1.5, 0]} scale={[14, 0.1, 14]} />
      {[
        [-7, -1.6, -9, 5],
        [1, -1.6, -11, 6.4],
        [8, -1.6, -8, 4.4],
      ].map((p, i) => (
        <mesh key={i} geometry={G.cone} material={MAT.blueDeep} position={[p[0]!, p[1]!, p[2]!]} scale={[p[3]!, p[3]! * 0.9, p[3]!]} />
      ))}
      {[
        [-2.4, 0.1, 1.4, 0.7],
        [2.2, 0.1, -1.1, 0.55],
      ].map((p, i) => (
        <group key={i} position={[p[0]!, p[1]!, p[2]!]}>
          <mesh geometry={G.ball} material={MAT.slate} scale={[1.5 * p[3]!, 0.9 * p[3]!, 1.5 * p[3]!]} />
          <mesh geometry={G.ball} material={MAT.green} position={[0, 0.34 * p[3]!, 0]} scale={[1.4 * p[3]!, 0.5 * p[3]!, 1.4 * p[3]!]} />
        </group>
      ))}
    </group>
  );
}

/* ------------------------------------------------------------ companion */

/** A small bean-shaped guide: round head, dot eyes, curtain bangs. */
function Companion({ progress, reducedMotion }: { progress: React.MutableRefObject<number>; reducedMotion: boolean }) {
  const g = useRef<THREE.Group>(null);
  const head = useRef<THREE.Group>(null);
  const body = useRef<THREE.Group>(null);

  const spots: [number, number, number][] = [
    [-2.6, 0, 2.2],
    [-3.2, 0, 2.6],
    [2.9, 0, 2.4],
    [-1.4, 0, 3.0],
    [2.6, 0, 0.6],
    [1.6, 0, 2.6],
  ];

  useFrame(({ clock }) => {
    if (!g.current) return;
    const t = clock.elapsedTime;
    const f = progress.current * (CHAPTERS.length - 1);
    const i = Math.min(CHAPTERS.length - 2, Math.floor(f));
    const k = Math.min(1, Math.max(0, f - i));
    const a = spots[i]!;
    const b = spots[i + 1]!;
    const x = a[0] + (b[0] - a[0]) * k;
    g.current.position.set((i + k) * SPACING + x, a[1] + (b[1] - a[1]) * k, a[2] + (b[2] - a[2]) * k);
    if (reducedMotion) return;
    if (body.current) body.current.scale.y = 1 + Math.sin(t * 1.6) * 0.02;
    if (head.current) {
      head.current.rotation.y = Math.sin(t * 0.6) * 0.28;
      head.current.rotation.z = Math.sin(t * 0.9) * 0.05;
    }
    g.current.position.y += Math.sin(t * 1.2) * 0.015;
  });

  return (
    <group ref={g} position={[-2.6, 0, 2.2]}>
      <group ref={body}>
        <mesh geometry={G.caps} material={MAT.blue} position={[0, 0.34, 0]} scale={[0.34, 0.34, 0.3]} />
        <mesh geometry={G.box} material={MAT.cream} position={[0, 0.3, 0.1]} scale={[0.26, 0.22, 0.16]} />
      </group>
      <group ref={head} position={[0, 0.72, 0]}>
        <mesh geometry={G.ball} material={MAT.cream} scale={[0.44, 0.42, 0.42]} />
        <mesh geometry={G.ball} material={MAT.blueInk} position={[-0.1, 0.02, 0.19]} scale={[0.055, 0.07, 0.04]} />
        <mesh geometry={G.ball} material={MAT.blueInk} position={[0.1, 0.02, 0.19]} scale={[0.055, 0.07, 0.04]} />
        <mesh geometry={G.ball} material={MAT.blueDeep} position={[-0.13, 0.15, 0.16]} scale={[0.2, 0.18, 0.14]} rotation={[0, 0, 0.3]} />
        <mesh geometry={G.ball} material={MAT.blueDeep} position={[0.13, 0.15, 0.16]} scale={[0.2, 0.18, 0.14]} rotation={[0, 0, -0.3]} />
        <mesh geometry={G.ball} material={MAT.blueDeep} position={[0, 0.19, 0.14]} scale={[0.16, 0.16, 0.14]} />
      </group>
    </group>
  );
}

/* ---------------------------------------------------------------- world */

const SPACING = 16;

function Rig({ progress, reducedMotion }: { progress: React.MutableRefObject<number>; reducedMotion: boolean }) {
  const { camera } = useThree();
  const cur = useRef(new THREE.Vector3(0, 2.4, 7.2));
  const look = useRef(new THREE.Vector3(0, 1.5, 0));

  useFrame((_, dt) => {
    const p = Math.min(1, Math.max(0, progress.current));
    const f = p * (CHAPTERS.length - 1);
    const tx = f * SPACING + (reducedMotion ? 0 : Math.sin(p * Math.PI * 2) * 0.6);
    const ty = 2.5 + Math.sin(p * Math.PI) * 0.9;
    const tz = 7.2 - Math.sin(p * Math.PI) * 1.4;
    const k = reducedMotion ? 1 : Math.min(1, dt * 2.6);
    cur.current.lerp(new THREE.Vector3(tx, ty, tz), k);
    look.current.lerp(new THREE.Vector3(f * SPACING, 1.5, 0), k);
    camera.position.copy(cur.current);
    camera.lookAt(look.current);
  });
  return null;
}

function Stage({ progress }: { progress: React.MutableRefObject<number> }) {
  const refs = useRef<(THREE.Group | null)[]>([]);
  useFrame(() => {
    const f = progress.current * (CHAPTERS.length - 1);
    refs.current.forEach((g, i) => {
      if (g) g.visible = Math.abs(i - f) < 1.55;
    });
  });
  return (
    <>
      {CHAPTERS.map((ch, i) => (
        <group
          key={ch.id}
          position={[i * SPACING, 0, 0]}
          ref={(el) => {
            refs.current[i] = el;
          }}
          visible={i === 0}
        >
          {ch.id === "beginning" && <RoomScene />}
          {ch.id === "person" && <StudioScene />}
          {ch.id === "interests" && <InterestsScene />}
          {ch.id === "journey" && <JourneyScene />}
          {ch.id === "mind" && <MindScene />}
          {ch.id === "still" && <SummitScene />}
        </group>
      ))}
    </>
  );
}

export function StoryWorld({
  progress,
  reducedMotion,
}: {
  progress: React.MutableRefObject<number>;
  reducedMotion: boolean;
}) {
  return (
    <Canvas
      dpr={[1, 1.6]}
      camera={{ fov: 42, near: 0.1, far: 120, position: [0, 2.5, 7.2] }}
      gl={{ antialias: true, powerPreference: "high-performance" }}
      onCreated={({ gl }) => {
        gl.toneMapping = THREE.ACESFilmicToneMapping;
        gl.toneMappingExposure = 1.02;
      }}
    >
      <color attach="background" args={["#dceaf6"]} />
      <fog attach="fog" args={["#dceaf6", 9, 34]} />
      <hemisphereLight args={["#eaf3ff", "#cfd8c8", 1.15]} />
      <ambientLight intensity={0.45} />
      <directionalLight position={[5, 9, 6]} intensity={1.5} color="#fff4e2" />
      <directionalLight position={[-6, 4, -4]} intensity={0.35} color="#cfe0f5" />
      <Rig progress={progress} reducedMotion={reducedMotion} />
      <Stage progress={progress} />
      <Companion progress={progress} reducedMotion={reducedMotion} />
    </Canvas>
  );
}
