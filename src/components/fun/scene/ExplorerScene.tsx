/**
 * The explorer campsite — one continuous miniature 3D world.
 *
 * Five areas: cabin, central map table, rest area, forest stream, and a small
 * spot near the table for 公主. The map table is the progress display: three
 * dimmed regions, nine stars, and a chest that opens only at the end.
 */

import { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { CHAPTERS } from "@/components/fun/games/world-explorer/questionBank";
import {
  blobShape,
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
import { Princess, type PrincessMood } from "./Princess";

export type ExplorerStage = "intro" | "story" | "question" | "chapter" | "result";

type Props = {
  stage: ExplorerStage;
  /** Nine flags: has this question been answered correctly (eventually)? */
  solved: boolean[];
  /** Nine flags: was the FIRST submitted answer correct? */
  firstTry: boolean[];
  chapter: number;
  /** Increments on each correct answer to launch a star toward the map. */
  starTrigger: number;
  /** Index of the question that was just solved, for the flight target. */
  starTarget: number;
  mapComplete: boolean;
  chestOpen: boolean;
  princessMood: PrincessMood;
  princessSignal: number;
  reducedMotion: boolean;
};

/* -------------------------------------------------------------- water bits */

function rippleTexture(): THREE.CanvasTexture {
  const c = document.createElement("canvas");
  c.width = 256;
  c.height = 256;
  const g = c.getContext("2d")!;
  g.fillStyle = "#9fd0dd";
  g.fillRect(0, 0, 256, 256);
  g.strokeStyle = "rgba(255,255,255,0.5)";
  g.lineWidth = 3;
  for (let i = 0; i < 12; i++) {
    const y = i * 22 + 6;
    g.beginPath();
    g.moveTo(0, y);
    for (let x = 0; x <= 256; x += 16) g.lineTo(x, y + Math.sin(x / 26 + i) * 4);
    g.stroke();
  }
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(2, 2);
  return tex;
}

function Stream({ reducedMotion }: { reducedMotion: boolean }) {
  const tex = useMemo(rippleTexture, []);
  const mat = useRef<THREE.MeshStandardMaterial>(null);
  const fall = useRef<THREE.Mesh>(null);
  const shape = useMemo(() => {
    const s = new THREE.Shape();
    s.moveTo(-2.6, 0);
    s.bezierCurveTo(-1.2, -0.32, 0.4, 0.28, 2.7, 0.12);
    s.lineTo(2.7, 0.82);
    s.bezierCurveTo(0.4, 0.98, -1.2, 0.38, -2.6, 0.7);
    s.closePath();
    return s;
  }, []);
  useFrame(({ clock }) => {
    if (reducedMotion) return;
    tex.offset.y = -(clock.elapsedTime * 0.055) % 1;
    tex.offset.x = Math.sin(clock.elapsedTime * 0.3) * 0.01;
    if (mat.current) mat.current.emissiveIntensity = 0.08 + Math.sin(clock.elapsedTime * 1.4) * 0.03;
    if (fall.current) fall.current.scale.y = 1 + Math.sin(clock.elapsedTime * 2.2) * 0.03;
  });
  return (
    <group position={[0, 0.055, 2.85]}>
      <mesh rotation={[-Math.PI / 2, 0, 0]}>
        <shapeGeometry args={[shape]} />
        <meshStandardMaterial
          ref={mat}
          map={tex}
          color={PALETTE.water}
          emissive="#bfe8f0"
          emissiveIntensity={0.08}
          transparent
          opacity={0.9}
          roughness={0.2}
          metalness={0.05}
          side={THREE.DoubleSide}
        />
      </mesh>
      {/* tiny waterfall at the right-hand source */}
      <mesh ref={fall} position={[2.55, 0.2, -0.16]} rotation={[0, 0, 0]}>
        <planeGeometry args={[0.62, 0.42]} />
        <meshStandardMaterial color="#d9f0f5" transparent opacity={0.62} side={THREE.DoubleSide} roughness={0.1} />
      </mesh>
      <Rock position={[-1.7, 0.06, 0.15]} scale={1.1} />
      <Rock position={[-1.2, 0.06, 0.62]} scale={0.8} />
      <Rock position={[0.7, 0.06, 0.25]} scale={0.9} />
      <Rock position={[1.9, 0.06, 0.55]} scale={1.15} />
      <Rock position={[2.35, 0.06, 0.05]} scale={0.7} color="#b9c6bd" />
      {/* a small wooden bridge */}
      <group position={[0.15, 0.14, 0.42]}>
        {[-0.34, -0.17, 0, 0.17, 0.34].map((x) => (
          <mesh key={x} position={[x, 0, 0]} castShadow>
            <boxGeometry args={[0.14, 0.055, 0.95]} />
            <meshStandardMaterial color={x === 0 ? PALETTE.woodLight : PALETTE.wood} roughness={0.9} />
          </mesh>
        ))}
        {[-0.47, 0.47].map((x) => (
          <mesh key={x} position={[x, 0.09, 0]}>
            <boxGeometry args={[0.045, 0.2, 1.0]} />
            <meshStandardMaterial color={PALETTE.woodDark} roughness={0.9} />
          </mesh>
        ))}
      </group>
      <Flower position={[-2.1, 0.04, -0.28]} />
      <Flower position={[-0.6, 0.04, -0.34]} />
      <Flower position={[1.2, 0.04, 0.98]} />
      <GrassTuft position={[-2.4, 0.03, 0.62]} />
      <GrassTuft position={[1.6, 0.03, 0.86]} />
    </group>
  );
}

/* ------------------------------------------------------------------ cabin */

function Cabin({ reducedMotion }: { reducedMotion: boolean }) {
  return (
    <group position={[-3.35, 0, -1.65]} rotation={[0, 0.32, 0]}>
      {/* wooden path leading in */}
      {[0, 1, 2, 3].map((i) => (
        <mesh key={i} position={[0.1 + i * 0.34, 0.035, 1.05 + i * 0.32]} rotation={[-Math.PI / 2, 0, -0.5]}>
          <planeGeometry args={[0.32, 0.28]} />
          <meshStandardMaterial color={i % 2 ? PALETTE.woodLight : PALETTE.wood} roughness={0.95} side={THREE.DoubleSide} />
        </mesh>
      ))}
      <RoundedBox args={[1.7, 1.25, 1.45]} radius={0.14} smoothness={3} position={[0, 0.66, 0]} castShadow receiveShadow>
        <meshStandardMaterial color={PALETTE.woodLight} roughness={0.86} />
      </RoundedBox>
      {/* rounded roof */}
      <mesh position={[0, 1.42, 0]} rotation={[0, Math.PI / 4, 0]} castShadow>
        <coneGeometry args={[1.34, 0.72, 4]} />
        <meshStandardMaterial color={PALETTE.woodDark} roughness={0.9} />
      </mesh>
      <mesh position={[0, 1.78, 0]}>
        <sphereGeometry args={[0.07, 10, 8]} />
        <meshStandardMaterial color={PALETTE.gold} metalness={0.4} roughness={0.4} />
      </mesh>
      {/* warm windows */}
      {[-0.5, 0.5].map((x) => (
        <group key={x} position={[x, 0.78, 0.735]}>
          <mesh>
            <boxGeometry args={[0.3, 0.34, 0.02]} />
            <meshStandardMaterial color="#ffe2ad" emissive="#ffc473" emissiveIntensity={0.85} />
          </mesh>
          <mesh position={[0, 0, 0.015]}>
            <boxGeometry args={[0.025, 0.34, 0.01]} />
            <meshStandardMaterial color={PALETTE.woodDark} />
          </mesh>
        </group>
      ))}
      <RoundedBox args={[0.46, 0.75, 0.04]} radius={0.09} smoothness={2} position={[0, 0.4, 0.74]}>
        <meshStandardMaterial color={PALETTE.woodDark} roughness={0.9} />
      </RoundedBox>
      <mesh position={[0.16, 0.4, 0.765]}>
        <sphereGeometry args={[0.028, 8, 6]} />
        <meshStandardMaterial color={PALETTE.gold} metalness={0.6} roughness={0.3} />
      </mesh>
      <WoodSign text="WORLD EXPLORER" position={[0, 1.22, 0.76]} width={1.5} post={false} />
      {/* backpack by the door + compass decoration + lantern */}
      <RoundedBox args={[0.3, 0.36, 0.2]} radius={0.08} smoothness={3} position={[0.62, 0.2, 0.92]} castShadow>
        <meshStandardMaterial color="#9fc4dd" roughness={0.9} />
      </RoundedBox>
      <mesh position={[0.62, 0.4, 0.92]}>
        <torusGeometry args={[0.07, 0.02, 6, 12]} />
        <meshStandardMaterial color={PALETTE.woodDark} roughness={0.9} />
      </mesh>
      <group position={[-0.78, 0.42, 0.76]}>
        <mesh>
          <cylinderGeometry args={[0.15, 0.15, 0.025, 20]} />
          <meshStandardMaterial color={PALETTE.gold} metalness={0.5} roughness={0.4} />
        </mesh>
        <mesh position={[0, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <circleGeometry args={[0.12, 20]} />
          <meshStandardMaterial color={PALETTE.cream} roughness={0.9} />
        </mesh>
        <mesh position={[0, 0.03, 0]} rotation={[-Math.PI / 2, 0, -0.6]}>
          <planeGeometry args={[0.035, 0.19]} />
          <meshStandardMaterial color="#b4675c" side={THREE.DoubleSide} />
        </mesh>
      </group>
      <Lantern position={[-0.92, 0.03, 0.98]} reducedMotion={reducedMotion} />
      <Tree position={[-1.35, 0, -0.9]} scale={1.15} reducedMotion={reducedMotion} />
      <Bush position={[0.95, 0, -0.4]} />
      <Flower position={[0.9, 0.02, 0.65]} />
    </group>
  );
}

/* -------------------------------------------------------------- rest area */

function RestArea({ reducedMotion }: { reducedMotion: boolean }) {
  return (
    <group position={[3.25, 0, -1.7]} rotation={[0, -0.28, 0]}>
      {/* tent */}
      <group position={[0, 0, -0.35]}>
        <mesh position={[0, 0.55, 0]} rotation={[Math.PI / 2, 0, 0]} castShadow>
          <cylinderGeometry args={[0.72, 0.72, 1.3, 3]} />
          <meshStandardMaterial color={PALETTE.canvas} roughness={0.95} side={THREE.DoubleSide} />
        </mesh>
        <mesh position={[0, 0.55, 0.66]} rotation={[0, 0, 0]}>
          <coneGeometry args={[0.42, 0.75, 3]} />
          <meshStandardMaterial color={PALETTE.cream} roughness={0.95} />
        </mesh>
        <mesh position={[0, 0.32, 0.68]}>
          <planeGeometry args={[0.34, 0.6]} />
          <meshStandardMaterial color={PALETTE.woodDark} roughness={0.95} side={THREE.DoubleSide} />
        </mesh>
      </group>
      {/* bench */}
      <group position={[-0.15, 0, 1.05]}>
        <mesh position={[0, 0.3, 0]} castShadow>
          <boxGeometry args={[1.2, 0.08, 0.32]} />
          <meshStandardMaterial color={PALETTE.wood} roughness={0.9} />
        </mesh>
        {[-0.48, 0.48].map((x) => (
          <mesh key={x} position={[x, 0.15, 0]}>
            <boxGeometry args={[0.08, 0.3, 0.28]} />
            <meshStandardMaterial color={PALETTE.woodDark} roughness={0.9} />
          </mesh>
        ))}
      </group>
      {/* picnic basket */}
      <RoundedBox args={[0.34, 0.24, 0.26]} radius={0.06} smoothness={2} position={[0.42, 0.46, 1.05]} castShadow>
        <meshStandardMaterial color={PALETTE.wood} roughness={0.9} />
      </RoundedBox>
      <mesh position={[0.42, 0.6, 1.05]}>
        <torusGeometry args={[0.11, 0.018, 6, 14, Math.PI]} />
        <meshStandardMaterial color={PALETTE.woodDark} roughness={0.9} />
      </mesh>
      <Lantern position={[-0.85, 0.02, 0.85]} reducedMotion={reducedMotion} />
      <Tree position={[1.15, 0, -0.85]} scale={1.0} reducedMotion={reducedMotion} tint={PALETTE.leafLight} />
      <Bush position={[-1.0, 0, 0.2]} scale={1.1} />
      <Flower position={[-0.75, 0.02, 1.35]} />
      <Flower position={[0.95, 0.02, 1.2]} />
    </group>
  );
}

/* ---------------------------------------------------------- central map */

function MapRegion({ index, level, color }: { index: number; level: number; color: string }) {
  const mat = useRef<THREE.MeshStandardMaterial>(null);
  const shape = useMemo(() => blobShape(0.43, index * 1.7), [index]);
  const dim = useMemo(() => new THREE.Color("#c9c8bb"), []);
  const lit = useMemo(() => new THREE.Color(color), [color]);
  useFrame((_, dt) => {
    if (!mat.current) return;
    const want = new THREE.Color().lerpColors(dim, lit, level);
    mat.current.color.lerp(want, Math.min(1, dt * 3));
    mat.current.emissiveIntensity = THREE.MathUtils.damp(mat.current.emissiveIntensity, 0.03 + level * 0.62, 3, dt);
    mat.current.opacity = THREE.MathUtils.damp(mat.current.opacity, 0.55 + level * 0.42, 3, dt);
  });
  const [x, z] = CHAPTERS[index]!.spot;
  return (
    <group position={[x, 0.935, z]}>
      <mesh rotation={[-Math.PI / 2, 0, 0]}>
        <shapeGeometry args={[shape]} />
        <meshStandardMaterial
          ref={mat}
          color="#c9c8bb"
          emissive={color}
          emissiveIntensity={0.03}
          transparent
          opacity={0.55}
          roughness={0.85}
          side={THREE.DoubleSide}
        />
      </mesh>
      {/* miniature landmarks inside the region */}
      {level > 0.05 && (
        <>
          <mesh position={[-0.13, 0.04, -0.08]} castShadow>
            <coneGeometry args={[0.07, 0.16, 6]} />
            <meshStandardMaterial color={PALETTE.grassDark} roughness={0.9} />
          </mesh>
          <mesh position={[0.12, 0.035, 0.1]} castShadow>
            <boxGeometry args={[0.11, 0.09, 0.1]} />
            <meshStandardMaterial color={PALETTE.woodLight} roughness={0.9} />
          </mesh>
          <mesh position={[0.12, 0.1, 0.1]} rotation={[0, Math.PI / 4, 0]}>
            <coneGeometry args={[0.09, 0.08, 4]} />
            <meshStandardMaterial color={PALETTE.woodDark} roughness={0.9} />
          </mesh>
        </>
      )}
    </group>
  );
}

function MapStars({ solved, firstTry }: { solved: boolean[]; firstTry: boolean[] }) {
  return (
    <group>
      {Array.from({ length: 9 }, (_, i) => {
        const chapter = Math.floor(i / 3);
        const [x, z] = CHAPTERS[chapter]!.spot;
        const offset = (i % 3) - 1;
        const on = solved[i] === true;
        const bright = firstTry[i] === true;
        return (
          <group key={i} position={[x + offset * 0.16, 0.965, z + (i % 2 ? 0.12 : -0.12)]}>
            <Star
              rotation={[-Math.PI / 2, 0, 0]}
              scale={on ? 0.32 : 0.001}
              color={bright ? PALETTE.goldLight : "#c9b893"}
              emissive={bright ? 0.9 : 0.15}
            />
          </group>
        );
      })}
    </group>
  );
}

function StarFlight({
  trigger,
  targetIndex,
  reducedMotion,
}: {
  trigger: number;
  targetIndex: number;
  reducedMotion: boolean;
}) {
  const mesh = useRef<THREE.Mesh>(null);
  const glowMat = useRef<THREE.MeshBasicMaterial>(null);
  const p = useRef(2); // > 1 means idle
  useEffect(() => {
    if (trigger > 0) p.current = 0;
  }, [trigger]);
  const target = useMemo(() => {
    const chapter = Math.min(2, Math.floor(targetIndex / 3));
    const [x, z] = CHAPTERS[chapter]!.spot;
    return new THREE.Vector3(x, 1.0, z);
  }, [targetIndex]);
  useFrame((_, dt) => {
    if (!mesh.current || !glowMat.current) return;
    if (p.current > 1) {
      mesh.current.visible = false;
      return;
    }
    p.current = reducedMotion ? 2 : p.current + dt / 0.95;
    const k = Math.min(1, p.current);
    const e = 1 - Math.pow(1 - k, 2);
    mesh.current.visible = k < 1;
    mesh.current.position.set(
      0 + (target.x - 0) * e,
      2.35 + (target.y - 2.35) * e + Math.sin(k * Math.PI) * 0.5,
      1.5 + (target.z - 1.5) * e,
    );
    mesh.current.rotation.y += dt * 5;
    mesh.current.scale.setScalar(0.9 - k * 0.45);
    glowMat.current.opacity = k < 0.85 ? 0.75 : (1 - k) * 5;
  });
  return (
    <mesh ref={mesh} visible={false}>
      <octahedronGeometry args={[0.1, 0]} />
      <meshBasicMaterial ref={glowMat} color="#ffe3a6" transparent opacity={0.8} />
    </mesh>
  );
}

function TreasureChest({ open, reducedMotion }: { open: boolean; reducedMotion: boolean }) {
  const lid = useRef<THREE.Group>(null);
  const light = useRef<THREE.PointLight>(null);
  const sparkles = useRef<THREE.Group>(null);
  useFrame(({ clock }, dt) => {
    if (lid.current) {
      const want = open ? -1.15 : 0;
      lid.current.rotation.x = reducedMotion ? want : THREE.MathUtils.damp(lid.current.rotation.x, want, 4, dt);
    }
    if (light.current) light.current.intensity = THREE.MathUtils.damp(light.current.intensity, open ? 1.4 : 0, 3, dt);
    if (sparkles.current) {
      sparkles.current.visible = open;
      if (open && !reducedMotion) sparkles.current.rotation.y = clock.elapsedTime * 0.6;
    }
  });
  return (
    <group position={[0, 0.95, 0.55]}>
      <RoundedBox args={[0.46, 0.25, 0.32]} radius={0.05} smoothness={2} position={[0, 0.13, 0]} castShadow>
        <meshStandardMaterial color={PALETTE.woodDark} roughness={0.85} />
      </RoundedBox>
      <group ref={lid} position={[0, 0.26, -0.16]}>
        <RoundedBox args={[0.46, 0.12, 0.32]} radius={0.05} smoothness={2} position={[0, 0.03, 0.16]} castShadow>
          <meshStandardMaterial color={PALETTE.wood} roughness={0.85} />
        </RoundedBox>
        <mesh position={[0, 0.03, 0.16]}>
          <boxGeometry args={[0.48, 0.035, 0.05]} />
          <meshStandardMaterial color={PALETTE.gold} metalness={0.55} roughness={0.35} />
        </mesh>
      </group>
      <mesh position={[0, 0.15, 0.165]}>
        <boxGeometry args={[0.09, 0.1, 0.02]} />
        <meshStandardMaterial color={PALETTE.gold} metalness={0.6} roughness={0.3} />
      </mesh>
      <group ref={sparkles} visible={false} position={[0, 0.42, 0]}>
        {[0, 1, 2, 3].map((i) => (
          <Star key={i} position={[Math.cos((i / 4) * 6.28) * 0.24, (i % 2) * 0.12, Math.sin((i / 4) * 6.28) * 0.24]} scale={0.3} />
        ))}
      </group>
      <pointLight ref={light} position={[0, 0.4, 0]} color="#ffd58a" intensity={0} distance={2.6} />
    </group>
  );
}

function QuestPlate({ visible, reducedMotion }: { visible: boolean; reducedMotion: boolean }) {
  const plate = useRef<THREE.Group>(null);
  useFrame(({ clock }, dt) => {
    if (!plate.current) return;
    const want = visible ? 1 : 0.001;
    plate.current.scale.setScalar(THREE.MathUtils.damp(plate.current.scale.x, want, 6, dt));
    plate.current.visible = plate.current.scale.x > 0.02;
    if (visible && !reducedMotion) plate.current.position.y = 1.72 + Math.sin(clock.elapsedTime * 1.5) * 0.035;
  });
  return (
    <group ref={plate} position={[0, 1.72, -0.05]} rotation={[-0.22, 0, 0]} scale={0.001}>
      <RoundedBox args={[2.15, 1.3, 0.035]} radius={0.12} smoothness={3}>
        <meshPhysicalMaterial
          color="#eaf5f8"
          transparent
          opacity={0.32}
          roughness={0.16}
          metalness={0.04}
          clearcoat={0.8}
          clearcoatRoughness={0.2}
          depthWrite={false}
        />
      </RoundedBox>
      <mesh position={[0, 0, 0.022]}>
        <ringGeometry args={[0.72, 0.74, 40]} />
        <meshBasicMaterial color={PALETTE.gold} transparent opacity={0.35} />
      </mesh>
    </group>
  );
}

function MapTable({
  solved,
  firstTry,
  starTrigger,
  starTarget,
  chestOpen,
  stage,
  reducedMotion,
}: Pick<Props, "solved" | "firstTry" | "starTrigger" | "starTarget" | "chestOpen" | "stage" | "reducedMotion">) {
  const compass = useRef<THREE.Group>(null);
  useFrame(({ clock }) => {
    if (compass.current && !reducedMotion) compass.current.rotation.y = Math.sin(clock.elapsedTime * 0.4) * 0.22;
  });
  const levels = [0, 1, 2].map((c) => solved.slice(c * 3, c * 3 + 3).filter(Boolean).length / 3);
  return (
    <group>
      {/* table legs + top */}
      {[
        [-1.15, -0.72],
        [1.15, -0.72],
        [-1.15, 0.72],
        [1.15, 0.72],
      ].map(([x, z], i) => (
        <mesh key={i} position={[x!, 0.42, z!]} castShadow>
          <cylinderGeometry args={[0.075, 0.095, 0.84, 10]} />
          <meshStandardMaterial color={PALETTE.woodDark} roughness={0.9} />
        </mesh>
      ))}
      <RoundedBox args={[2.85, 0.18, 2.05]} radius={0.1} smoothness={3} position={[0, 0.82, 0]} castShadow receiveShadow>
        <meshStandardMaterial color={PALETTE.wood} roughness={0.82} />
      </RoundedBox>
      {/* the continuous paper map — one piece, never nine puzzle pieces */}
      <RoundedBox args={[2.55, 0.04, 1.78]} radius={0.09} smoothness={3} position={[0, 0.915, 0]} receiveShadow>
        <meshStandardMaterial color={PALETTE.paper} roughness={0.96} />
      </RoundedBox>
      {/* faint dotted routes between the three regions */}
      {Array.from({ length: 11 }, (_, i) => {
        const a = (i / 11) * Math.PI * 1.15 + 0.1;
        return (
          <mesh key={i} position={[Math.cos(a) * 0.88, 0.94, Math.sin(a) * 0.5 - 0.1]} rotation={[-Math.PI / 2, 0, 0]}>
            <circleGeometry args={[0.014, 8]} />
            <meshBasicMaterial color="#b8a98a" />
          </mesh>
        );
      })}
      {CHAPTERS.map((c, i) => (
        <MapRegion key={c.n} index={i} level={levels[i] ?? 0} color={c.color} />
      ))}
      <MapStars solved={solved} firstTry={firstTry} />
      {/* compass */}
      <group ref={compass} position={[-1.02, 0.96, 0.62]}>
        <mesh rotation={[-Math.PI / 2, 0, 0]}>
          <circleGeometry args={[0.17, 24]} />
          <meshStandardMaterial color={PALETTE.gold} metalness={0.45} roughness={0.4} />
        </mesh>
        <mesh position={[0, 0.006, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <circleGeometry args={[0.14, 24]} />
          <meshStandardMaterial color={PALETTE.cream} roughness={0.9} />
        </mesh>
        <mesh position={[0, 0.01, 0]} rotation={[-Math.PI / 2, 0, -0.5]}>
          <planeGeometry args={[0.035, 0.24]} />
          <meshStandardMaterial color="#b4675c" side={THREE.DoubleSide} />
        </mesh>
      </group>
      {/* map markers */}
      {[-0.9, 0.9].map((x, i) => (
        <group key={i} position={[x, 0.95, -0.62]}>
          <mesh position={[0, 0.09, 0]}>
            <cylinderGeometry args={[0.008, 0.008, 0.18, 6]} />
            <meshStandardMaterial color={PALETTE.woodDark} />
          </mesh>
          <mesh position={[0.06, 0.15, 0]}>
            <planeGeometry args={[0.12, 0.08]} />
            <meshStandardMaterial color={i ? "#b4675c" : "#7fa5b8"} side={THREE.DoubleSide} />
          </mesh>
        </group>
      ))}
      <TreasureChest open={chestOpen} reducedMotion={reducedMotion} />
      <StarFlight trigger={starTrigger} targetIndex={starTarget} reducedMotion={reducedMotion} />
      <QuestPlate visible={stage === "question"} reducedMotion={reducedMotion} />
    </group>
  );
}

/* ----------------------------------------------------------------- assembly */

export function ExplorerScene({
  stage,
  solved,
  firstTry,
  chapter,
  starTrigger,
  starTarget,
  mapComplete,
  chestOpen,
  princessMood,
  princessSignal,
  reducedMotion,
}: Props) {
  return (
    <group>
      <Ground radius={5.6} />
      {mapComplete && (
        <mesh position={[0, 0.94, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[1.28, 1.85, 48]} />
          <meshBasicMaterial
            color="#ffe4ae"
            transparent
            opacity={0.26}
            depthWrite={false}
            side={THREE.DoubleSide}
          />
        </mesh>
      )}
      <Cabin reducedMotion={reducedMotion} />
      <RestArea reducedMotion={reducedMotion} />
      <Stream reducedMotion={reducedMotion} />
      <MapTable
        solved={solved}
        firstTry={firstTry}
        starTrigger={starTrigger}
        starTarget={starTarget}
        chestOpen={chestOpen}
        stage={stage}
        reducedMotion={reducedMotion}
      />
      <Princess
        mood={princessMood}
        chapter={chapter as 1 | 2 | 3}
        signal={princessSignal}
        reducedMotion={reducedMotion}
      />
      {/* forest ring */}
      <Tree position={[-4.6, 0, 1.4]} scale={1.3} reducedMotion={reducedMotion} />
      <Tree position={[-4.2, 0, -3.3]} scale={1.05} reducedMotion={reducedMotion} tint={PALETTE.leafLight} />
      <Tree position={[-1.6, 0, -3.9]} scale={1.15} reducedMotion={reducedMotion} />
      <Tree position={[1.4, 0, -4.0]} scale={0.95} reducedMotion={reducedMotion} tint={PALETTE.leafLight} />
      <Tree position={[4.5, 0, -3.0]} scale={1.25} reducedMotion={reducedMotion} />
      <Tree position={[4.7, 0, 1.6]} scale={1.1} reducedMotion={reducedMotion} />
      <Bush position={[-2.5, 0, -2.5]} scale={1.2} />
      <Bush position={[2.4, 0, -2.6]} scale={1.1} />
      <Bush position={[-2.2, 0, 1.5]} />
      <Rock position={[-3.9, 0.05, 0.1]} scale={1.1} />
      <Rock position={[3.8, 0.05, 0.4]} scale={0.9} />
      <Lantern position={[-1.85, 0.02, -1.5]} reducedMotion={reducedMotion} />
      <Lantern position={[1.9, 0.02, -1.5]} reducedMotion={reducedMotion} />
      {Array.from({ length: 16 }, (_, i) => {
        const a = (i / 16) * Math.PI * 2 + 0.35;
        const r = 4.65 + (i % 3) * 0.2;
        return <Flower key={i} position={[Math.cos(a) * r, 0.03, Math.sin(a) * r]} />;
      })}
      {Array.from({ length: 12 }, (_, i) => {
        const a = (i / 12) * Math.PI * 2 + 0.9;
        return <GrassTuft key={i} position={[Math.cos(a) * 4.1, 0.02, Math.sin(a) * 4.1]} />;
      })}
    </group>
  );
}
