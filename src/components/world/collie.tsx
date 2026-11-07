/**
 * The border collie.
 *
 * A black-and-white sheepdog that wanders the archipelago on its own: across
 * the main island, over the stepping stones, a short lap around a satellite,
 * then home again. Nothing is drawn on top of it — no label, no button, no
 * halo. Visitors find it by looking, and clicking the dog itself is the only
 * way in.
 *
 * Proportions matter here: the white parts are deliberately pushed *past* the
 * black shell. Anything tucked a hair inside disappears and the dog reads as a
 * silhouette.
 */

import { useEffect, useMemo, useRef, useState, type ReactNode, type RefObject } from "react";
import { useFrame, type ThreeEvent } from "@react-three/fiber";
import * as THREE from "three";
import { surfaceHeight, type IslandShape } from "@/lib/world/terrain";
import { albumKey, readAlbum, writeAlbum } from "@/lib/collections/store";
import { currentSession } from "@/lib/user";

export const COLLIE_BADGE = "badge-collie";

const BLACK = "#282d33";
const WHITE = "#f6f3ec";
const INK = "#14171a";

const MAIN: IslandShape = { radius: 5, height: 0.75, depth: 4.4, seed: 1.3, bump: 0.12 };

/** Satellite centres, kept in step with REGIONS_3D in WorldScene. */
const ISLES: { p: [number, number, number]; r: number }[] = [
  { p: [-11, -1.0, -5], r: 2.6 },
  { p: [8.5, 1.1, -10], r: 2.2 },
  { p: [12.5, -1.5, 3], r: 2.2 },
  { p: [-6.5, -1.8, 8.5], r: 2.0 },
];

type Seg = { a: THREE.Vector3; b: THREE.Vector3; air: boolean; dwell: number; len: number };

const onMain = (x: number, z: number) => surfaceHeight(x, z, MAIN) + 0.03;

/**
 * Where Princess waits while the opening guide speaks. Exporting the spot lets
 * the guide camera frame exactly the same place, so she stays in the shot
 * instead of wandering off mid-sentence. The home island's pond sits near
 * (2, 1.4), so she waits on the other side of it.
 */
export const GUIDE_SPOT = {
  x: -0.6,
  z: 1.5,
  y: onMain(-0.6, 1.5),
  /** Facing the guide camera, which sits at +x / +z from here. */
  yaw: Math.atan2(1.25, 2.0),
};

/**
 * One closed tour: centre → home edge → over the stones → a lap around a
 * satellite → over the stones → back. Segments are walked in order and the dog
 * pauses at the end of each one, which keeps it from ever sliding.
 */
function buildRoute(): Seg[] {
  const segs: { a: THREE.Vector3; b: THREE.Vector3; air: boolean; dwell: number }[] = [];
  const home = () => new THREE.Vector3(0, onMain(0, 0), 0);
  let prev = home();

  for (const isle of ISLES) {
    const [ix, iy, iz] = isle.p;
    const d = Math.hypot(ix, iz) || 1;
    const ux = ix / d;
    const uz = iz / d;

    const px = ux * 3.5;
    const pz = uz * 3.5;
    const edge = new THREE.Vector3(px, onMain(px, pz), pz);
    segs.push({ a: prev, b: edge, air: false, dwell: 0.9 });

    const sx = ix - ux * isle.r * 0.66;
    const sz = iz - uz * isle.r * 0.66;
    const landing = new THREE.Vector3(sx, iy + 0.05, sz);
    segs.push({ a: edge, b: landing, air: true, dwell: 2.2 });

    const ang = Math.atan2(uz, ux) + 0.95;
    const rr = isle.r * 0.56;
    const lap = new THREE.Vector3(ix + Math.cos(ang) * rr, iy + 0.05, iz + Math.sin(ang) * rr);
    segs.push({ a: landing, b: lap, air: false, dwell: 1.8 });

    const back = new THREE.Vector3(px, onMain(px, pz), pz);
    segs.push({ a: lap, b: back, air: true, dwell: 0.8 });
    prev = back;
  }

  segs.push({ a: prev, b: home(), air: false, dwell: 2.2 });

  return segs.map((s) => ({ ...s, len: Math.max(0.001, s.a.distanceTo(s.b)) }));
}

