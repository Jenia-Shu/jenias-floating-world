/**
 * Small, reusable 3D parts for the Fun Zone. Everything is generated geometry
 * — no external model files, so a missing asset can never leave a hole in the
 * scene. Colours follow the site's cozy palette (sky / cream / forest / wood /
 * champagne gold), never neon.
 */

import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { RoundedBox } from "@react-three/drei";
import * as THREE from "three";

export const PALETTE = {
  sky: "#dcecf4",
  cream: "#f7f2e6",
  paper: "#f2e8d0",
  wood: "#c69a6a",
  woodDark: "#8f6744",
  woodLight: "#e0bd91",
  grass: "#9dc08a",
  grassDark: "#6f9a70",
  leaf: "#7fae7b",
  leafLight: "#a8c995",
  stone: "#c9c7bb",
  water: "#8fc4d6",
  gold: "#d9b877",
  goldLight: "#f0dcae",
  ink: "#3f4a47",
  canvas: "#f0e4ca",
  black: "#282d33",
  white: "#f6f3ec",
} as const;

/* ------------------------------------------------------------- text labels */

const labelCache = new Map<string, THREE.CanvasTexture>();

/** A canvas-drawn label: real text in the 3D world without loading a font file. */
export function labelTexture(text: string, color = "#4b3a28", size = 62): THREE.CanvasTexture {
  const key = `${text}|${color}|${size}`;
  const cached = labelCache.get(key);
  if (cached) return cached;
  const c = document.createElement("canvas");
  c.width = 1024;
  c.height = 256;
  const g = c.getContext("2d")!;
  g.clearRect(0, 0, c.width, c.height);
  g.font = `600 ${size}px Nunito, "Microsoft YaHei", sans-serif`;
  g.textAlign = "center";
  g.textBaseline = "middle";
  g.fillStyle = color;
  g.fillText(text, c.width / 2, c.height / 2 + 2);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  labelCache.set(key, tex);
  return tex;
}

export function Label({
  text,
  width = 1.2,
  height = 0.3,
  color = "#4b3a28",
  size = 62,
}: {
  text: string;
  width?: number;
  height?: number;
  color?: string;
  size?: number;
}) {
  const tex = useMemo(() => labelTexture(text, color, size), [text, color, size]);
  return (
    <mesh>
      <planeGeometry args={[width, height]} />
      <meshBasicMaterial map={tex} transparent depthWrite={false} toneMapped={false} />
    </mesh>
  );
}

export function WoodSign({
  text,
  position = [0, 0, 0],
  rotation = [0, 0, 0],
  width = 1.5,
  post = true,
}: {
  text: string;
  position?: [number, number, number];
  rotation?: [number, number, number];
  width?: number;
  post?: boolean;
}) {
  return (
    <group position={position} rotation={rotation}>
      {post && (
        <mesh position={[0, -0.32, -0.02]} castShadow>
          <cylinderGeometry args={[0.045, 0.055, 0.65, 8]} />
          <meshStandardMaterial color={PALETTE.woodDark} roughness={0.9} />
        </mesh>
      )}
      <RoundedBox args={[width, 0.38, 0.09]} radius={0.045} smoothness={3} castShadow>
        <meshStandardMaterial color={PALETTE.woodLight} roughness={0.82} />
      </RoundedBox>
      <group position={[0, 0, 0.05]}>
        <Label text={text} width={width * 0.9} height={0.3} size={58} />
      </group>
    </group>
  );
}

/* ------------------------------------------------------------------ nature */

