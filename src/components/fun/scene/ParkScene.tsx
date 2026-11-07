/**
 * The Fun Zone park: three little facilities on one grassy diorama.
 *
 * Registered in lib/fun/funZone.ts, so adding a fourth game later is a data
 * change, not a scene rewrite. Locked facilities stay visible; clicking one
 * explains what has to be finished first. The unlock animation follows the
 * fixed five beats: shake → open → disappear → lights on → soft glow.
 */

import { useEffect, useRef, type RefObject } from "react";
import { useFrame, type ThreeEvent } from "@react-three/fiber";
import * as THREE from "three";
import { GAMES, type GameId } from "@/lib/fun/funZone";
import {
  Bush,
  Flower,
  GrassTuft,
  Ground,
  Lantern,
  PALETTE,
  Rock,
  RoundedBox,
  Star,
  Tree,
  WoodSign,
} from "./shared";

type Props = {
  unlocked: Record<GameId, boolean>;
  justUnlocked: GameId | null;
  onSelect: (id: GameId) => void;
  reducedMotion: boolean;
};

const SPOTS: Record<GameId, [number, number, number]> = {
  "world-explorer": [-2.75, 0, 0.35],
  "tiny-maze": [0, 0, -1.55],
  "choice-adventure": [2.75, 0, 0.35],
};

/* ------------------------------------------------------------- facility art */

function ExplorerCabin() {
  return (
    <group>
      {/* cabin */}
      <RoundedBox args={[1.12, 0.9, 0.92]} radius={0.12} smoothness={3} position={[0, 0.48, -0.18]} castShadow>
        <meshStandardMaterial color={PALETTE.woodLight} roughness={0.85} />
      </RoundedBox>
      <mesh position={[0, 1.06, -0.18]} rotation={[0, Math.PI / 4, 0]} castShadow>
        <coneGeometry args={[0.86, 0.55, 4]} />
        <meshStandardMaterial color={PALETTE.woodDark} roughness={0.9} />
      </mesh>
      {/* warm window */}
      <mesh position={[0, 0.56, 0.29]}>
        <boxGeometry args={[0.28, 0.28, 0.02]} />
        <meshStandardMaterial color="#ffdda0" emissive="#ffbb62" emissiveIntensity={0.75} />
      </mesh>
      {/* door */}
      <RoundedBox args={[0.3, 0.5, 0.03]} radius={0.06} smoothness={2} position={[0, 0.3, 0.29]}>
        <meshStandardMaterial color={PALETTE.woodDark} roughness={0.9} />
      </RoundedBox>
      {/* little map table in front */}
      <mesh position={[-0.68, 0.3, 0.35]} castShadow>
        <cylinderGeometry args={[0.26, 0.26, 0.06, 16]} />
        <meshStandardMaterial color={PALETTE.wood} roughness={0.85} />
      </mesh>
      <mesh position={[-0.68, 0.16, 0.35]}>
        <cylinderGeometry args={[0.05, 0.06, 0.26, 8]} />
        <meshStandardMaterial color={PALETTE.woodDark} roughness={0.9} />
      </mesh>
      <Star position={[0.58, 1.35, -0.1]} scale={0.5} />
      <WoodSign text="WORLD EXPLORER" position={[0, 1.62, 0]} width={1.85} post={false} />
    </group>
  );
}

function TinyMaze() {
  const walls: { p: [number, number, number]; s: [number, number, number] }[] = [
    { p: [-0.55, 0.19, -0.55], s: [0.9, 0.38, 0.12] },
    { p: [0.1, 0.19, -0.55], s: [0.12, 0.38, 0.8] },
    { p: [0.55, 0.19, -0.1], s: [0.9, 0.38, 0.12] },
    { p: [-0.55, 0.19, 0.35], s: [0.12, 0.38, 0.8] },
    { p: [0.05, 0.19, 0.35], s: [0.85, 0.38, 0.12] },
    { p: [-0.05, 0.19, -0.05], s: [0.12, 0.38, 0.6] },
  ];
  return (
    <group>
      <RoundedBox args={[1.55, 0.08, 1.35]} radius={0.04} smoothness={2} position={[0, 0.05, -0.1]} receiveShadow>
        <meshStandardMaterial color={PALETTE.paper} roughness={0.95} />
      </RoundedBox>
      {walls.map((w, i) => (
        <RoundedBox key={i} args={w.s} radius={0.04} smoothness={2} position={w.p} castShadow>
          <meshStandardMaterial color={i % 2 ? PALETTE.leaf : PALETTE.leafLight} roughness={0.9} />
        </RoundedBox>
      ))}
      <mesh position={[0.45, 0.16, 0.5]} castShadow>
        <sphereGeometry args={[0.1, 12, 10]} />
        <meshStandardMaterial color="#e8b9a0" roughness={0.8} />
      </mesh>
      <WoodSign text="TINY MAZE" position={[0, 1.22, -0.1]} width={1.45} post={false} />
      <mesh position={[0, 0.72, -0.1]}>
        <cylinderGeometry args={[0.035, 0.035, 0.85, 8]} />
        <meshStandardMaterial color={PALETTE.woodDark} roughness={0.9} />
      </mesh>
    </group>
  );
}

