import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { surfaceHeight, type IslandShape } from "@/lib/world/terrain";
import { POND, pondWaterLevel } from "@/lib/world/bottle";
import { Rock } from "./details";

type P3 = [number, number, number];

const M = {
  wood: new THREE.MeshStandardMaterial({ color: "#c9a882", roughness: 0.9 }),
  darkWood: new THREE.MeshStandardMaterial({ color: "#9c7a58", roughness: 0.9 }),
  stone: new THREE.MeshStandardMaterial({ color: "#cfc8bb", roughness: 0.95 }),
  white: new THREE.MeshStandardMaterial({ color: "#f6f1e5", roughness: 0.85 }),
  canvas: new THREE.MeshStandardMaterial({ color: "#faf5e9", roughness: 0.95 }),
  glow: new THREE.MeshStandardMaterial({ color: "#f3dfa6", emissive: "#dcb968", emissiveIntensity: 0.55, roughness: 0.4 }),
  metal: new THREE.MeshStandardMaterial({ color: "#939ea4", roughness: 0.5, metalness: 0.35 }),
  clay: new THREE.MeshStandardMaterial({ color: "#cb8f78", roughness: 0.85 }),
  teal: new THREE.MeshStandardMaterial({ color: "#8fb3b8", roughness: 0.85 }),
  ink: new THREE.MeshStandardMaterial({ color: "#4b4a45", roughness: 0.9 }),
};

const G = {
  box: new THREE.BoxGeometry(1, 1, 1),
  cyl: new THREE.CylinderGeometry(1, 1, 1, 12),
  cone: new THREE.ConeGeometry(1, 1, 12),
  ball: new THREE.SphereGeometry(1, 12, 10),
};

type ThemeProps = {
  shape: IslandShape;
  reducedMotion: boolean;
  outward: [number, number];
  /** A hidden spot on this island was found. */
  onEgg?: ((id: string) => void) | undefined;
};

/** A paused easel: three legs and a tilted canvas. */
function Easel({ position, rotation = 0, paint = "#8fb3b8" }: { position: P3; rotation?: number; paint?: string }) {
  return (
    <group position={position} rotation={[0, rotation, 0]}>
      <mesh geometry={G.cyl} material={M.darkWood} position={[-0.13, 0.3, 0.06]} rotation={[0.16, 0, 0.1]} scale={[0.018, 0.62, 0.018]} castShadow />
      <mesh geometry={G.cyl} material={M.darkWood} position={[0.13, 0.3, 0.06]} rotation={[0.16, 0, -0.1]} scale={[0.018, 0.62, 0.018]} castShadow />
      <mesh geometry={G.cyl} material={M.darkWood} position={[0, 0.28, -0.14]} rotation={[-0.34, 0, 0]} scale={[0.018, 0.6, 0.018]} castShadow />
      <mesh geometry={G.box} material={M.canvas} position={[0, 0.52, 0.02]} rotation={[0.16, 0, 0]} scale={[0.34, 0.3, 0.018]} castShadow />
      <mesh geometry={G.box} material={M.clay} position={[0, 0.52, 0.032]} rotation={[0.16, 0, 0]} scale={[0.22, 0.12, 0.004]} />
      <mesh geometry={G.box} material={M.ink} position={[0, 0.45, 0.024]} rotation={[0.16, 0, 0]} scale={[0.36, 0.02, 0.03]} />
      <mesh geometry={G.ball} material={new THREE.MeshStandardMaterial({ color: paint, roughness: 0.7 })} position={[0.18, 0.4, 0.04]} scale={0.026} />
    </group>
  );
}