type BodyProps = {
  body: RefObject<THREE.Group | null>;
  head: RefObject<THREE.Group | null>;
  tail: RefObject<THREE.Group | null>;
  legs: RefObject<(THREE.Group | null)[]>;
  /** Rendered inside the head group — used to put a bottle in the dog's mouth. */
  mouth?: ReactNode;
};

/** The dog's geometry, shared by the wanderer and the bottle courier. */
export function CollieBody({ body, head, tail, legs, mouth }: BodyProps) {
  return (
    <group ref={body}>
      {/* barrel: black back */}
      <mesh castShadow position={[0, 0.21, -0.01]} scale={[0.82, 0.82, 1.3]}>
        <sphereGeometry args={[0.13, 16, 12]} />
        <meshStandardMaterial color={BLACK} roughness={0.86} />
      </mesh>
      {/* white bib, pushed past the black shell so it actually shows */}
      <mesh castShadow position={[0, 0.2, 0.118]} scale={[0.58, 0.74, 0.52]}>
        <sphereGeometry args={[0.12, 14, 10]} />
        <meshStandardMaterial color={WHITE} roughness={0.9} />
      </mesh>
      {/* white ruff at the neck */}
      <mesh position={[0, 0.285, 0.1]} scale={[0.6, 0.4, 0.5]}>
        <sphereGeometry args={[0.1, 12, 10]} />
        <meshStandardMaterial color={WHITE} roughness={0.92} />
      </mesh>

      <group ref={head} position={[0, 0.335, 0.155]}>
        <mesh castShadow scale={[0.86, 0.82, 0.96]}>
          <sphereGeometry args={[0.095, 16, 12]} />
          <meshStandardMaterial color={BLACK} roughness={0.86} />
        </mesh>
        {/* the white blaze that makes a collie a collie */}
        <mesh position={[0, 0.006, 0.062]} scale={[0.42, 0.86, 0.5]}>
          <sphereGeometry args={[0.076, 12, 10]} />
          <meshStandardMaterial color={WHITE} roughness={0.9} />
        </mesh>
        <mesh position={[0, -0.038, 0.098]} scale={[0.72, 0.58, 0.98]}>
          <sphereGeometry args={[0.06, 14, 10]} />
          <meshStandardMaterial color={WHITE} roughness={0.9} />
        </mesh>
        <mesh position={[0, -0.02, 0.152]}>
          <sphereGeometry args={[0.019, 10, 8]} />
          <meshStandardMaterial color={INK} roughness={0.35} />
        </mesh>
        <mesh position={[-0.043, 0.024, 0.082]}>
          <sphereGeometry args={[0.014, 10, 8]} />
          <meshStandardMaterial color={INK} roughness={0.3} />
        </mesh>
        <mesh position={[0.043, 0.024, 0.082]}>
          <sphereGeometry args={[0.014, 10, 8]} />
          <meshStandardMaterial color={INK} roughness={0.3} />
        </mesh>
        {/* semi-pricked ears */}
        <mesh castShadow position={[-0.062, 0.082, -0.008]} rotation={[0, 0, 0.34]} scale={[0.62, 1.2, 0.46]}>
          <coneGeometry args={[0.04, 0.095, 9]} />
          <meshStandardMaterial color={BLACK} roughness={0.86} />
        </mesh>
        <mesh castShadow position={[0.062, 0.082, -0.008]} rotation={[0, 0, -0.34]} scale={[0.62, 1.2, 0.46]}>
          <coneGeometry args={[0.04, 0.095, 9]} />
          <meshStandardMaterial color={BLACK} roughness={0.86} />
        </mesh>
        {mouth}
      </group>

      {/* four white socks hanging below the barrel, each on its own pivot */}
      {[
        [-0.052, 0.075],
        [0.052, 0.075],
        [-0.052, -0.078],
        [0.052, -0.078],
      ].map(([lx, lz], i) => (
        <group
          key={i}
          ref={(el) => {
            legs.current[i] = el;
          }}
          position={[lx!, 0.145, lz!]}
        >
          <mesh castShadow position={[0, -0.072, 0]}>
            <capsuleGeometry args={[0.021, 0.1, 4, 8]} />
            <meshStandardMaterial color={WHITE} roughness={0.92} />
          </mesh>
          <mesh position={[0, -0.126, 0.008]} scale={[1, 0.55, 1.25]}>
            <sphereGeometry args={[0.024, 8, 6]} />
            <meshStandardMaterial color={WHITE} roughness={0.92} />
          </mesh>
        </group>
      ))}

      {/* tail: a black plume rising out of the rump, leaning back with the
          wag; the white tip sits at the capsule's actual end, not a ball
          floating in the air behind the dog */}
      <group ref={tail} position={[0, 0.25, -0.155]}>
        <mesh castShadow position={[0, 0.085, -0.005]} scale={[0.8, 1, 0.8]}>
          <capsuleGeometry args={[0.027, 0.13, 4, 8]} />
          <meshStandardMaterial color={BLACK} roughness={0.9} />
        </mesh>
        <mesh position={[0, 0.16, -0.02]}>
          <sphereGeometry args={[0.024, 10, 8]} />
          <meshStandardMaterial color={WHITE} roughness={0.9} />
        </mesh>
      </group>
    </group>
  );
}