export function Ground({ radius = 6, y = 0 }: { radius?: number; y?: number }) {
  return (
    <group position={[0, y, 0]}>
      <mesh position={[0, -0.3, 0]} receiveShadow>
        <cylinderGeometry args={[radius, radius * 0.86, 0.6, 48]} />
        <meshStandardMaterial color={PALETTE.woodDark} roughness={1} />
      </mesh>
      <mesh position={[0, 0.01, 0]} receiveShadow>
        <cylinderGeometry args={[radius, radius, 0.06, 48]} />
        <meshStandardMaterial color={PALETTE.grass} roughness={0.95} />
      </mesh>
      {/* a soft cream rim keeps the diorama reading as a little world */}
      <mesh position={[0, 0.045, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[radius * 0.965, radius, 48]} />
        <meshStandardMaterial color={PALETTE.cream} roughness={0.9} side={THREE.DoubleSide} />
      </mesh>
    </group>
  );
}

export function Tree({
  position = [0, 0, 0],
  scale = 1,
  sway = true,
  reducedMotion = false,
  tint = PALETTE.leaf,
}: {
  position?: [number, number, number];
  scale?: number;
  sway?: boolean;
  reducedMotion?: boolean;
  tint?: string;
}) {
  const crown = useRef<THREE.Group>(null);
  const seed = useMemo(() => Math.random() * Math.PI * 2, []);
  useFrame(({ clock }) => {
    if (!crown.current || reducedMotion || !sway) return;
    crown.current.rotation.z = Math.sin(clock.elapsedTime * 0.7 + seed) * 0.025;
    crown.current.rotation.x = Math.cos(clock.elapsedTime * 0.55 + seed) * 0.018;
  });
  return (
    <group position={position} scale={scale}>
      <mesh position={[0, 0.32, 0]} castShadow>
        <cylinderGeometry args={[0.055, 0.085, 0.66, 8]} />
        <meshStandardMaterial color={PALETTE.woodDark} roughness={0.95} />
      </mesh>
      <group ref={crown}>
        <mesh position={[0, 0.85, 0]} castShadow>
          <sphereGeometry args={[0.36, 12, 10]} />
          <meshStandardMaterial color={tint} roughness={0.9} flatShading={false} />
        </mesh>
        <mesh position={[-0.2, 0.68, 0.06]} castShadow>
          <sphereGeometry args={[0.24, 10, 8]} />
          <meshStandardMaterial color={PALETTE.leafLight} roughness={0.9} />
        </mesh>
        <mesh position={[0.19, 0.72, -0.05]} castShadow>
          <sphereGeometry args={[0.26, 10, 8]} />
          <meshStandardMaterial color={PALETTE.grassDark} roughness={0.9} />
        </mesh>
        <mesh position={[0.03, 1.1, 0.02]} castShadow>
          <sphereGeometry args={[0.22, 10, 8]} />
          <meshStandardMaterial color={PALETTE.leafLight} roughness={0.9} />
        </mesh>
      </group>
    </group>
  );
}

export function Bush({ position = [0, 0, 0], scale = 1 }: { position?: [number, number, number]; scale?: number }) {
  return (
    <group position={position} scale={scale}>
      <mesh position={[0, 0.12, 0]} castShadow>
        <sphereGeometry args={[0.22, 10, 8]} />
        <meshStandardMaterial color={PALETTE.grassDark} roughness={0.95} />
      </mesh>
      <mesh position={[0.16, 0.09, 0.05]} castShadow>
        <sphereGeometry args={[0.16, 10, 8]} />
        <meshStandardMaterial color={PALETTE.leaf} roughness={0.95} />
      </mesh>
    </group>
  );
}

export function Rock({
  position = [0, 0, 0],
  scale = 1,
  color = PALETTE.stone,
}: {
  position?: [number, number, number];
  scale?: number;
  color?: string;
}) {
  return (
    <mesh position={position} scale={[scale, scale * 0.62, scale * 0.86]} castShadow receiveShadow>
      <sphereGeometry args={[0.2, 10, 8]} />
      <meshStandardMaterial color={color} roughness={0.98} />
    </mesh>
  );
}

const FLOWER_COLORS = ["#f2d3d9", "#f6e6b4", "#d9e6f2", "#f4dcc4"];

export function Flower({ position = [0, 0, 0], color }: { position?: [number, number, number]; color?: string }) {
  const c = color ?? FLOWER_COLORS[Math.floor(Math.random() * FLOWER_COLORS.length)]!;
  return (
    <group position={position}>
      <mesh position={[0, 0.055, 0]}>
        <cylinderGeometry args={[0.008, 0.01, 0.11, 5]} />
        <meshStandardMaterial color={PALETTE.grassDark} roughness={1} />
      </mesh>
      {[0, 1, 2, 3, 4].map((i) => {
        const a = (i / 5) * Math.PI * 2;
        return (
          <mesh key={i} position={[Math.cos(a) * 0.028, 0.12, Math.sin(a) * 0.028]}>
            <sphereGeometry args={[0.022, 6, 5]} />
            <meshStandardMaterial color={c} roughness={0.9} />
          </mesh>
        );
      })}
      <mesh position={[0, 0.125, 0]}>
        <sphereGeometry args={[0.014, 6, 5]} />
        <meshStandardMaterial color={PALETTE.gold} roughness={0.8} />
      </mesh>
    </group>
  );
}

export function GrassTuft({ position = [0, 0, 0] }: { position?: [number, number, number] }) {
  return (
    <group position={position}>
      {[-0.05, 0, 0.05].map((x, i) => (
        <mesh key={i} position={[x, 0.06, i === 1 ? 0.02 : -0.01]} rotation={[0, 0, x * 2]}>
          <coneGeometry args={[0.022, 0.14, 4]} />
          <meshStandardMaterial color={PALETTE.grassDark} roughness={1} />
        </mesh>
      ))}
    </group>
  );
}

/* ----------------------------------------------------------------- lantern */

export function Lantern({
  position = [0, 0, 0],
  reducedMotion = false,
  brightness = 1,
}: {
  position?: [number, number, number];
  reducedMotion?: boolean;
  brightness?: number;
}) {
  const glow = useRef<THREE.MeshStandardMaterial>(null);
  useFrame(({ clock }) => {
    if (!glow.current || reducedMotion) return;
    glow.current.emissiveIntensity = brightness * (0.85 + Math.sin(clock.elapsedTime * 3.1) * 0.12);
  });
  return (
    <group position={position}>
      <mesh position={[0, 0.06, 0]} castShadow>
        <cylinderGeometry args={[0.075, 0.09, 0.12, 10]} />
        <meshStandardMaterial color={PALETTE.woodDark} roughness={0.85} />
      </mesh>
      <mesh position={[0, 0.22, 0]} castShadow>
        <cylinderGeometry args={[0.055, 0.055, 0.22, 10]} />
        <meshStandardMaterial
          ref={glow}
          color={PALETTE.goldLight}
          emissive="#ffd98a"
          emissiveIntensity={brightness * 0.9}
          roughness={0.35}
          transparent
          opacity={0.92}
        />
      </mesh>
      <mesh position={[0, 0.36, 0]} castShadow>
        <coneGeometry args={[0.1, 0.1, 10]} />
        <meshStandardMaterial color={PALETTE.woodDark} roughness={0.8} />
      </mesh>
      <pointLight position={[0, 0.25, 0]} color="#ffdca0" intensity={brightness * 0.35} distance={2.4} />
    </group>
  );
}

/* -------------------------------------------------------------------- star */

const starShape = (() => {
  const s = new THREE.Shape();
  const outer = 0.12;
  const inner = 0.052;
  for (let i = 0; i < 10; i++) {
    const a = (i / 10) * Math.PI * 2 - Math.PI / 2;
    const r = i % 2 === 0 ? outer : inner;
    const x = Math.cos(a) * r;
    const y = Math.sin(a) * r;
    if (i === 0) s.moveTo(x, y);
    else s.lineTo(x, y);
  }
  s.closePath();
  return s;
})();

export function Star({
  position = [0, 0, 0],
  rotation = [0, 0, 0],
  scale = 1,
  color = PALETTE.gold,
  emissive = 0.55,
  opacity = 1,
}: {
  position?: [number, number, number];
  rotation?: [number, number, number];
  scale?: number;
  color?: string;
  emissive?: number;
  opacity?: number;
}) {
  return (
    <mesh position={position} rotation={rotation} scale={scale}>
      <extrudeGeometry args={[starShape, { depth: 0.035, bevelEnabled: true, bevelSize: 0.012, bevelThickness: 0.012, bevelSegments: 1 }]} />
      <meshStandardMaterial
        color={color}
        emissive={color}
        emissiveIntensity={emissive}
        metalness={0.3}
        roughness={0.35}
        transparent={opacity < 1}
        opacity={opacity}
      />
    </mesh>
  );
}

/* ------------------------------------------------------------------ helpers */

/** A rounded, cloud-like patch used for the three regions of the adventure map. */
export function blobShape(radius: number, seed = 0): THREE.Shape {
  const s = new THREE.Shape();
  const pts: THREE.Vector2[] = [];
  const n = 10;
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2;
    const r = radius * (0.82 + 0.18 * Math.sin(a * 3 + seed) + 0.08 * Math.cos(a * 5 + seed * 2));
    pts.push(new THREE.Vector2(Math.cos(a) * r, Math.sin(a) * r * 0.78));
  }
  s.moveTo(pts[0]!.x, pts[0]!.y);
  for (let i = 0; i < n; i++) {
    const cur = pts[i]!;
    const next = pts[(i + 1) % n]!;
    s.quadraticCurveTo(cur.x, cur.y, (cur.x + next.x) / 2, (cur.y + next.y) / 2);
  }
  s.closePath();
  return s;
}

export { RoundedBox };