function ChoiceAdventure() {
  return (
    <group>
      <RoundedBox args={[1.5, 0.1, 1.05]} radius={0.05} smoothness={2} position={[0, 0.06, 0]} receiveShadow>
        <meshStandardMaterial color={PALETTE.paper} roughness={0.95} />
      </RoundedBox>
      {/* a path that forks into two */}
      <mesh position={[0, 0.12, 0.32]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[0.28, 0.65]} />
        <meshStandardMaterial color={PALETTE.woodLight} roughness={0.95} />
      </mesh>
      <mesh position={[-0.3, 0.12, -0.18]} rotation={[-Math.PI / 2, 0, Math.PI / 4]}>
        <planeGeometry args={[0.26, 0.75]} />
        <meshStandardMaterial color={PALETTE.woodLight} roughness={0.95} />
      </mesh>
      <mesh position={[0.3, 0.12, -0.18]} rotation={[-Math.PI / 2, 0, -Math.PI / 4]}>
        <planeGeometry args={[0.26, 0.75]} />
        <meshStandardMaterial color={PALETTE.woodLight} roughness={0.95} />
      </mesh>
      <mesh position={[0, 0.34, 0.05]} castShadow>
        <cylinderGeometry args={[0.05, 0.06, 0.6, 8]} />
        <meshStandardMaterial color={PALETTE.woodDark} roughness={0.9} />
      </mesh>
      <WoodSign text="THIS WAY" position={[-0.28, 0.68, -0.2]} rotation={[0, 0.5, 0.08]} width={0.72} post={false} />
      <WoodSign text="OR THAT" position={[0.3, 0.68, -0.2]} rotation={[0, -0.5, -0.08]} width={0.72} post={false} />
      <WoodSign text="THE LAST LIGHT" position={[0, 1.35, 0]} width={1.85} post={false} />
      <mesh position={[0, 0.92, 0]}>
        <cylinderGeometry args={[0.035, 0.035, 0.85, 8]} />
        <meshStandardMaterial color={PALETTE.woodDark} roughness={0.9} />
      </mesh>
    </group>
  );
}

/* --------------------------------------------------------------- one facility */

function Lock({ tRef, isOpen }: { tRef: RefObject<number>; isOpen: boolean }) {
  const shackle = useRef<THREE.Group>(null);
  const body = useRef<THREE.Group>(null);
  useFrame(() => {
    const t = tRef.current;
    if (!body.current) return;
    if (!isOpen) {
      // Locked: perfectly still, so the shake beat reads as an event.
      body.current.visible = true;
      body.current.position.set(0, 1.95, 0.15);
      body.current.rotation.set(0, 0, 0);
      body.current.scale.setScalar(1);
      if (shackle.current) shackle.current.rotation.z = 0;
      return;
    }
    if (t < 0 || t >= 1.3) {
      body.current.visible = false;
      return;
    }
    const shake = t < 0.5 ? Math.sin(t * 42) * 0.06 : 0;
    const scale =
      t < 0.5 ? 1 : t < 1.15 ? 1 - (t - 0.5) * 0.35 : Math.max(0, 0.77 - (t - 1.15) * 5);
    body.current.visible = scale > 0.01;
    body.current.position.set(shake, 1.95, 0.15);
    body.current.scale.setScalar(scale);
    body.current.rotation.z = t < 0.5 ? Math.sin(t * 30) * 0.09 : 0;
    if (shackle.current) {
      shackle.current.rotation.z = t >= 0.5 ? -Math.min(1, (t - 0.5) / 0.6) * 0.9 : 0;
    }
  });
  return (
    <group ref={body} position={[0, 1.95, 0.15]}>
      <group ref={shackle} position={[0, 0.16, 0]}>
        <mesh castShadow>
          <torusGeometry args={[0.11, 0.028, 8, 16, Math.PI]} />
          <meshStandardMaterial color={PALETTE.gold} metalness={0.55} roughness={0.35} />
        </mesh>
      </group>
      <RoundedBox args={[0.3, 0.25, 0.14]} radius={0.05} smoothness={3} castShadow>
        <meshStandardMaterial color={PALETTE.gold} metalness={0.5} roughness={0.35} />
      </RoundedBox>
      <mesh position={[0, 0, 0.075]}>
        <circleGeometry args={[0.035, 12]} />
        <meshStandardMaterial color={PALETTE.woodDark} roughness={0.9} />
      </mesh>
    </group>
  );
}