/** Open-air exhibition pavilion. */
function Gallery({ shape, reducedMotion, onEgg }: ThemeProps) {
  const g = (x: number, z: number) => surfaceHeight(x, z, shape);
  return (
    <group>
      <group position={[0, g(0, 0), 0]}>
        {(
          [
            [-0.72, -0.72],
            [0.72, -0.72],
            [-0.72, 0.72],
            [0.72, 0.72],
          ] as [number, number][]
        ).map(([x, z], i) => (
          <mesh key={i} geometry={G.cyl} material={M.wood} position={[x, 0.56, z]} scale={[0.052, 1.12, 0.052]} castShadow />
        ))}
        <mesh geometry={G.box} material={M.darkWood} position={[0, 1.15, 0]} scale={[1.78, 0.08, 1.78]} castShadow receiveShadow />
        <mesh geometry={G.box} material={M.wood} position={[0, 1.2, 0]} scale={[1.5, 0.05, 1.5]} />
        {/* plinth in the middle — the glow ball hides a small secret */}
        <group
          onClick={(e) => {
            if (!onEgg) return;
            e.stopPropagation();
            onEgg("gallery-plinth");
          }}
        >
          <mesh geometry={G.box} material={M.stone} position={[0, 0.14, 0]} scale={[0.5, 0.28, 0.5]} castShadow receiveShadow />
          <mesh geometry={G.ball} material={M.glow} position={[0, 0.44, 0]} scale={0.17} castShadow />
          <mesh geometry={G.ball} material={M.teal} position={[0, 0.52, 0.1]} scale={0.06} />
          <mesh geometry={G.cone} material={M.clay} position={[0.11, 0.5, -0.06]} rotation={[0, 0, -0.4]} scale={0.06} />
          {!reducedMotion && <PlinthHalo y={0.44} />}
        </group>
      </group>
      <Easel position={[-1.35, g(-1.35, 0.55), 0.55]} rotation={0.7} paint="#c9a882" />
      <Easel position={[1.25, g(1.25, -0.6), -0.6]} rotation={-0.5} paint="#8fb3b8" />
      <Easel position={[0.15, g(0.15, 1.45), 1.45]} rotation={0.15} paint="#cb8f78" />
    </group>
  );
}

function PlinthHalo({ y }: { y: number }) {
  const ref = useRef<THREE.Mesh>(null);
  useFrame(({ clock }) => {
    if (ref.current) ref.current.rotation.y = clock.elapsedTime * 0.4;
  });
  return (
    <mesh ref={ref} position={[0, y, 0]} rotation={[-Math.PI / 2, 0, 0]}>
      <ringGeometry args={[0.22, 0.26, 32]} />
      <meshBasicMaterial color="#e8c877" transparent opacity={0.55} depthWrite={false} side={THREE.DoubleSide} />
    </mesh>
  );
}

/** Round reading tower plus a listening booth. Collections stays pure: the
 *  drifting bottle and its tide pool live on the Message Island now. */
function Collections({ shape, reducedMotion, onEgg }: ThemeProps) {
  const g = (x: number, z: number) => surfaceHeight(x, z, shape);
  return (
    <group>
      <group position={[0, g(0, 0), 0]}>
        <mesh geometry={G.cyl} material={M.stone} position={[0, 0.72, 0]} scale={[0.52, 1.45, 0.52]} castShadow receiveShadow />
        <mesh geometry={G.cyl} material={M.darkWood} position={[0, 1.44, 0]} scale={[0.56, 0.06, 0.56]} />
        <mesh geometry={G.cone} material={M.teal} position={[0, 1.72, 0]} scale={[0.64, 0.5, 0.64]} castShadow />
        <mesh geometry={G.ball} material={M.glow} position={[0, 2.0, 0]} scale={0.07} />
        {/* door */}
        <mesh geometry={G.box} material={M.darkWood} position={[0, 0.3, 0.52]} scale={[0.24, 0.6, 0.04]} />
        <mesh geometry={G.box} material={M.glow} position={[0, 0.78, 0.53]} scale={[0.18, 0.2, 0.03]} />
        {[0, Math.PI / 2, Math.PI, -Math.PI / 2].map((r, i) => (
          <mesh
            key={i}
            geometry={G.box}
            material={M.glow}
            position={[Math.sin(r) * 0.53, 0.95, Math.cos(r) * 0.53]}
            rotation={[0, r, 0]}
            scale={[0.16, 0.2, 0.02]}
          />
        ))}
      </group>

      {/* listening booth: a low disc with a horn and a spinning record */}
      <group
        position={[-1.35, g(-1.35, 0.85), 0.85]}
        onClick={(e) => {
          if (!onEgg) return;
          e.stopPropagation();
          onEgg("listening-booth");
        }}
      >
        <mesh geometry={G.cyl} material={M.darkWood} position={[0, 0.12, 0]} scale={[0.3, 0.24, 0.3]} castShadow receiveShadow />
        <mesh geometry={G.cyl} material={M.ink} position={[0, 0.25, 0]} scale={[0.18, 0.012, 0.18]} />
        {!reducedMotion && <SpinningDisc y={0.27} />}
        <mesh
          geometry={G.cone}
          material={M.metal}
          position={[0.16, 0.34, -0.04]}
          rotation={[0, 0, -1.2]}
          scale={[0.08, 0.3, 0.08]}
          castShadow
        />
      </group>
    </group>
  );
}

