import { useRef, type RefObject } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

type V3 = [number, number, number];

const hash = (n: number) => {
  const s = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return s - Math.floor(s);
};

const smooth = (a: number, b: number, x: number) => {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
};

/* ---------------------------------------------------------------- birds */

/** The bird's body, split out so the bottle courier can fly the same species. */
export function BirdBody({
  wings,
  tail,
}: {
  wings: [RefObject<THREE.Mesh | null>, RefObject<THREE.Mesh | null>];
  tail: RefObject<THREE.Mesh | null>;
}) {
  const [wl, wr] = wings;
  return (
    <>
      {/* body: tapered teardrop, nose first */}
      <mesh castShadow scale={[0.82, 0.78, 1.45]}>
        <sphereGeometry args={[0.06, 10, 8]} />
        <meshStandardMaterial color="#f8f5ef" roughness={0.9} />
      </mesh>
      {/* head */}
      <mesh position={[0, 0.028, 0.075]} castShadow>
        <sphereGeometry args={[0.04, 10, 8]} />
        <meshStandardMaterial color="#fffdf8" roughness={0.9} />
      </mesh>
      {/* beak */}
      <mesh position={[0, 0.018, 0.114]} rotation={[Math.PI / 2, 0, 0]}>
        <coneGeometry args={[0.014, 0.042, 6]} />
        <meshStandardMaterial color="#e8b169" roughness={0.7} />
      </mesh>
      {/* wings: flat but volumetric, narrowing to a tip */}
      <mesh ref={wl} position={[-0.075, 0.012, -0.005]} rotation={[0, 0.12, 0]} scale={[1.25, 0.14, 0.62]}>
        <sphereGeometry args={[0.085, 8, 6]} />
        <meshStandardMaterial color="#f2ede3" roughness={0.95} />
      </mesh>
      <mesh ref={wr} position={[0.075, 0.012, -0.005]} rotation={[0, -0.12, 0]} scale={[1.25, 0.14, 0.62]}>
        <sphereGeometry args={[0.085, 8, 6]} />
        <meshStandardMaterial color="#f2ede3" roughness={0.95} />
      </mesh>
      {/* tail fan */}
      <mesh ref={tail} position={[0, 0.005, -0.088]} rotation={[-0.2, 0, 0]} scale={[1.6, 1, 0.4]}>
        <coneGeometry args={[0.036, 0.075, 5]} />
        <meshStandardMaterial color="#eae3d6" roughness={0.95} />
      </mesh>
    </>
  );
}

function Bird({
  radius,
  height,
  speed,
  phase,
  reducedMotion,
}: {
  radius: number;
  height: number;
  speed: number;
  phase: number;
  reducedMotion?: boolean | undefined;
}) {
  const g = useRef<THREE.Group>(null);
  const wl = useRef<THREE.Mesh>(null);
  const wr = useRef<THREE.Mesh>(null);
  const tail = useRef<THREE.Mesh>(null);

  useFrame(({ clock }) => {
    if (!g.current) return;
    const t = clock.elapsedTime;
    const a = t * speed + phase;
    if (reducedMotion) {
      g.current.position.set(Math.cos(a) * radius, height, Math.sin(a) * radius);
      g.current.rotation.y = -a - Math.PI / 2;
      return;
    }
    // gentle climb/glide instead of a perfect circle
    const climb = Math.sin(a * 1.7) * 0.35 + Math.sin(a * 0.6 + phase) * 0.2;
    g.current.position.set(Math.cos(a) * radius, height + climb, Math.sin(a) * radius);
    g.current.rotation.y = -a - Math.PI / 2;
    g.current.rotation.z = Math.sin(a * 1.7 + 1.1) * 0.12;
    g.current.rotation.x = 0.12 + Math.sin(a * 2.3) * 0.05;

    // flap hard for a moment, then glide
    const beat = Math.sin(t * 1.3 + phase) > 0.1 ? 1 : 0.18;
    const flap = Math.sin(t * 10.5 + phase) * 0.55 * beat;
    if (wl.current) wl.current.rotation.z = flap;
    if (wr.current) wr.current.rotation.z = -flap;
    if (tail.current) tail.current.rotation.x = -0.2 + Math.sin(t * 3.2 + phase) * 0.1;
  });

  return (
    <group ref={g} position={[radius, height, 0]}>
      <BirdBody wings={[wl, wr]} tail={tail} />
    </group>
  );
}