type Props = {
  reducedMotion: boolean | undefined;
  /** Fired the first time a visitor actually clicks the dog. */
  onFound: () => void;
  /** Every click, with where the dog stood: the camera frames her for a moment. */
  onPoke?: ((at: { x: number; y: number; z: number }) => void) | undefined;
  /**
   * During the opening guide she stops touring and waits at GUIDE_SPOT, facing
   * the camera, so the close-up is actually of her and not of an empty meadow.
   */
  stay?: boolean | undefined;
};

export function Collie({ reducedMotion, onFound, onPoke, stay = false }: Props) {
  const root = useRef<THREE.Group>(null);
  const body = useRef<THREE.Group>(null);
  const head = useRef<THREE.Group>(null);
  const tail = useRef<THREE.Group>(null);
  const legs = useRef<(THREE.Group | null)[]>([null, null, null, null]);
  const aura = useRef<THREE.Mesh>(null);
  const auraMat = useRef<THREE.MeshBasicMaterial>(null);

  const route = useMemo(buildRoute, []);
  const state = useRef({ seg: 0, u: 0, wait: 1.4, yaw: 0, phase: 0, greet: 0, unlock: 0, sit: 0 });
  const claimedRef = useRef(false);

  useEffect(() => {
    const session = currentSession();
    if (!session) return;
    if (readAlbum(albumKey(session)).badges.includes(COLLIE_BADGE)) claimedRef.current = true;
  }, []);

  const poke = (e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation();
    // A drag that ends on the dog is not a click.
    if (e.delta > 8) return;
    state.current.greet = 2.2;
    // She stops where she stands, sits, and wags; the camera leans in from
    // WorldScene and lets go two seconds later.
    const at = root.current?.position;
    if (at) onPoke?.({ x: at.x, y: at.y, z: at.z });
    if (claimedRef.current) return;
    claimedRef.current = true;
    state.current.unlock = 1.9;
    const session = currentSession();
    if (session) {
      const key = albumKey(session);
      const album = readAlbum(key);
      if (!album.badges.includes(COLLIE_BADGE)) {
        writeAlbum(key, { ...album, badges: [...album.badges, COLLIE_BADGE] });
      }
    }
    onFound();
  };

  useFrame(({ clock }, dt) => {
    const g = root.current;
    if (!g) return;
    const s = state.current;
    const step = Math.min(dt, 0.05);
    const t = clock.elapsedTime;

    const seg = route[s.seg]!;
    const moving = !stay && s.wait <= 0 && s.greet <= 0;
    // A wandering dog, not a racing one: slow enough that a visitor can catch
    // up and tap it without chasing the pointer.
    const speed = 1.45;

    if (s.greet > 0) s.greet = Math.max(0, s.greet - step);
    else if (s.wait > 0) s.wait = Math.max(0, s.wait - step);

    // One soft blue-white bloom, the first time only: it expands out of the dog
    // and fades instead of strobing, so the badge card is the loudest thing.
    if (s.unlock > 0) s.unlock = Math.max(0, s.unlock - step);
    if (aura.current && auraMat.current) {
      const k = s.unlock / 1.9;
      aura.current.visible = k > 0.01;
      aura.current.scale.setScalar(0.34 + (1 - k) * 1.5);
      auraMat.current.opacity = k * 0.5;
    }

    if (moving) {
      s.u += (step * speed) / seg.len;
      if (s.u >= 1) {
        s.u = 0;
        s.seg = (s.seg + 1) % route.length;
        s.wait = reducedMotion ? 0 : route[s.seg]!.dwell;
      }
    }

    const a = seg.a;
    const b = seg.b;
    const k = Math.min(1, Math.max(0, s.u));
    const x = stay ? GUIDE_SPOT.x : a.x + (b.x - a.x) * k;
    const z = stay ? GUIDE_SPOT.z : a.z + (b.z - a.z) * k;
    let y = stay ? GUIDE_SPOT.y : a.y + (b.y - a.y) * k;
    if (!stay && seg.air) y += Math.sin(Math.PI * k) * 0.85;

    g.position.set(x, y, z);

    const want = stay ? GUIDE_SPOT.yaw : Math.atan2(b.x - a.x, b.z - a.z);
    let diff = want - s.yaw;
    while (diff > Math.PI) diff -= Math.PI * 2;
    while (diff < -Math.PI) diff += Math.PI * 2;
    s.yaw += diff * Math.min(1, step * 6);
    g.rotation.y = s.yaw;

    // trot cycle only advances while the paws are actually on the ground
    if (!reducedMotion && moving && !seg.air) s.phase += step * 11;
    const p = s.phase;
    const swing = moving && !seg.air ? 0.5 : 0;

    // A click drops her into a sit — back paws folded under, chest lifted, tail
    // going — until the greet wears off.
    const sitTarget = s.greet > 0 ? 1 : 0;
    s.sit += (sitTarget - s.sit) * Math.min(1, step * 7);
    const sit = s.sit;

    if (body.current) {
      body.current.position.y = -0.105 * sit + (moving && !seg.air ? Math.abs(Math.sin(p)) * 0.012 : 0);
      body.current.rotation.x = -0.3 * sit;
    }

    const set = (i: number, offset: number, rear: boolean) => {
      const leg = legs.current[i];
      if (!leg) return;
      const target = (rear ? -1.4 : 0) * sit + Math.sin(p + offset) * swing;
      leg.rotation.x += (target - leg.rotation.x) * Math.min(1, step * 14);
    };
    set(0, 0, false);
    set(3, 0, true);
    set(1, Math.PI, false);
    set(2, Math.PI, true);

    if (reducedMotion) return;

    const wagging = s.greet > 0 ? 14 : moving ? 7 : 3.4;
    const waggingAmount = s.greet > 0 ? 0.5 : moving ? 0.28 : 0.16;
    if (tail.current) {
      tail.current.rotation.y = Math.sin(t * wagging) * waggingAmount;
      tail.current.rotation.x = -0.25 + Math.sin(t * wagging * 0.7) * 0.08;
    }

    if (head.current) {
      if (s.greet > 0) {
        head.current.rotation.y += (0 - head.current.rotation.y) * Math.min(1, step * 5);
        head.current.rotation.z = Math.sin(t * 3.4) * 0.16;
      } else if (moving) {
        head.current.rotation.y += (0 - head.current.rotation.y) * Math.min(1, step * 4);
        head.current.rotation.z += (0 - head.current.rotation.z) * Math.min(1, step * 4);
      } else {
        head.current.rotation.y = Math.sin(t * 0.9) * 0.38;
        head.current.rotation.z = Math.sin(t * 0.5) * 0.05;
      }
    }
  });

  return (
    <group ref={root} name="collie" scale={0.78} onClick={poke}>
      <CollieBody body={body} head={head} tail={tail} legs={legs} />

      {/* One-shot unlock bloom: a flat ring that opens outward and fades. */}
      <mesh ref={aura} position={[0, 0.26, 0]} rotation={[-Math.PI / 2, 0, 0]} visible={false}>
        <ringGeometry args={[0.34, 0.46, 40]} />
        <meshBasicMaterial
          ref={auraMat}
          color="#d8e8ff"
          transparent
          opacity={0}
          depthWrite={false}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* A hit volume noticeably larger than the dog. Invisible but still
          raycast, so a tap anywhere near the body, head or tail counts. The dog
          is small and always moving — a tight box makes it a pixel hunt. */}
      <mesh position={[0, 0.22, 0.02]}>
        <boxGeometry args={[0.46, 0.58, 0.9]} />
        <meshBasicMaterial transparent opacity={0} depthWrite={false} />
      </mesh>
    </group>
  );
}

export function useCollieClaimed(): boolean {
  const [claimed, setClaimed] = useState(false);
  useEffect(() => {
    const session = currentSession();
    if (!session) return;
    setClaimed(readAlbum(albumKey(session)).badges.includes(COLLIE_BADGE));
  }, []);
  return claimed;
}