function SpinningDisc({ y }: { y: number }) {
  const ref = useRef<THREE.Mesh>(null);
  useFrame(({ clock }) => {
    if (ref.current) ref.current.rotation.y = clock.elapsedTime * 1.6;
  });
  return (
    <mesh ref={ref} position={[0, y, 0]}>
      <cylinderGeometry args={[0.17, 0.17, 0.006, 20]} />
      <meshStandardMaterial color="#3a3935" roughness={0.6} />
    </mesh>
  );
}

/** Ferris wheel: two rims, eight cabins on spokes, turning slowly. */
function FerrisWheel({ position, reducedMotion }: { position: P3; reducedMotion: boolean }) {
  const wheel = useRef<THREE.Group>(null);
  useFrame(({ clock }) => {
    if (wheel.current && !reducedMotion) wheel.current.rotation.z = clock.elapsedTime * 0.13;
  });
  const R = 0.5;
  const spokes = Array.from({ length: 8 }, (_, i) => (i / 8) * Math.PI * 2);
  return (
    <group position={position} scale={0.92}>
      <mesh geometry={G.cyl} material={M.metal} position={[-0.26, 0.29, 0]} rotation={[0, 0, 0.52]} scale={[0.017, 0.68, 0.017]} castShadow />
      <mesh geometry={G.cyl} material={M.metal} position={[0.26, 0.29, 0]} rotation={[0, 0, -0.52]} scale={[0.017, 0.68, 0.017]} castShadow />
      <group ref={wheel} position={[0, 0.58, 0]}>
        {[-0.085, 0.085].map((z, i) => (
          <mesh key={i} position={[0, 0, z]} material={M.metal}>
            <torusGeometry args={[R, 0.011, 5, 36]} />
          </mesh>
        ))}
        {spokes.map((a, i) => (
          <mesh
            key={`s${i}`}
            geometry={G.cyl}
            material={M.metal}
            position={[Math.cos(a) * R * 0.5, Math.sin(a) * R * 0.5, 0]}
            rotation={[0, 0, a - Math.PI / 2]}
            scale={[0.005, R, 0.005]}
          />
        ))}
        {spokes.map((a, i) => (
          <group key={`c${i}`} position={[Math.cos(a) * R, Math.sin(a) * R, 0]}>
            <mesh geometry={G.cyl} material={M.metal} position={[0, -0.05, 0]} scale={[0.006, 0.1, 0.006]} />
            <mesh geometry={G.box} position={[0, -0.112, 0]} scale={[0.075, 0.062, 0.075]} castShadow>
              <meshStandardMaterial color={i % 2 ? "#cb8f78" : "#8fb3b8"} roughness={0.8} />
            </mesh>
          </group>
        ))}
        <mesh geometry={G.cyl} material={M.darkWood} position={[0, 0, 0]} rotation={[Math.PI / 2, 0, 0]} scale={[0.028, 0.2, 0.028]} />
      </group>
    </group>
  );
}

