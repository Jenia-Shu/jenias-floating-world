import { useMemo, useRef, type ReactNode } from "react";
import { useFrame, type ThreeEvent } from "@react-three/fiber";
import * as THREE from "three";
import { ROCK_PALETTE, noise2, shapeRadius, surfaceHeight, type IslandShape } from "@/lib/world/terrain";

function buildGrass(s: IslandShape, color: string) {
  const g = new THREE.RingGeometry(0.0001, 1, 120, 28);
  g.rotateX(-Math.PI / 2);
  const pos = g.attributes["position"] as THREE.BufferAttribute;
  const colors = new Float32Array(pos.count * 3);
  const base = new THREE.Color(color);
  const tmp = new THREE.Color();
  for (let i = 0; i < pos.count; i++) {
    const ux = pos.getX(i);
    const uz = pos.getZ(i);
    const th = Math.atan2(uz, ux);
    const d = Math.hypot(ux, uz);
    const R = shapeRadius(th, s);
    const x = ux * R;
    const z = uz * R;
    let y = surfaceHeight(x, z, s);
    // soft rounded lip rolling over the rock edge
    const lip = Math.max(0, (d - 0.9) / 0.1);
    y -= 0.3 * lip * lip;
    pos.setXYZ(i, x * (1 + 0.015 * lip), y, z * (1 + 0.015 * lip));
    const n = noise2(x * 1.7, z * 1.7, s.seed + 4);
    tmp.copy(base).offsetHSL(0.01 * n, 0.03 * n, 0.05 * n + 0.04 * (1 - d) - 0.05 * lip);
    colors.set([tmp.r, tmp.g, tmp.b], i * 3);
  }
  g.setAttribute("color", new THREE.BufferAttribute(colors, 3));
  g.computeVertexNormals();
  return g;
}

function buildRock(s: IslandShape, muted: boolean) {
  const g = new THREE.SphereGeometry(1, 96, 36, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2);
  const pos = g.attributes["position"] as THREE.BufferAttribute;
  const colors = new Float32Array(pos.count * 3);
  const pal = ROCK_PALETTE.map((c) => new THREE.Color(c));
  const tmp = new THREE.Color();
  const gray = new THREE.Color("#b9bfc2");
  for (let i = 0; i < pos.count; i++) {
    const vx = pos.getX(i);
    const vz = pos.getZ(i);
    const t = Math.min(1, Math.max(0, -pos.getY(i)));
    const th = Math.atan2(vz, vx);
    const R = shapeRadius(th, s) * 0.985;
    const n = noise2(Math.cos(th) * 3, Math.sin(th) * 3 + t * 4, s.seed + 9);
    const profile = Math.pow(1 - Math.pow(t, 1.5), 0.72);
    const strata = 1 + 0.04 * Math.sin(t * 30 + n * 2.5) + 0.07 * n;
    const r = R * profile * strata;
    const dir = Math.hypot(vx, vz) || 1;
    pos.setXYZ(i, (vx / dir) * r, -t * s.depth - 0.03, (vz / dir) * r);
    const band = Math.floor(t * 7 + 0.7 * Math.sin(th * 3 + s.seed) + n * 0.6);
    const c = t < 0.07 ? pal[0]! : pal[((band % pal.length) + pal.length) % pal.length]!;
    tmp.copy(c).offsetHSL(0, 0, n * 0.04 - t * 0.08);
    if (muted) tmp.lerp(gray, 0.35);
    colors.set([tmp.r, tmp.g, tmp.b], i * 3);
  }
  g.setAttribute("color", new THREE.BufferAttribute(colors, 3));
  g.computeVertexNormals();
  return g;
}

type IslandProps = {
  shape: IslandShape;
  position: [number, number, number];
  grass: string;
  muted?: boolean;
  bobPhase?: number;
  reducedMotion?: boolean | undefined;
  children?: ReactNode;
  onSelect?: (() => void) | undefined;
  onHover?: ((h: boolean) => void) | undefined;
};

export function Island({ shape, position, grass, muted, bobPhase = 0, reducedMotion, children, onSelect, onHover }: IslandProps) {
  const ref = useRef<THREE.Group>(null);
  const grassGeo = useMemo(() => buildGrass(shape, grass), [shape, grass]);
  const rockGeo = useMemo(() => buildRock(shape, !!muted), [shape, muted]);

  useFrame(({ clock }) => {
    if (!ref.current || reducedMotion) return;
    const t = clock.elapsedTime;
    ref.current.position.y = position[1] + Math.sin(t * 0.45 + bobPhase) * 0.12;
    ref.current.rotation.y = Math.sin(t * 0.12 + bobPhase) * 0.02;
  });

  const click = onSelect
    ? (e: ThreeEvent<MouseEvent>) => {
        e.stopPropagation();
        if (e.delta < 6) onSelect();
      }
    : undefined;

  return (
    <group
      ref={ref}
      position={position}
      {...(click ? { onClick: click } : {})}
      {...(onHover
        ? {
            onPointerOver: (e: ThreeEvent<PointerEvent>) => (e.stopPropagation(), onHover(true)),
            onPointerOut: () => onHover(false),
          }
        : {})}
    >
      <mesh geometry={grassGeo} receiveShadow castShadow>
        <meshStandardMaterial vertexColors roughness={0.92} side={THREE.DoubleSide} />
      </mesh>
      <mesh geometry={rockGeo} castShadow receiveShadow>
        <meshStandardMaterial vertexColors roughness={0.95} />
      </mesh>
      {children}
    </group>
  );
}