/** Birds circling the archipelago, high enough to read as sky life. */
export function Birds({ reducedMotion }: { reducedMotion?: boolean | undefined }) {
  const flock = [
    { radius: 11, height: 5.5, speed: 0.19, phase: 0 },
    { radius: 13.5, height: 6.8, speed: 0.15, phase: 2.1 },
    { radius: 8.5, height: 4.6, speed: 0.23, phase: 4.3 },
    { radius: 15, height: 7.4, speed: 0.13, phase: 5.6 },
  ];
  return (
    <>
      {flock.map((b, i) => (
        <Bird key={i} {...b} reducedMotion={reducedMotion} />
      ))}
    </>
  );
}

/* ----------------------------------------------------------- butterflies */

function Butterfly({
  anchor,
  seed,
  ground,
  reducedMotion,
}: {
  anchor: V3;
  seed: number;
  ground: (x: number, z: number) => number;
  reducedMotion?: boolean | undefined;
}) {
  const g = useRef<THREE.Group>(null);
  const wl = useRef<THREE.Mesh>(null);
  const wr = useRef<THREE.Mesh>(null);

  useFrame(({ clock }) => {
    const node = g.current;
    if (!node) return;
    const t = clock.elapsedTime;
    const x = anchor[0] + Math.sin(t * 0.55 + seed) * 0.85;
    const z = anchor[2] + Math.cos(t * 0.42 + seed * 1.7) * 0.85;
    const y = ground(x, z) + 0.5 + (reducedMotion ? 0 : Math.sin(t * 1.7 + seed) * 0.13);
    node.position.set(x, y, z);
    if (!reducedMotion) {
      const flap = Math.sin(t * 15 + seed) * 0.95;
      if (wl.current) wl.current.rotation.z = flap;
      if (wr.current) wr.current.rotation.z = -flap;
      node.rotation.y = Math.sin(t * 0.7 + seed) * 1.2;
    }
  });

  return (
    <group ref={g} position={anchor} scale={0.8}>
      <mesh>
        <sphereGeometry args={[0.022, 6, 5]} />
        <meshStandardMaterial color="#e8c877" roughness={0.6} />
      </mesh>
      <mesh ref={wl} position={[-0.035, 0.01, 0]} scale={[1, 1, 1]}>
        <sphereGeometry args={[0.05, 6, 5]} />
        <meshStandardMaterial color="#f6e2a8" roughness={0.8} />
      </mesh>
      <mesh ref={wr} position={[0.035, 0.01, 0]} scale={[1, 1, 1]}>
        <sphereGeometry args={[0.05, 6, 5]} />
        <meshStandardMaterial color="#f6e2a8" roughness={0.8} />
      </mesh>
    </group>
  );
}

export function Butterflies({
  anchors,
  ground,
  reducedMotion,
}: {
  anchors: V3[];
  ground: (x: number, z: number) => number;
  reducedMotion?: boolean | undefined;
}) {
  return (
    <>
      {anchors.map((a, i) => (
        <Butterfly key={i} anchor={a} seed={i * 1.7 + 0.6} ground={ground} reducedMotion={reducedMotion} />
      ))}
    </>
  );
}

/* --------------------------------------------------------------- rabbit */

/**
 * Sits still most of the time, then makes one hop to a new spot and settles.
 * Position is quantised per hop so it never drifts while standing.
 */