/** A single-rail coaster looping the island edge, with one car running it. */
function Coaster({ shape, reducedMotion }: { shape: IslandShape; reducedMotion: boolean }) {
  const g = (x: number, z: number) => surfaceHeight(x, z, shape);
  const curve = useMemo(() => {
    const raw: [number, number, number][] = [
      [1.34, 0.5, 0.05],
      [0.9, 1.42, 0.06],
      [-0.3, 1.66, 0.46],
      [-1.32, 1.02, 0.06],
      [-1.55, -0.1, 0.07],
      [-0.85, -1.22, 0.06],
      [0.32, -1.46, 0.06],
      [1.46, -0.52, 0.5],
      [1.62, 0.18, 0.06],
    ];
    return new THREE.CatmullRomCurve3(
      raw.map(([x, z, up]) => new THREE.Vector3(x, g(x, z) + up, z)),
      true,
      "catmullrom",
      0.35,
    );
  }, [shape]);

  return (
    <group>
      <mesh castShadow>
        <tubeGeometry args={[curve, 220, 0.015, 5, true]} />
        <meshStandardMaterial color="#939ea4" roughness={0.5} metalness={0.35} />
      </mesh>
      {[0.06, 0.18, 0.3, 0.55, 0.68, 0.8, 0.92].map((u, i) => {
        const p = curve.getPointAt(u);
        const h = Math.max(0.02, p.y - g(p.x, p.z));
        return (
          <mesh
            key={i}
            geometry={G.cyl}
            material={M.metal}
            position={[p.x, p.y - h / 2, p.z]}
            scale={[0.007, h, 0.007]}
          />
        );
      })}
      <CoasterCar curve={curve} reducedMotion={reducedMotion} />
    </group>
  );
}

function CoasterCar({ curve, reducedMotion }: { curve: THREE.CatmullRomCurve3; reducedMotion: boolean }) {
  const ref = useRef<THREE.Group>(null);
  const u = useRef(0);
  const look = useMemo(() => new THREE.Vector3(), []);
  useFrame((_, dt) => {
    const node = ref.current;
    if (!node) return;
    if (!reducedMotion) u.current = (u.current + dt * 0.055) % 1;
    const p = curve.getPointAt(u.current);
    node.position.copy(p);
    look.copy(p).add(curve.getTangentAt(u.current));
    node.lookAt(look);
  });
  return (
    <group ref={ref} scale={0.9}>
      <mesh geometry={G.box} material={M.clay} scale={[0.072, 0.048, 0.12]} castShadow />
      <mesh geometry={G.ball} material={M.white} position={[0, 0.05, 0]} scale={0.031} />
    </group>
  );
}

/** Ferris wheel, coaster and a little tent — the Fun Zone proper. The
 *  lighthouse and the seaside swing belong to the Message Island now. */
function Fun({ shape, reducedMotion, onEgg }: ThemeProps) {
  const g = (x: number, z: number) => surfaceHeight(x, z, shape);
  return (
    <group>
      <mesh geometry={G.cone} material={M.teal} position={[-0.95, g(-0.95, -0.85) + 0.42, -0.85]} scale={[0.34, 0.82, 0.34]} castShadow />
      <mesh geometry={G.cone} material={M.white} position={[-0.95, g(-0.95, -0.85) + 0.63, -0.85]} scale={[0.16, 0.4, 0.16]} />
      <group
        onClick={(e) => {
          if (!onEgg) return;
          e.stopPropagation();
          onEgg("ferris-wheel");
        }}
      >
        <FerrisWheel position={[-1.02, g(-1.02, 0.98), 0.98]} reducedMotion={reducedMotion} />
      </group>
      <Coaster shape={shape} reducedMotion={reducedMotion} />
    </group>
  );
}