function Facility({
  id,
  index,
  unlocked,
  justUnlocked,
  onSelect,
  reducedMotion,
}: Props & { id: GameId; index: number }) {
  const group = useRef<THREE.Group>(null);
  const glow = useRef<THREE.Mesh>(null);
  const glowMat = useRef<THREE.MeshBasicMaterial>(null);
  const light = useRef<THREE.PointLight>(null);
  const bulbs = useRef<THREE.Group>(null);
  const hover = useRef(false);
  const anim = useRef(-1);
  const isOpen = unlocked[id] === true;

  useEffect(() => {
    if (justUnlocked === id) anim.current = 0;
  }, [justUnlocked, id]);

  useFrame((_, dt) => {
    const a = anim.current;
    if (a >= 0) {
      anim.current = reducedMotion ? 3.2 : a + Math.min(dt, 0.05);
      if (anim.current > 3.4) anim.current = -1;
    }
    const t = anim.current;

    // gentle hover lift
    if (group.current) {
      const target = hover.current && !reducedMotion ? 0.08 : 0;
      group.current.position.y = THREE.MathUtils.damp(group.current.position.y, target, 8, dt);
    }

    // lights come on from 1.4s, then the soft glow spreads
    const lit = isOpen ? 1 : 0;
    const ramp = t < 0 ? lit : t < 1.4 ? 0 : Math.min(1, (t - 1.4) / 0.9);
    if (light.current) light.current.intensity = (isOpen ? 0.55 : 0.04) * (t < 0 ? 1 : ramp);
    if (bulbs.current) {
      bulbs.current.children.forEach((child, i) => {
        const m = (child as THREE.Mesh).material as THREE.MeshStandardMaterial;
        if (m?.emissiveIntensity !== undefined) {
          const stagger = t < 0 ? 1 : Math.max(0, Math.min(1, (t - 1.4 - i * 0.06) / 0.4));
          m.emissiveIntensity = (isOpen ? 1.15 : 0.06) * stagger;
        }
      });
    }
    if (glow.current && glowMat.current) {
      const spread = t >= 2.0 && t < 3.3 ? (t - 2.0) / 1.3 : -1;
      glow.current.visible = spread >= 0 && spread < 1;
      if (glow.current.visible) {
        glow.current.scale.setScalar(0.6 + spread * 1.9);
        glowMat.current.opacity = (1 - spread) * 0.34;
      }
    }
  });

  const click = (e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation();
    onSelect(id);
  };

  const def = GAMES[index]!;
  return (
    <group position={SPOTS[id]}>
      {/* base */}
      <mesh position={[0, 0.06, 0]} receiveShadow>
        <cylinderGeometry args={[1.28, 1.32, 0.14, 32]} />
        <meshStandardMaterial color={PALETTE.cream} roughness={0.9} />
      </mesh>
      <mesh position={[0, 0.135, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <circleGeometry args={[1.22, 32]} />
        <meshStandardMaterial color={isOpen ? PALETTE.grass : "#b9c1b3"} roughness={0.96} />
      </mesh>

      <group
        ref={group}
        onClick={click}
        onPointerOver={(e) => {
          e.stopPropagation();
          hover.current = true;
          document.body.style.cursor = "pointer";
        }}
        onPointerOut={() => {
          hover.current = false;
          document.body.style.cursor = "";
        }}
      >
        {id === "world-explorer" && <ExplorerCabin />}
        {id === "tiny-maze" && <TinyMaze />}
        {id === "choice-adventure" && <ChoiceAdventure />}
        {/* invisible, generous hit volume */}
        <mesh position={[0, 0.8, 0]}>
          <boxGeometry args={[2.5, 2.1, 2.1]} />
          <meshBasicMaterial transparent opacity={0} depthWrite={false} />
        </mesh>
      </group>

      {/* string of little lights around the base */}
      <group ref={bulbs}>
        {Array.from({ length: 8 }, (_, i) => {
          const a = (i / 8) * Math.PI * 2;
          return (
            <mesh key={i} position={[Math.cos(a) * 1.22, 0.34, Math.sin(a) * 1.22]}>
              <sphereGeometry args={[0.055, 8, 6]} />
              <meshStandardMaterial
                color={PALETTE.goldLight}
                emissive="#ffd489"
                emissiveIntensity={isOpen ? 1.15 : 0.06}
                roughness={0.4}
              />
            </mesh>
          );
        })}
      </group>
      <pointLight ref={light} position={[0, 1.5, 0]} color="#ffe0a8" intensity={isOpen ? 0.55 : 0.04} distance={4.5} />

      <Lock tRef={anim} isOpen={isOpen} />

      <mesh ref={glow} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.16, 0]} visible={false}>
        <ringGeometry args={[0.85, 1.5, 40]} />
        <meshBasicMaterial ref={glowMat} color="#ffe6ae" transparent opacity={0} depthWrite={false} side={THREE.DoubleSide} />
      </mesh>

      {/* a small standing number so the order reads at a glance */}
      <mesh position={[0, 0.17, 1.05]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[0.16, 20]} />
        <meshStandardMaterial color={isOpen ? PALETTE.gold : PALETTE.stone} roughness={0.7} />
      </mesh>
      <WoodSign text={def.num} position={[0, 0.42, 1.02]} width={0.42} post={false} />
    </group>
  );
}