function Rabbit({
  anchor,
  seed,
  ground,
  reducedMotion,
}: {
  anchor: V3;
  seed: number;
  ground: (x: number, z: number) => number;
  reducedMotion?: boolean | undefined;
}) {
  const g = useRef<THREE.Group>(null);
  const head = useRef<THREE.Group>(null);
  const earL = useRef<THREE.Mesh>(null);
  const earR = useRef<THREE.Mesh>(null);
  const cycle = 2.6 + hash(seed) * 2.2;
  const hopWindow = 0.3; // fraction of the cycle spent in the air
  const spot = (k: number) => ({
    x: anchor[0] + (hash(seed * 7.3 + k * 3.7) - 0.5) * 0.85,
    z: anchor[2] + (hash(seed * 11.1 + k * 5.1) - 0.5) * 0.85,
  });

  useFrame(({ clock }) => {
    const node = g.current;
    if (!node) return;
    const t = clock.elapsedTime + seed * 4.3;
    const n = Math.floor(t / cycle);
    const hp = (t % cycle) / cycle;
    const air = hp < hopWindow ? Math.sin((hp / hopWindow) * Math.PI) : 0;
    const prev = spot(n - 1);
    const next = spot(n);
    const k = smooth(0, hopWindow, hp);
    const x = prev.x + (next.x - prev.x) * k;
    const z = prev.z + (next.z - prev.z) * k;
    node.position.set(x, ground(x, z) + 0.02 + air * 0.17, z);

    if (reducedMotion) return;
    // face the direction of travel only while airborne
    const want = Math.atan2(next.x - prev.x, next.z - prev.z);
    node.rotation.y = want + Math.sin(t * 0.7 + seed) * 0.18 * (1 - air);
    // ears fold back in flight, flick when idle
    const idle = 1 - air;
    if (earL.current) earL.current.rotation.x = -0.15 + air * 0.55 + Math.sin(t * 2.7 + seed) * 0.05 * idle;
    if (earR.current) earR.current.rotation.x = -0.15 + air * 0.55 + Math.sin(t * 2.7 + seed + 0.9) * 0.05 * idle;
    if (head.current) head.current.rotation.y = Math.sin(t * 0.55 + seed) * 0.45 * idle;
  });

  return (
    <group ref={g} position={anchor} scale={0.42}>
      <mesh castShadow scale={[1, 0.94, 1.2]}>
        <sphereGeometry args={[0.16, 12, 10]} />
        <meshStandardMaterial color="#efe6d8" roughness={0.9} />
      </mesh>
      <mesh position={[0, 0.04, -0.19]}>
        <sphereGeometry args={[0.06, 8, 6]} />
        <meshStandardMaterial color="#fffaf2" roughness={0.95} />
      </mesh>
      <group ref={head} position={[0, 0.14, 0.15]}>
        <mesh castShadow>
          <sphereGeometry args={[0.105, 12, 10]} />
          <meshStandardMaterial color="#efe6d8" roughness={0.9} />
        </mesh>
        <mesh ref={earL} position={[-0.042, 0.14, -0.01]} rotation={[-0.15, 0, 0.2]} scale={[0.62, 2.1, 0.42]}>
          <sphereGeometry args={[0.06, 8, 8]} />
          <meshStandardMaterial color="#efe6d8" roughness={0.9} />
        </mesh>
        <mesh ref={earR} position={[0.042, 0.14, -0.01]} rotation={[-0.15, 0, -0.2]} scale={[0.62, 2.1, 0.42]}>
          <sphereGeometry args={[0.06, 8, 8]} />
          <meshStandardMaterial color="#efe6d8" roughness={0.9} />
        </mesh>
        <mesh position={[-0.046, 0.026, 0.086]}>
          <sphereGeometry args={[0.017, 6, 5]} />
          <meshStandardMaterial color="#3d3730" roughness={0.4} />
        </mesh>
        <mesh position={[0.046, 0.026, 0.086]}>
          <sphereGeometry args={[0.017, 6, 5]} />
          <meshStandardMaterial color="#3d3730" roughness={0.4} />
        </mesh>
        <mesh position={[0, 0.004, 0.1]} rotation={[Math.PI / 2, 0, 0]}>
          <coneGeometry args={[0.012, 0.022, 5]} />
          <meshStandardMaterial color="#d8a89a" roughness={0.7} />
        </mesh>
      </group>
    </group>
  );
}

export function Rabbits({
  anchors,
  ground,
  reducedMotion,
}: {
  anchors: V3[];
  ground: (x: number, z: number) => number;
  reducedMotion?: boolean | undefined;
}) {
  return (
    <>
      {anchors.map((a, i) => (
        <Rabbit key={i} anchor={a} seed={i * 2.3 + 1.1} ground={ground} reducedMotion={reducedMotion} />
      ))}
    </>
  );
}