function Beam({ y }: { y: number }) {
  const ref = useRef<THREE.Mesh>(null);
  useFrame(({ clock }) => {
    if (ref.current) ref.current.rotation.y = clock.elapsedTime * 0.32;
  });
  return (
    <mesh ref={ref} position={[0, y, 0]} rotation={[Math.PI / 2, 0, 0]}>
      <coneGeometry args={[0.42, 2.6, 12, 1, true]} />
      <meshBasicMaterial color="#ffe9b0" transparent opacity={0.1} depthWrite={false} side={THREE.DoubleSide} />
    </mesh>
  );
}

function SwingSeat() {
  const ref = useRef<THREE.Group>(null);
  useFrame(({ clock }) => {
    if (ref.current) ref.current.rotation.x = Math.sin(clock.elapsedTime * 1.5) * 0.32;
  });
  return (
    <group ref={ref} position={[0, 0.92, 0]}>
      <mesh geometry={G.cyl} material={M.metal} position={[-0.12, -0.29, 0]} scale={[0.008, 0.58, 0.008]} />
      <mesh geometry={G.cyl} material={M.metal} position={[0.12, -0.29, 0]} scale={[0.008, 0.58, 0.008]} />
      <mesh geometry={G.box} material={M.wood} position={[0, -0.58, 0]} scale={[0.24, 0.035, 0.11]} castShadow />
    </group>
  );
}

/** A Little Message · 一封信的岛 — a small seaside chapter: the tide pool where
 *  the collie leaves the bottle, a lighthouse, a post office, a swing facing
 *  the sea, and a wooden bridge out into the mist. */