export function ParkScene({ unlocked, justUnlocked, onSelect, reducedMotion }: Props) {
  return (
    <group>
      <Ground radius={5.4} />
      {/* a looping wooden path connects the three facilities */}
      <mesh position={[0, 0.05, 0.3]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[3.05, 3.32, 48]} />
        <meshStandardMaterial color={PALETTE.woodLight} roughness={0.95} side={THREE.DoubleSide} />
      </mesh>
      {GAMES.map((g, i) => (
        <Facility
          key={g.id}
          id={g.id}
          index={i}
          unlocked={unlocked}
          justUnlocked={justUnlocked}
          onSelect={onSelect}
          reducedMotion={reducedMotion}
        />
      ))}
      {/* park dressing */}
      <Tree position={[-4.4, 0, -2.1]} scale={1.15} reducedMotion={reducedMotion} />
      <Tree position={[4.3, 0, -2.2]} scale={1.2} reducedMotion={reducedMotion} tint={PALETTE.leafLight} />
      <Tree position={[-4.1, 0, 2.6]} scale={0.9} reducedMotion={reducedMotion} />
      <Tree position={[4.2, 0, 2.7]} scale={1.0} reducedMotion={reducedMotion} />
      <Tree position={[0, 0, 3.9]} scale={0.85} reducedMotion={reducedMotion} />
      <Bush position={[-1.6, 0, 2.3]} />
      <Bush position={[1.7, 0, 2.2]} scale={1.2} />
      <Rock position={[-3.7, 0.06, 1.1]} scale={0.8} />
      <Rock position={[3.6, 0.06, 1.2]} scale={0.65} />
      <Lantern position={[-1.75, 0.06, 1.35]} reducedMotion={reducedMotion} />
      <Lantern position={[1.75, 0.06, 1.35]} reducedMotion={reducedMotion} />
      {Array.from({ length: 14 }, (_, i) => {
        const a = (i / 14) * Math.PI * 2 + 0.2;
        const r = 4.35 + (i % 3) * 0.24;
        return <Flower key={i} position={[Math.cos(a) * r, 0.04, Math.sin(a) * r]} />;
      })}
      {Array.from({ length: 10 }, (_, i) => {
        const a = (i / 10) * Math.PI * 2 + 0.7;
        return <GrassTuft key={i} position={[Math.cos(a) * 3.9, 0.03, Math.sin(a) * 3.9]} />;
      })}
    </group>
  );
}