/* ----------------------------------------------------------------- duck */

/** Paddles a stretch, coasts to a stop, looks around, then paddles on. */
function Duck({
  center,
  radius,
  seed,
  reducedMotion,
}: {
  center: V3;
  radius: number;
  seed: number;
  reducedMotion?: boolean | undefined;
}) {
  const g = useRef<THREE.Group>(null);
  const head = useRef<THREE.Group>(null);
  const ang = useRef(seed * 2.4);
  const speed = 0.5 + hash(seed) * 0.25;
  const beat = 2.2 + hash(seed + 3) * 1.6;

  useFrame(({ clock }, dt) => {
    const node = g.current;
    if (!node) return;
    const t = clock.elapsedTime + seed * 3.9;
    const cyc = (t % beat) / beat;
    // stroke for the first 60% of the beat, then coast
    const gate = cyc < 0.6 ? Math.sin((cyc / 0.6) * Math.PI) : 0;
    if (!reducedMotion) ang.current += dt * speed * (0.15 + gate * 0.85);

    const a = ang.current;
    const x = center[0] + Math.cos(a) * radius;
    const z = center[2] + Math.sin(a) * radius;
    const bob = reducedMotion ? 0 : Math.sin(t * 1.9) * 0.008;
    node.position.set(x, center[1] + 0.02 + bob, z);
    node.rotation.y = -a - Math.PI / 2;
    node.rotation.z = reducedMotion ? 0 : gate * 0.06 * Math.sin(t * 3.1);
    if (head.current && !reducedMotion) {
      head.current.rotation.y = Math.sin(t * 0.7 + seed * 2) * 0.55 * (1 - gate);
      head.current.rotation.x = gate * 0.12;
    }
  });

  return (
    <group ref={g} position={center} scale={0.5}>
      <mesh castShadow scale={[1, 0.7, 1.35]}>
        <sphereGeometry args={[0.13, 12, 10]} />
        <meshStandardMaterial color="#f4dda0" roughness={0.85} />
      </mesh>
      {/* tail flick */}
      <mesh position={[0, 0.045, -0.15]} rotation={[0.5, 0, 0]} scale={[0.9, 0.45, 0.7]}>
        <coneGeometry args={[0.05, 0.1, 6]} />
        <meshStandardMaterial color="#e7cd8e" roughness={0.9} />
      </mesh>
      <group ref={head} position={[0, 0.155, 0.085]}>
        <mesh castShadow>
          <sphereGeometry args={[0.078, 12, 10]} />
          <meshStandardMaterial color="#f8e7b8" roughness={0.85} />
        </mesh>
        <mesh position={[0, -0.008, 0.075]} rotation={[Math.PI / 2, 0, 0]} scale={[1, 1, 0.5]}>
          <coneGeometry args={[0.042, 0.095, 10]} />
          <meshStandardMaterial color="#e8a862" roughness={0.7} />
        </mesh>
        <mesh position={[-0.042, 0.022, 0.058]}>
          <sphereGeometry args={[0.013, 6, 5]} />
          <meshStandardMaterial color="#3d3730" roughness={0.4} />
        </mesh>
        <mesh position={[0.042, 0.022, 0.058]}>
          <sphereGeometry args={[0.013, 6, 5]} />
          <meshStandardMaterial color="#3d3730" roughness={0.4} />
        </mesh>
      </group>
    </group>
  );
}

export function Ducks({
  center,
  radius,
  reducedMotion,
}: {
  center: V3;
  radius: number;
  reducedMotion?: boolean | undefined;
}) {
  return (
    <>
      <Duck center={center} radius={radius} seed={0.4} reducedMotion={reducedMotion} />
      <Duck center={center} radius={radius * 0.6} seed={3.1} reducedMotion={reducedMotion} />
    </>
  );
}

/* ------------------------------------------------------------- squirrel */