function MessageIsland({ shape, reducedMotion, outward, onEgg }: ThemeProps) {
  const g = (x: number, z: number) => surfaceHeight(x, z, shape);
  const water = pondWaterLevel(shape);
  const [ox, oz] = outward;
  const rim = shape.radius * 0.92;
  const start = { x: ox * (rim - 0.5), z: oz * (rim - 0.5) };
  const end = { x: ox * (rim + 0.85), z: oz * (rim + 0.85) };
  const mx = (start.x + end.x) / 2;
  const mz = (start.z + end.z) / 2;
  const yaw = Math.atan2(ox, oz);
  const len = Math.hypot(end.x - start.x, end.z - start.z);
  const baseY = g(start.x, start.z);
  const postY = [0.55, 0.6, 0.65];

  return (
    <group>
      {/* ---- 漂流瓶海湾 · the basin the bottle lands in ---- */}
      <group position={[POND.x, water, POND.z]}>
        <mesh rotation={[-Math.PI / 2, 0, 0]} scale={[1, 0.92, 1]} receiveShadow>
          <circleGeometry args={[POND.r, 40]} />
          <meshStandardMaterial color="#9fcbe0" roughness={0.12} metalness={0.15} transparent opacity={0.9} />
        </mesh>
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.006, 0]}>
          <ringGeometry args={[POND.r * 0.68, POND.r * 0.73, 40]} />
          <meshBasicMaterial color="#eaf7fb" transparent opacity={0.5} depthWrite={false} side={THREE.DoubleSide} />
        </mesh>
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.007, 0]}>
          <ringGeometry args={[POND.r * 0.36, POND.r * 0.39, 40]} />
          <meshBasicMaterial color="#eaf7fb" transparent opacity={0.35} depthWrite={false} side={THREE.DoubleSide} />
        </mesh>
      </group>
      {/* shells, pebbles and a piece of driftwood on the sand */}
      <Rock position={[0.1, g(0.1, 1.55), 1.55]} scale={0.1} rot={0.4} />
      <Rock position={[1.75, g(1.75, 1.3), 1.3]} scale={0.075} rot={2.1} />
      <Rock position={[-0.2, g(-0.2, 1.15), 1.15]} scale={0.065} rot={1.2} />
      <mesh
        geometry={G.cyl}
        material={M.darkWood}
        position={[0.35, g(0.35, 1.7) + 0.02, 1.7]}
        rotation={[0, 0.7, Math.PI / 2]}
        scale={[0.025, 0.42, 0.025]}
        castShadow
      />

      {/* ---- 云海灯塔 · white lighthouse, beam turning over the clouds ---- */}
      <group position={[-0.95, g(-0.95, -0.8), -0.8]}>
        <mesh geometry={G.cyl} material={M.white} position={[0, 0.9, 0]} scale={[0.2, 1.8, 0.2]} castShadow receiveShadow />
        <mesh geometry={G.cyl} material={M.clay} position={[0, 1.2, 0]} scale={[0.208, 0.2, 0.208]} />
        <mesh geometry={G.cyl} material={M.darkWood} position={[0, 1.75, 0]} scale={[0.24, 0.05, 0.24]} />
        <mesh geometry={G.cyl} material={M.glow} position={[0, 1.88, 0]} scale={[0.15, 0.2, 0.15]} />
        <mesh geometry={G.cone} material={M.clay} position={[0, 2.08, 0]} scale={[0.2, 0.2, 0.2]} castShadow />
        <mesh geometry={G.box} material={M.darkWood} position={[0, 0.18, 0.2]} scale={[0.16, 0.36, 0.04]} />
        {!reducedMotion && <Beam y={1.88} />}
      </group>

      {/* ---- 海边小邮局 · Message Post ---- */}
      <group position={[-0.9, g(-0.9, 0.9), 0.9]} rotation={[0, -0.3, 0]}>
        <mesh geometry={G.box} material={M.wood} position={[0, 0.3, 0]} scale={[0.6, 0.6, 0.5]} castShadow receiveShadow />
        <mesh geometry={G.cone} material={M.clay} position={[0, 0.78, 0]} rotation={[0, Math.PI / 4, 0]} scale={[0.52, 0.36, 0.52]} castShadow />
        <mesh geometry={G.box} material={M.darkWood} position={[-0.14, 0.25, 0.26]} scale={[0.18, 0.42, 0.03]} />
        <mesh geometry={G.box} material={M.glow} position={[0.16, 0.38, 0.26]} scale={[0.12, 0.13, 0.03]} />
        {/* the Message Post sign */}
        <mesh geometry={G.cyl} material={M.darkWood} position={[0.5, 0.32, 0.28]} scale={[0.022, 0.64, 0.022]} />
        <mesh geometry={G.box} material={M.canvas} position={[0.5, 0.62, 0.28]} scale={[0.32, 0.15, 0.02]} />
      </group>

      {/* ---- 海风秋千 · a swing facing the sea ---- */}
      <group position={[0.35, g(0.35, -1.4), -1.4]} rotation={[0, 0.2, 0]}>
        <mesh geometry={G.cyl} material={M.darkWood} position={[-0.4, 0.46, 0]} scale={[0.03, 0.92, 0.03]} castShadow />
        <mesh geometry={G.cyl} material={M.darkWood} position={[0.4, 0.46, 0]} scale={[0.03, 0.92, 0.03]} castShadow />
        <mesh geometry={G.cyl} material={M.wood} position={[0, 0.92, 0]} rotation={[0, 0, Math.PI / 2]} scale={[0.024, 0.86, 0.024]} castShadow />
        {!reducedMotion ? (
          <SwingSeat />
        ) : (
          <mesh geometry={G.box} material={M.wood} position={[0, 0.62, 0]} scale={[0.18, 0.03, 0.09]} />
        )}
      </group>

      {/* ---- 远方木桥 · deck + posts ---- */}
      <group position={[mx, baseY, mz]} rotation={[0, yaw, 0]}>
        <mesh geometry={G.box} material={M.wood} position={[0, 0.06, 0]} scale={[len, 0.07, 0.44]} castShadow receiveShadow />
        {postY.map((p, i) => (
          <mesh
            key={i}
            geometry={G.cyl}
            material={M.darkWood}
            position={[len / 2 - i * 0.42, -0.18 - i * 0.12, 0]}
            scale={[0.035, 0.5, 0.035]}
            castShadow
          />
        ))}
        {[-1, 1].map((s) => (
          <mesh key={s} geometry={G.cyl} material={M.darkWood} position={[len / 2 - 0.1, 0.3, s * 0.2]} scale={[0.028, 0.48, 0.028]} castShadow />
        ))}
      </group>

      {/* rowing boat moored at the tip */}
      <group position={[end.x + ox * 0.25, baseY - 0.22, end.z + oz * 0.25]} rotation={[0, yaw + 0.35, 0]}>
        <mesh geometry={G.ball} material={M.darkWood} position={[0, 0.04, 0]} scale={[0.17, 0.1, 0.36]} castShadow />
        <mesh geometry={G.box} material={M.wood} position={[0, 0.1, 0]} scale={[0.24, 0.02, 0.5]} />
        <mesh geometry={G.cyl} material={M.wood} position={[0, 0.34, 0]} scale={[0.012, 0.46, 0.012]} />
        <mesh geometry={G.box} material={M.canvas} position={[0, 0.42, 0.06]} scale={[0.012, 0.26, 0.22]} />
      </group>

      {/* mailbox */}
      <group
        position={[ox * 0.55, g(ox * 0.55, oz * 0.55), -oz * 0.75]}
        onClick={(e) => {
          if (!onEgg) return;
          e.stopPropagation();
          onEgg("mailbox");
        }}
      >
        <mesh geometry={G.cyl} material={M.darkWood} position={[0, 0.3, 0]} scale={[0.032, 0.6, 0.032]} castShadow />
        <mesh geometry={G.box} material={M.clay} position={[0, 0.68, 0]} scale={[0.19, 0.16, 0.13]} castShadow />
        <mesh geometry={G.box} material={M.ink} position={[0, 0.68, 0.07]} scale={[0.13, 0.02, 0.01]} />
      </group>

      {/* bench facing the water */}
      <group position={[ox * 0.2, g(ox * 0.2, -oz * 0.6), -oz * 0.6]} rotation={[0, yaw, 0]}>
        <mesh geometry={G.box} material={M.wood} position={[0, 0.16, 0]} scale={[0.5, 0.035, 0.14]} castShadow />
        <mesh geometry={G.box} material={M.wood} position={[0, 0.3, -0.07]} scale={[0.5, 0.14, 0.03]} />
        {[-0.2, 0.2].map((x) => (
          <mesh key={x} geometry={G.box} material={M.darkWood} position={[x, 0.08, 0]} scale={[0.04, 0.16, 0.12]} />
        ))}
      </group>
      {!reducedMotion && <Lantern x={-ox * 0.5} z={-oz * 0.9} g={g} />}
    </group>
  );
}

function Lantern({ x, z, g }: { x: number; z: number; g: (x: number, z: number) => number }) {
  return (
    <group position={[x, g(x, z), z]}>
      <mesh geometry={G.cyl} material={M.darkWood} position={[0, 0.42, 0]} scale={[0.024, 0.84, 0.024]} castShadow />
      <mesh geometry={G.box} material={M.glow} position={[0, 0.88, 0]} scale={[0.09, 0.11, 0.09]} />
      <mesh geometry={G.cone} material={M.darkWood} position={[0, 0.96, 0]} scale={[0.09, 0.07, 0.09]} />
      <pointLight position={[0, 0.88, 0]} intensity={0.35} distance={2.2} color="#ffdca8" />
    </group>
  );
}

/** Picks the decoration set that gives each island its own character. */
export function IslandTheme(props: ThemeProps & { id: string }) {
  switch (props.id) {
    case "gallery":
      return <Gallery {...props} />;
    case "collections":
      return <Collections {...props} />;
    case "fun":
      return <Fun {...props} />;
    case "community":
      return <MessageIsland {...props} />;
    default:
      return null;
  }
}