/** Scampers to a new spot, freezes upright, flicks its tail, then darts again. */
function Squirrel({
  anchor,
  seed,
  ground,
  reducedMotion,
}: {
  anchor: V3;
  seed: number;
  ground: (x: number, z: number) => number;
  reducedMotion?: boolean | undefined;
}) {
  const g = useRef<THREE.Group>(null);
  const tail = useRef<THREE.Group>(null);
  const cycle = 3.1 + hash(seed) * 2.4;
  const runWindow = 0.42;
  const span = 0.55 + hash(seed) * 0.45;
  const spot = (k: number) => ({
    x: anchor[0] + (hash(seed * 5.9 + k * 4.3) - 0.5) * span * 2,
    z: anchor[2] + (hash(seed * 9.7 + k * 2.9) - 0.5) * span * 2,
  });

  useFrame(({ clock }) => {
    const node = g.current;
    if (!node) return;
    const t = clock.elapsedTime + seed * 6.1;
    const n = Math.floor(t / cycle);
    const hp = (t % cycle) / cycle;
    const prev = spot(n - 1);
    const next = spot(n);
    const k = smooth(0, runWindow, hp);
    const x = prev.x + (next.x - prev.x) * k;
    const z = prev.z + (next.z - prev.z) * k;
    node.position.set(x, ground(x, z) + 0.015, z);

    if (reducedMotion) return;
    const moving = hp < runWindow;
    const want = Math.atan2(next.x - prev.x, next.z - prev.z);
    node.rotation.y = want + (moving ? 0 : Math.sin(t * 0.8 + seed) * 0.5);
    if (tail.current) {
      // tail streams out while running, pops upright when it stops
      const up = moving ? -0.55 : -0.05;
      tail.current.rotation.x = up + Math.sin(t * (moving ? 9 : 5.2)) * (moving ? 0.08 : 0.14);
      tail.current.rotation.z = Math.sin(t * 3.7) * 0.08;
    }
  });

  return (
    <group ref={g} position={anchor} scale={0.45}>
      <mesh castShadow scale={[0.92, 1.05, 1.2]}>
        <sphereGeometry args={[0.1, 12, 10]} />
        <meshStandardMaterial color="#c08a5c" roughness={0.9} />
      </mesh>
      <mesh position={[0, 0.1, 0.075]} castShadow>
        <sphereGeometry args={[0.07, 12, 10]} />
        <meshStandardMaterial color="#c99a6d" roughness={0.9} />
      </mesh>
      {/* ears */}
      <mesh position={[-0.035, 0.165, 0.055]} scale={[0.7, 1, 0.5]}>
        <sphereGeometry args={[0.028, 6, 5]} />
        <meshStandardMaterial color="#b8825a" roughness={0.9} />
      </mesh>
      <mesh position={[0.035, 0.165, 0.055]} scale={[0.7, 1, 0.5]}>
        <sphereGeometry args={[0.028, 6, 5]} />
        <meshStandardMaterial color="#b8825a" roughness={0.9} />
      </mesh>
      <mesh position={[-0.032, 0.12, 0.13]}>
        <sphereGeometry args={[0.013, 6, 5]} />
        <meshStandardMaterial color="#3d3730" roughness={0.4} />
      </mesh>
      <mesh position={[0.032, 0.12, 0.13]}>
        <sphereGeometry args={[0.013, 6, 5]} />
        <meshStandardMaterial color="#3d3730" roughness={0.4} />
      </mesh>
      {/* bushy tail */}
      <group ref={tail} position={[0, 0.03, -0.1]}>
        <mesh scale={[0.95, 1.75, 0.8]} position={[0, 0.12, -0.05]} castShadow>
          <sphereGeometry args={[0.095, 10, 8]} />
          <meshStandardMaterial color="#b07a4e" roughness={0.95} />
        </mesh>
        <mesh scale={[0.7, 0.9, 0.6]} position={[0, 0.24, -0.03]} castShadow>
          <sphereGeometry args={[0.075, 10, 8]} />
          <meshStandardMaterial color="#c08a5c" roughness={0.95} />
        </mesh>
      </group>
    </group>
  );
}

export function Squirrels({
  anchors,
  ground,
  reducedMotion,
}: {
  anchors: V3[];
  ground: (x: number, z: number) => number;
  reducedMotion?: boolean | undefined;
}) {
  return (
    <>
      {anchors.map((a, i) => (
        <Squirrel key={i} anchor={a} seed={i * 1.9 + 0.8} ground={ground} reducedMotion={reducedMotion} />
      ))}
    </>
  );
}
